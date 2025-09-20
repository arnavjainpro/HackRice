"""
Inventory Checker for RxBridge AI Pharmacy Copilot
Cross-references pharmacy inventory with FDA shortage, recall, and discontinuation data
Author: RxBridge Development Team
"""

import pandas as pd
import numpy as np
from typing import Optional, Dict, List, Tuple
from rapidfuzz import fuzz, process
import re
import logging

# Import the data retrieval modules
from webscraper import scrape_fda_shortages_as_dataframe
from recall import FDARecallRetriever
from supabase_retriever import SupabaseRetriever

logger = logging.getLogger(__name__)

class InventoryChecker:
    """
    Cross-references pharmacy inventory with FDA data to identify at-risk medications
    """
    
    def __init__(self, fda_api_key: Optional[str] = None):
        """
        Initialize the inventory checker
        
        Args:
            fda_api_key: Optional FDA API key for higher rate limits
        """
        self.fda_recall_retriever = FDARecallRetriever(api_key=fda_api_key)
        self.supabase_retriever = None  # Will be initialized when needed
        
        # Fuzzy matching thresholds
        self.exact_match_threshold = 100
        self.fuzzy_match_threshold = 85
        
        # Priority mapping (higher number = higher priority)
        self.priority_map = {
            'Recalled': 3,
            'Currently in Shortage': 2, 
            'Discontinuation': 1,
            'Resolved': 0
        }
    
    def initialize_supabase(self, url: Optional[str] = None, key: Optional[str] = None):
        """Initialize Supabase connection"""
        try:
            self.supabase_retriever = SupabaseRetriever(url=url, key=key)
            return True
        except Exception as e:
            logger.error(f"Failed to initialize Supabase: {e}")
            return False
    
    def clean_drug_name(self, name: str) -> str:
        """
        Clean drug name for better matching
        
        Args:
            name: Raw drug name
            
        Returns:
            Cleaned drug name
        """
        if pd.isna(name) or not isinstance(name, str):
            return ""
        
        # Convert to lowercase and strip whitespace
        clean_name = str(name).lower().strip()
        
        # Remove extra whitespace and special characters
        clean_name = re.sub(r'[^\w\s]', ' ', clean_name)
        clean_name = re.sub(r'\s+', ' ', clean_name).strip()
        
        return clean_name
    
    def find_drug_match(self, drug_name: str, reference_list: List[str]) -> Tuple[Optional[str], int, str]:
        """
        Find best match for drug name using multi-stage approach
        
        Args:
            drug_name: Drug name to match
            reference_list: List of reference drug names
            
        Returns:
            Tuple of (matched_name, confidence_score, match_type)
        """
        if not drug_name or not reference_list:
            return None, 0, "no_match"
        
        clean_target = self.clean_drug_name(drug_name)
        clean_references = [self.clean_drug_name(ref) for ref in reference_list]
        
        # Stage 1: Exact match
        if clean_target in clean_references:
            idx = clean_references.index(clean_target)
            return reference_list[idx], 100, "exact"
        
        # Stage 2: Fuzzy matching with token set ratio
        try:
            best_match = process.extractOne(
                clean_target, 
                reference_list,
                scorer=fuzz.token_set_ratio,
                score_cutoff=self.fuzzy_match_threshold
            )
            
            if best_match:
                return best_match[0], best_match[1], "fuzzy"
                
        except Exception as e:
            logger.warning(f"Fuzzy matching failed for {drug_name}: {e}")
        
        return None, 0, "no_match"
    
    def get_fda_data(self) -> pd.DataFrame:
        """
        Retrieve and combine FDA shortage and recall data
        
        Returns:
            Combined FDA data DataFrame
        """
        logger.info("Retrieving FDA shortage and recall data...")
        
        # Get shortage data
        try:
            shortage_df = scrape_fda_shortages_as_dataframe()
            logger.info(f"Retrieved {len(shortage_df)} shortage records")
        except Exception as e:
            logger.error(f"Failed to get shortage data: {e}")
            shortage_df = pd.DataFrame()
        
        # Get recall data
        try:
            recall_df = self.fda_recall_retriever.get_all_recalls_df(limit=500)
            logger.info(f"Retrieved {len(recall_df)} recall records")
            
            # Standardize recall data format
            if not recall_df.empty:
                recall_df = recall_df.rename(columns={'type': 'status'})
                recall_df['status'] = 'Recalled'
                
        except Exception as e:
            logger.error(f"Failed to get recall data: {e}")
            recall_df = pd.DataFrame()
        
        # Combine datasets
        combined_data = []
        
        # Add shortage data
        if not shortage_df.empty:
            for _, row in shortage_df.iterrows():
                combined_data.append({
                    'fda_drug_name': row['generic_name'],
                    'status': row['status'],
                    'source': 'shortage_db',
                    'recall_classification': None,
                    'recall_reason': None
                })
        
        # Add recall data
        if not recall_df.empty:
            for _, row in recall_df.iterrows():
                combined_data.append({
                    'fda_drug_name': row['drug_name'],
                    'status': 'Recalled',
                    'source': 'recall_api',
                    'recall_classification': row.get('classification', ''),
                    'recall_reason': row.get('reason', '')
                })
        
        if combined_data:
            fda_df = pd.DataFrame(combined_data)
            # Remove duplicates, keeping highest priority status
            fda_df['priority'] = fda_df['status'].map(self.priority_map)
            fda_df = fda_df.sort_values('priority', ascending=False)
            fda_df = fda_df.drop_duplicates(subset=['fda_drug_name'], keep='first')
            
            logger.info(f"Combined FDA data: {len(fda_df)} unique drugs")
            return fda_df
        else:
            logger.warning("No FDA data retrieved")
            return pd.DataFrame()
    
    def get_inventory_data(self) -> pd.DataFrame:
        """
        Retrieve pharmacy inventory data
        
        Returns:
            Inventory DataFrame
        """
        if not self.supabase_retriever:
            logger.error("Supabase not initialized")
            return pd.DataFrame()
        
        try:
            inventory_df = self.supabase_retriever.get_pharmacy_inventory()
            logger.info(f"Retrieved {len(inventory_df)} inventory records")
            return inventory_df
        except Exception as e:
            logger.error(f"Failed to get inventory data: {e}")
            return pd.DataFrame()
    
    def _calculate_severity(self, status: str, recall_class: str, days_supply: float, stock: int) -> str:
        """
        Calculate severity level based on multiple factors
        
        Args:
            status: FDA status (Recalled, Currently in Shortage, etc.)
            recall_class: Recall classification (Class I, II, III)
            days_supply: Days of supply remaining
            stock: Current stock level
            
        Returns:
            Severity level string
        """
        # Recalled items
        if status == 'Recalled':
            if recall_class == 'Class I':
                return 'Critical'
            elif recall_class == 'Class II':
                return 'High'
            else:
                return 'Medium'
        
        # Shortage items
        elif status == 'Currently in Shortage':
            if days_supply <= 3:
                return 'Critical'
            elif days_supply <= 7:
                return 'High'
            elif days_supply <= 14:
                return 'Medium'
            else:
                return 'Low'
        
        # Discontinued items
        elif status == 'Discontinuation':
            if days_supply <= 7:
                return 'High'
            elif days_supply <= 30:
                return 'Medium'
            else:
                return 'Low'
        
        # Default
        return 'Low'

    def _calculate_dashboard_alert_level(self, status: str, recall_class: str, days_supply: float, is_flagged: bool) -> str:
        """
        Calculate dashboard alert level (Red/Orange/Yellow/Blue) for RxBridge UI
        
        Args:
            status: FDA status
            recall_class: Recall classification
            days_supply: Days of supply remaining
            is_flagged: Whether item has FDA issue (recall/shortage/discontinuation)
            
        Returns:
            Alert level string for dashboard
        """
        # Convert days to weeks for easier calculation
        weeks_supply = days_supply / 7
        
        if is_flagged:
            # Item has FDA issue (recall, shortage, or discontinuation)
            if weeks_supply < 2:  # Less than 2 weeks
                return 'RED'
            elif weeks_supply <= 8.57:  # 2 weeks to 60 days (60/7 = 8.57 weeks)
                return 'PURPLE' 
            else:  # Greater than 60 days but still flagged
                return 'YELLOW'
        else:
            # No FDA issue identified
            if weeks_supply < 2:  # Less than 2 weeks - just needs refill
                return 'BLUE'
            else:
                # Adequate supply, no issues - don't flag
                return None
        
    def check_inventory_risks(self) -> pd.DataFrame:
        """
        Main function to check inventory against FDA data - Updated for separated arrays
        
        Returns:
            DataFrame with flagged inventory items AND low stock items
        """
        print("=" * 60)
        print("STARTING INVENTORY RISK CHECK")
        print("=" * 60)
        
        # Get data
        fda_df = self.get_fda_data()
        inventory_df = self.get_inventory_data()
        
        if inventory_df.empty:
            print("❌ No inventory data available")
            return pd.DataFrame()
        
        print(f"\n📊 DATA SUMMARY:")
        print(f"   FDA entries: {len(fda_df) if not fda_df.empty else 0}")
        print(f"   Inventory items: {len(inventory_df)}")
        
        # Show sample data
        if not fda_df.empty:
            print(f"\n🔍 SAMPLE FDA DATA:")
            for i, row in fda_df.head(3).iterrows():
                print(f"   - {row['fda_drug_name']} → {row['status']}")
        
        print(f"\n📦 SAMPLE INVENTORY DATA:")
        for i, row in inventory_df.head(3).iterrows():
            stock = row.get('stock', 0)
            print(f"   - {row.get('drug_name', 'Unknown')} (Stock: {stock})")
        
        # Prepare for matching
        fda_names = fda_df['fda_drug_name'].tolist() if not fda_df.empty else []
        flagged_items = []
        
        print(f"\n🔄 STARTING MATCHING PROCESS...")
        print("-" * 40)
        
        # Check each inventory item
        for idx, inv_row in inventory_df.iterrows():
            drug_name = inv_row.get('drug_name', '')
            stock = inv_row.get('stock', 0)
            daily_dispense = inv_row.get('average_daily_dispense', 0)
            days_supply = stock / daily_dispense if daily_dispense > 0 else float('inf')
            
            # Check if item matches FDA data
            fda_match = None
            matched_name = None
            confidence = 0
            match_type = "no_match"
            
            if fda_names:
                matched_name, confidence, match_type = self.find_drug_match(drug_name, fda_names)
                if matched_name and confidence >= self.fuzzy_match_threshold:
                    fda_match = fda_df[fda_df['fda_drug_name'] == matched_name].iloc[0]
            
            # Calculate alert level
            is_flagged = fda_match is not None
            alert_level = self._calculate_dashboard_alert_level(
                fda_match['status'] if fda_match is not None else '',
                fda_match.get('recall_classification', '') if fda_match is not None else '',
                days_supply,
                is_flagged
            )
            
            # Only include items that need attention (have an alert level)
            if alert_level:
                # Calculate severity for backwards compatibility
                if fda_match is not None:
                    severity = self._calculate_severity(
                        fda_match['status'],
                        fda_match.get('recall_classification', ''),
                        days_supply,
                        stock
                    )
                else:
                    severity = 'Low'  # For BLUE alerts (just low stock)
                
                # Print match details
                if is_flagged:
                    print(f"🚨 FDA ISSUE FOUND:")
                    print(f"   Inventory: {drug_name}")
                    print(f"   FDA Match: {matched_name}")
                    print(f"   Confidence: {confidence}% ({match_type})")
                    print(f"   Status: {fda_match['status']}")
                else:
                    print(f"📦 LOW STOCK ALERT:")
                    print(f"   Inventory: {drug_name}")
                    print(f"   No FDA issues found")
                
                print(f"   Stock: {stock} units")
                print(f"   Days Supply: {days_supply:.1f}")
                print(f"   Alert Level: {alert_level}")
                print("-" * 40)
                
                flagged_item = {
                    # Inventory info
                    'drug_name': drug_name,
                    'current_stock': stock,
                    'average_daily_dispense': daily_dispense,
                    'days_of_supply': days_supply,
                    
                    # FDA matching info (if applicable)
                    'fda_matched_name': matched_name if is_flagged else '',
                    'match_confidence': confidence if is_flagged else 0,
                    'match_type': match_type if is_flagged else 'no_match',
                    
                    # Risk flags
                    'flag_status': fda_match['status'] if is_flagged else 'Low Stock Only',
                    'flag_source': fda_match['source'] if is_flagged else 'inventory_analysis',
                    'recall_classification': fda_match.get('recall_classification', '') if is_flagged else '',
                    'recall_reason': fda_match.get('recall_reason', '') if is_flagged else '',
                    
                    # Dashboard classifications
                    'alert_level': alert_level,
                    'priority_score': self.priority_map.get(fda_match['status'], 0) if is_flagged else 0,
                    'severity': severity,
                    'requires_immediate_action': alert_level in ['RED', 'PURPLE'],
                    'has_fda_issue': is_flagged
                }
                
                flagged_items.append(flagged_item)
            else:
                # Show first few non-flagged items
                if idx < 5:
                    print(f"✅ No issues: {drug_name} ({days_supply:.1f} days supply)")
        
        # Create JSON response format with separated arrays
        response_data = self._format_api_response(flagged_items)
        
        # Print JSON output
        import json
        print("\n" + "=" * 60)
        print("JSON RESPONSE WITH SEPARATED ARRAYS")
        print("=" * 60)
        print(json.dumps(response_data, indent=2, default=str))
        
        # Print summary of separation
        print(f"\n📊 SEPARATION SUMMARY:")
        print(f"   Recalls: {len(response_data['recalls'])} items")
        print(f"   Other Alerts: {len(response_data['other_alerts'])} items")
        print(f"   Total: {len(flagged_items)} items")
        
        # Also return DataFrame for backwards compatibility
        if flagged_items:
            result_df = pd.DataFrame(flagged_items)
            # Sort by alert level priority then by days of supply
            alert_priority = {'RED': 4, 'PURPLE': 3, 'YELLOW': 2, 'BLUE': 1}
            result_df['alert_priority'] = result_df['alert_level'].map(alert_priority)
            result_df = result_df.sort_values(['alert_priority', 'days_of_supply'], ascending=[False, True])
            return result_df.drop('alert_priority', axis=1)  # Remove helper column
        else:
            return pd.DataFrame()
    
    def _format_api_response(self, flagged_items: list) -> dict:
        """
        Format flagged items as API response JSON with separate arrays for recalls and other alerts
        
        Args:
            flagged_items: List of flagged item dictionaries
            
        Returns:
            Formatted API response dictionary with separate recall and non-recall arrays
        """
        if not flagged_items:
            return {
                "status": "success",
                "timestamp": pd.Timestamp.now().isoformat(),
                "summary": {
                    "total_items_checked": 0,
                    "items_requiring_attention": 0,
                    "recall_items": 0,
                    "shortage_items": 0,
                    "discontinuation_items": 0,
                    "low_stock_items": 0,
                    "alert_breakdown": {},
                    "critical_items": 0
                },
                "recalls": [],
                "other_alerts": []
            }
        
        # Separate recalls from other alerts
        recalls = []
        other_alerts = []
        
        for item in flagged_items:
            # Check if item is a recall (status contains 'Recalled')
            if 'Recalled' in item.get('flag_status', ''):
                recalls.append(item)
            else:
                other_alerts.append(item)
        
        # Calculate summary statistics
        alert_counts = {}
        recall_count = len(recalls)
        shortage_count = len([item for item in other_alerts if 'Shortage' in item.get('flag_status', '')])
        discontinuation_count = len([item for item in other_alerts if 'Discontinuation' in item.get('flag_status', '')])
        low_stock_count = len([item for item in other_alerts if 'Low Stock' in item.get('flag_status', '')])
        
        for item in flagged_items:
            alert_level = item['alert_level']
            alert_counts[alert_level] = alert_counts.get(alert_level, 0) + 1
        
        critical_items = len([item for item in flagged_items if item['alert_level'] in ['RED', 'PURPLE']])
        
        # Sort function for both arrays
        alert_priority = {'RED': 4, 'PURPLE': 3, 'YELLOW': 2, 'BLUE': 1}
        
        def sort_items(items):
            return sorted(items, key=lambda x: (
                alert_priority.get(x['alert_level'], 0), 
                -x['days_of_supply']
            ), reverse=True)
        
        # Sort both arrays
        sorted_recalls = sort_items(recalls)
        sorted_other_alerts = sort_items(other_alerts)
        
        # Format items for response
        def format_item(item, idx):
            return {
                "id": idx + 1,
                "drug_name": item['drug_name'],
                "alert_level": item['alert_level'],
                "days_of_supply": round(item['days_of_supply'], 1),
                "current_stock": item['current_stock'],
                "average_daily_dispense": item['average_daily_dispense'],
                "fda_status": item['flag_status'],
                "fda_matched_name": item['fda_matched_name'],
                "match_confidence": round(item['match_confidence'], 1) if item['match_confidence'] > 0 else None,
                "recall_classification": item['recall_classification'] if item['recall_classification'] else None,
                "recall_reason": item['recall_reason'] if item['recall_reason'] else None,
                "requires_immediate_action": item['requires_immediate_action'],
                "has_fda_issue": item['has_fda_issue']
            }
        
        return {
            "status": "success",
            "timestamp": pd.Timestamp.now().isoformat(),
            "summary": {
                "total_items_checked": len(flagged_items),  # This would be total inventory in real API
                "items_requiring_attention": len(flagged_items),
                "recall_items": recall_count,
                "shortage_items": shortage_count,
                "discontinuation_items": discontinuation_count,
                "low_stock_items": low_stock_count,
                "alert_breakdown": alert_counts,
                "critical_items": critical_items,
                "avg_days_supply": sum(item['days_of_supply'] for item in flagged_items) / len(flagged_items)
            },
            "recalls": [
                format_item(item, idx) for idx, item in enumerate(sorted_recalls)
            ],
            "other_alerts": [
                format_item(item, idx) for idx, item in enumerate(sorted_other_alerts)
            ]
        }
    
    def get_summary_stats(self, flagged_df: pd.DataFrame) -> Dict:
        """
        Generate summary statistics for flagged items
        
        Args:
            flagged_df: DataFrame of flagged items
            
        Returns:
            Dictionary with summary statistics
        """
        if flagged_df.empty:
            return {"total_flagged": 0}
        
        return {
            "total_flagged": len(flagged_df),
            "by_status": flagged_df['flag_status'].value_counts().to_dict(),
            "by_severity": flagged_df['severity'].value_counts().to_dict(),
            "immediate_action_needed": len(flagged_df[flagged_df['requires_immediate_action'] == True]),
            "avg_days_supply": flagged_df['days_of_supply'].mean(),
            "critical_items": flagged_df[flagged_df['severity'] == 'Critical']['drug_name'].tolist()
        }


# Convenience function for quick use
def check_pharmacy_inventory(
    supabase_url: Optional[str] = None,
    supabase_key: Optional[str] = None,
    fda_api_key: Optional[str] = None
) -> pd.DataFrame:
    """
    Quick function to check inventory risks
    
    Args:
        supabase_url: Supabase URL
        supabase_key: Supabase key  
        fda_api_key: FDA API key
        
    Returns:
        DataFrame with flagged inventory items
    """
    checker = InventoryChecker(fda_api_key=fda_api_key)
    
    if not checker.initialize_supabase(supabase_url, supabase_key):
        return pd.DataFrame()
    
    return checker.check_inventory_risks()


# Example usage
if __name__ == "__main__":
    # Load environment variables from .env file
    try:
        from dotenv import load_dotenv
        load_dotenv()
        print("Environment variables loaded from .env file")
    except ImportError:
        print("python-dotenv not installed, trying to use system env vars")
    
    # Get credentials from environment variables
    import os
    supabase_url = os.getenv('VITE_SUPABASE_URL') or os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('VITE_SUPABASE_ANON_KEY') or os.getenv('SUPABASE_KEY')
    
    print(f"SUPABASE_URL: {supabase_url[:30]}..." if supabase_url else "SUPABASE_URL not found")
    print(f"SUPABASE_KEY: {supabase_key[:30]}..." if supabase_key else "SUPABASE_KEY not found")
    
    # Set up logging
    import logging
    logging.basicConfig(level=logging.INFO)
    
    # Initialize checker without FDA API key (uses public rate limits)
    checker = InventoryChecker()
    
    # Initialize Supabase using environment variables
    if checker.initialize_supabase(url=supabase_url, key=supabase_key):
        print("Supabase connection successful!")
        
        # Check inventory
        flagged_items = checker.check_inventory_risks()
        
        # Get summary stats
        stats = checker.get_summary_stats(flagged_items)
        print("Summary:", stats)
    else:
        print("Failed to connect to Supabase. Check your credentials.")