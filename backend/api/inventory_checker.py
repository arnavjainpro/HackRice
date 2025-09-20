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
        
        # Remove common suffixes that might interfere with matching
        suffixes_to_remove = [
            r'\s+injection.*$',
            r'\s+tablet.*$', 
            r'\s+capsule.*$',
            r'\s+solution.*$',
            r'\s+powder.*$',
            r'\s+suspension.*$',
            r'\s+syrup.*$',
            r'\s+gel.*$',
            r'\s+cream.*$',
            r'\s+ointment.*$'
        ]
        
        for suffix in suffixes_to_remove:
            clean_name = re.sub(suffix, '', clean_name)
        
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
    
    def check_inventory_risks(self) -> pd.DataFrame:
        """
        Main function to check inventory against FDA data
        
        Returns:
            DataFrame with flagged inventory items
        """
        print("=" * 60)
        print("STARTING INVENTORY RISK CHECK")
        print("=" * 60)
        
        # Get data
        fda_df = self.get_fda_data()
        inventory_df = self.get_inventory_data()
        
        if fda_df.empty:
            print("❌ No FDA data available for comparison")
            return pd.DataFrame()
        
        if inventory_df.empty:
            print("❌ No inventory data available")
            return pd.DataFrame()
        
        print(f"\n📊 DATA SUMMARY:")
        print(f"   FDA entries: {len(fda_df)}")
        print(f"   Inventory items: {len(inventory_df)}")
        
        # Show sample FDA data
        print(f"\n🔍 SAMPLE FDA DATA:")
        for i, row in fda_df.head(3).iterrows():
            print(f"   - {row['fda_drug_name']} → {row['status']}")
        
        # Show sample inventory data  
        print(f"\n📦 SAMPLE INVENTORY DATA:")
        for i, row in inventory_df.head(3).iterrows():
            stock = row.get('stock', 0)
            print(f"   - {row.get('drug_name', 'Unknown')} (Stock: {stock})")
        
        # Prepare for matching
        fda_names = fda_df['fda_drug_name'].tolist()
        flagged_items = []
        
        print(f"\n🔄 STARTING MATCHING PROCESS...")
        print("-" * 40)
        
        # Check each inventory item
        for idx, inv_row in inventory_df.iterrows():
            drug_name = inv_row.get('drug_name', '')
            
            # Find match in FDA data
            matched_name, confidence, match_type = self.find_drug_match(drug_name, fda_names)
            
            if matched_name and confidence >= self.fuzzy_match_threshold:
                # Get FDA info for matched drug
                fda_info = fda_df[fda_df['fda_drug_name'] == matched_name].iloc[0]
                
                # Determine severity and alert level
                severity = self._calculate_severity(
                    fda_info['status'],
                    fda_info.get('recall_classification', ''),
                    days_supply,
                    stock
                )
                
                alert_level = self._calculate_dashboard_alert_level(
                    fda_info['status'],
                    fda_info.get('recall_classification', ''),
                    days_supply,
                    severity
                )
                
                # Print match details
                print(f"🚨 MATCH FOUND:")
                print(f"   Inventory: {drug_name}")
                print(f"   FDA Match: {matched_name}")
                print(f"   Confidence: {confidence}% ({match_type})")
                print(f"   Status: {fda_info['status']}")
                print(f"   Stock: {stock} units")
                print(f"   Days Supply: {days_supply:.1f}")
                print(f"   Severity: {severity}")
                print(f"   Alert Level: {alert_level}")  # Show dashboard alert level
                if fda_info.get('recall_classification'):
                    print(f"   Recall Class: {fda_info['recall_classification']}")
                print("-" * 40)
                
                flagged_item = {
                    # Inventory info
                    'drug_name': drug_name,
                    'current_stock': stock,
                    'average_daily_dispense': daily_dispense,
                    'days_of_supply': days_supply,
                    
                    # FDA matching info
                    'fda_matched_name': matched_name,
                    'match_confidence': confidence,
                    'match_type': match_type,
                    
                    # Risk flags
                    'flag_status': fda_info['status'],
                    'flag_source': fda_info['source'],
                    'recall_classification': fda_info.get('recall_classification', ''),
                    'recall_reason': fda_info.get('recall_reason', ''),
                    
                    # Calculated fields
                    'priority_score': self.priority_map.get(fda_info['status'], 0),
                    'severity': severity,
                    'requires_immediate_action': severity in ['Critical', 'High']
                }
                
                flagged_items.append(flagged_item)
            else:
                # Optionally show non-matches for first few items
                if idx < 5:  # Only show first 5 non-matches to avoid spam
                    print(f"✅ No match: {drug_name}")
        
        print("\n" + "=" * 60)
        print("FINAL RESULTS")
        print("=" * 60)
        
        if flagged_items:
            result_df = pd.DataFrame(flagged_items)
            # Sort by priority and severity
            result_df = result_df.sort_values(['priority_score', 'severity'], ascending=[False, False])
            
            print(f"🚨 FOUND {len(result_df)} FLAGGED ITEMS:")
            
            # Count by status
            status_counts = result_df['flag_status'].value_counts()
            for status, count in status_counts.items():
                print(f"   📊 {status}: {count} items")
            
            # Count by severity
            severity_counts = result_df['severity'].value_counts()
            print(f"\n📈 SEVERITY BREAKDOWN:")
            for severity, count in severity_counts.items():
                print(f"   🔥 {severity}: {count} items")
            
            # Show top 5 critical items
            critical_items = result_df[result_df['severity'].isin(['Critical', 'High'])]
            if not critical_items.empty:
                print(f"\n⚠️  TOP PRIORITY ITEMS:")
                for _, item in critical_items.head(5).iterrows():
                    print(f"   - {item['drug_name']} ({item['flag_status']}) - {item['severity']}")
            
            print(f"\n📋 FULL RESULTS DATAFRAME:")
            print(result_df[['drug_name', 'flag_status', 'severity', 'current_stock', 'days_of_supply']].to_string())
            
            return result_df
        else:
            print("✅ No flagged items found - all inventory items are safe!")
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
                return 'ORANGE' 
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
        Main function to check inventory against FDA data - Updated for new alert system
        
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
                    'requires_immediate_action': alert_level in ['RED', 'ORANGE'],
                    'has_fda_issue': is_flagged
                }
                
                flagged_items.append(flagged_item)
            else:
                # Show first few non-flagged items
                if idx < 5:
                    print(f"✅ No issues: {drug_name} ({days_supply:.1f} days supply)")
        
        print("\n" + "=" * 60)
        print("FINAL RESULTS")
        print("=" * 60)
        
        if flagged_items:
            result_df = pd.DataFrame(flagged_items)
            # Sort by alert level priority then by days of supply
            alert_priority = {'RED': 4, 'ORANGE': 3, 'YELLOW': 2, 'BLUE': 1}
            result_df['alert_priority'] = result_df['alert_level'].map(alert_priority)
            result_df = result_df.sort_values(['alert_priority', 'days_of_supply'], ascending=[False, True])
            
            print(f"🚨 FOUND {len(result_df)} ITEMS REQUIRING ATTENTION:")
            
            # Count by alert level
            alert_counts = result_df['alert_level'].value_counts()
            for alert, count in alert_counts.items():
                print(f"   📊 {alert}: {count} items")
            
            # Show top priority items
            critical_items = result_df[result_df['alert_level'].isin(['RED', 'ORANGE'])]
            if not critical_items.empty:
                print(f"\n⚠️ TOP PRIORITY ITEMS:")
                for _, item in critical_items.head(5).iterrows():
                    print(f"   - {item['drug_name']} ({item['alert_level']}) - {item['days_of_supply']:.1f} days")
            
            print(f"\n📋 FULL RESULTS DATAFRAME:")
            display_cols = ['drug_name', 'alert_level', 'flag_status', 'current_stock', 'days_of_supply']
            print(result_df[display_cols].to_string())
            
            return result_df.drop('alert_priority', axis=1)  # Remove helper column
        else:
            print("✅ No items requiring attention - all inventory levels are adequate!")
            return pd.DataFrame()
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
    
    # Use the correct environment variable names (with VITE_ prefix)
    import os
    supabase_url = os.getenv('VITE_SUPABASE_URL') or os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('VITE_SUPABASE_ANON_KEY') or os.getenv('SUPABASE_KEY')
    
    print(f"SUPABASE_URL: {supabase_url[:30]}..." if supabase_url else "SUPABASE_URL not found")
    print(f"SUPABASE_KEY: {supabase_key[:30]}..." if supabase_key else "SUPABASE_KEY not found")
    
    # Set up logging
    import logging
    logging.basicConfig(level=logging.INFO)
    
    # Initialize checker
    checker = InventoryChecker()
    
    # Initialize Supabase using the correct credentials
    if checker.initialize_supabase(url=supabase_url, key=supabase_key):
        print("Supabase connection successful!")
        
        # Check inventory
        flagged_items = checker.check_inventory_risks()
        
        # Get summary stats
        stats = checker.get_summary_stats(flagged_items)
        print("Summary:", stats)
    else:
        print("Failed to connect to Supabase. Check your credentials.")