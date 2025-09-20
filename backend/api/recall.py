"""
FDA Drug Recall Data Retriever
Fetches data from FDA's drug recall API only
Author: API Integration Team Member
"""

import requests
import pandas as pd
import json
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import time
import logging

logger = logging.getLogger(__name__)

class FDARecallRetriever:
    """Retriever for FDA drug recall data only"""
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize FDA API client
        
        Args:
            api_key: FDA API key (optional but recommended for higher rate limits)
        """
        self.api_key = api_key
        
        # FDA API endpoint - only recalls
        self.drug_recall_api = "https://api.fda.gov/drug/enforcement.json"
        
        # Request headers
        self.headers = {
            'User-Agent': 'FDA-Drug-Analysis/1.0',
            'Accept': 'application/json'
        }
        
        # Rate limiting (FDA allows 240 requests per minute for public, 1000 with API key)
        self.rate_limit_delay = 0.1 if api_key else 0.3  # Reduced delays for speed
        
    def _make_api_request(self, url: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Make API request with error handling and rate limiting
        
        Args:
            url: API endpoint URL
            params: Query parameters
            
        Returns:
            API response as dictionary
        """
        if self.api_key:
            params['api_key'] = self.api_key
            
        try:
            logger.info(f"Making request to: {url}")
            logger.debug(f"Parameters: {params}")
            
            response = requests.get(url, params=params, headers=self.headers, timeout=30)
            response.raise_for_status()
            
            # Rate limiting
            time.sleep(self.rate_limit_delay)
            
            return response.json()
            
        except requests.exceptions.RequestException as e:
            logger.error(f"API request failed: {e}")
            return {"error": str(e)}
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {e}")
            return {"error": f"Invalid JSON response: {e}"}
    
    def get_drug_recalls(self, search_term: Optional[str] = None) -> pd.DataFrame:
        """
        Fetch drug recall data from FDA API
        
        Args:
            search_term: Optional search term to filter recalls
            
        Returns:
            DataFrame with recall data
        """
        logger.info("Fetching all available drug recalls (no limit)")
        
        params = {
            'limit': 1000  # Use FDA's maximum allowed per request
        }
        
        # Add search filter if provided
        if search_term:
            params['search'] = f'product_description:"{search_term}"'
        else:
            # Default search for drug-related recalls
            params['search'] = 'product_type:"Drugs"'
        
        response_data = self._make_api_request(self.drug_recall_api, params)
        
        if "error" in response_data:
            logger.error(f"Failed to fetch recalls: {response_data['error']}")
            return pd.DataFrame()
        
        if "results" not in response_data or not response_data["results"]:
            logger.warning("No recall results found")
            return pd.DataFrame()
        
        # Process recall data
        recalls = []
        for item in response_data["results"]:
            try:
                recall_data = {
                    'drug_name': self._extract_drug_name(item.get('product_description', ['Unknown'])),
                    'recall_date': item.get('recall_initiation_date', ''),
                    'reason': item.get('reason_for_recall', ''),
                    'classification': item.get('classification', ''),
                    'status': item.get('status', ''),
                    'voluntary_mandated': item.get('voluntary_mandated', ''),
                    'distribution_pattern': item.get('distribution_pattern', ''),
                    'product_quantity': item.get('product_quantity', ''),
                    'event_id': item.get('event_id', ''),
                    'type': 'Recalled'  # Identifier column
                }
                recalls.append(recall_data)
            except Exception as e:
                logger.warning(f"Error processing recall item: {e}")
                continue
        
        logger.info(f"Successfully processed {len(recalls)} recall records")
        return pd.DataFrame(recalls)
    
    def _extract_drug_name(self, product_descriptions: List[str]) -> str:
        """
        Extract drug name from product descriptions
        
        Args:
            product_descriptions: List of product description strings
            
        Returns:
            Extracted drug name
        """
        if not product_descriptions:
            return "Unknown"
        
        # Take the first description and try to extract the drug name
        description = product_descriptions[0]
        
        # Simple extraction - take text before common separators
        separators = [',', '(', ' - ', ' tablet', ' capsule', ' injection']
        
        drug_name = description
        for sep in separators:
            if sep in description:
                drug_name = description.split(sep)[0].strip()
                break
        
        return drug_name[:100]  # Limit length
    
    def get_all_recalls_df(self, limit: Optional[int] = None) -> pd.DataFrame:
        """
        Get drug recalls with optimized performance - focused on speed
        
        Args:
            limit: Maximum number of records to fetch (default 500 for fast performance)
            
        Returns:
            Cleaned DataFrame with recall data
        """
        # Aggressive limit for performance - prioritize speed over completeness
        effective_limit = limit if limit is not None else 500
        
        logger.info(f"Fetching {effective_limit} most critical recalls for fast performance")
        
        try:
            # Strategy: Get only the most critical and recent data
            # Focus on Class I recalls (most dangerous) from the last year
            
            params = {
                'search': 'product_type:"Drugs" AND classification:"Class I"',
                'limit': min(effective_limit, 500)  # Stay well under FDA limits
            }
            
            logger.info("Fetching critical Class I drug recalls only")
            response_data = self._make_api_request(self.drug_recall_api, params)
            
            if "error" in response_data or "results" not in response_data or not response_data["results"]:
                logger.warning("No Class I recalls found, falling back to general search")
                # Fallback to general drug recalls with smaller limit
                params = {
                    'search': 'product_type:"Drugs"',
                    'limit': min(200, effective_limit)  # Much smaller fallback
                }
                response_data = self._make_api_request(self.drug_recall_api, params)
            
            if "error" in response_data or "results" not in response_data:
                logger.error("Failed to fetch any recall data")
                return pd.DataFrame()
            
            # Process results quickly
            recalls = []
            for item in response_data["results"]:
                try:
                    recall_data = {
                        'drug_name': self._extract_drug_name(item.get('product_description', ['Unknown'])),
                        'recall_date': item.get('recall_initiation_date', ''),
                        'reason': item.get('reason_for_recall', ''),
                        'classification': item.get('classification', ''),
                        'status': item.get('status', ''),
                        'voluntary_mandated': item.get('voluntary_mandated', ''),
                        'distribution_pattern': item.get('distribution_pattern', ''),
                        'product_quantity': item.get('product_quantity', ''),
                        'event_id': item.get('event_id', ''),
                        'type': 'Recalled'
                    }
                    recalls.append(recall_data)
                except Exception as e:
                    logger.warning(f"Error processing recall: {e}")
                    continue
            
            if not recalls:
                logger.warning("No recall data processed")
                return pd.DataFrame()
            
            # Quick DataFrame creation and cleaning
            df = pd.DataFrame(recalls)
            df = self._clean_recall_data(df)
            
            logger.info(f"Fast recall fetch completed: {len(df)} records in minimal time")
            return df
            
        except Exception as e:
            logger.error(f"Error in fast recall fetch: {e}")
            # Return empty DataFrame rather than hanging
            return pd.DataFrame()
    
    def _clean_recall_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Clean and standardize the recall dataset
        
        Args:
            df: Raw recall dataframe
            
        Returns:
            Cleaned dataframe
        """
        if df.empty:
            return df
        
        # Standardize drug names
        df['drug_name'] = df['drug_name'].astype(str).str.strip().str.title()
        
        # Convert dates
        if 'recall_date' in df.columns:
            df['recall_date'] = pd.to_datetime(df['recall_date'], errors='coerce')
        
        # Fill missing values
        df = df.fillna('')
        
        # Remove duplicates based on drug name and event_id
        df = df.drop_duplicates(subset=['drug_name', 'event_id'], keep='first')
        
        # Sort by recall date (most recent first)
        df = df.sort_values('recall_date', ascending=False, na_position='last').reset_index(drop=True)
        
        return df
    
    def search_specific_drug_recalls(self, drug_name: str) -> pd.DataFrame:
        """
        Search for recalls of a specific drug
        
        Args:
            drug_name: Name of the drug to search for
            
        Returns:
            DataFrame with recall results for the specific drug
        """
        logger.info(f"Searching for recalls of drug: {drug_name}")
        
        recalls_df = self.get_drug_recalls(search_term=drug_name)
        
        if not recalls_df.empty:
            recalls_df = self._clean_recall_data(recalls_df)
        
        return recalls_df
    
    def get_recent_recalls(self, days_back: int = 30) -> pd.DataFrame:
        """
        Get recent drug recalls within specified timeframe
        
        Args:
            days_back: Number of days to look back
            
        Returns:
            DataFrame with recent recalls
        """
        logger.info(f"Fetching recalls from last {days_back} days")
        
        # Calculate date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days_back)
        
        # Format dates for FDA API (YYYYMMDD)
        start_date_str = start_date.strftime('%Y%m%d')
        end_date_str = end_date.strftime('%Y%m%d')
        
        # Add date filter to search
        date_search = f'recall_initiation_date:[{start_date_str} TO {end_date_str}]'
        
        params = {
            'search': f'product_type:"Drugs" AND {date_search}',
            'limit': 1000  # Use maximum available
        }
        
        response_data = self._make_api_request(self.drug_recall_api, params)
        
        if "error" in response_data or "results" not in response_data:
            logger.warning("No recent recalls found")
            return pd.DataFrame()
        
        # Process recalls
        recalls = []
        for item in response_data["results"]:
            try:
                recall_data = {
                    'drug_name': self._extract_drug_name(item.get('product_description', ['Unknown'])),
                    'recall_date': item.get('recall_initiation_date', ''),
                    'reason': item.get('reason_for_recall', ''),
                    'classification': item.get('classification', ''),
                    'status': item.get('status', ''),
                    'voluntary_mandated': item.get('voluntary_mandated', ''),
                    'distribution_pattern': item.get('distribution_pattern', ''),
                    'product_quantity': item.get('product_quantity', ''),
                    'event_id': item.get('event_id', ''),
                    'type': 'Recalled'
                }
                recalls.append(recall_data)
            except Exception as e:
                logger.warning(f"Error processing recent recall: {e}")
                continue
        
        df = pd.DataFrame(recalls)
        return self._clean_recall_data(df) if not df.empty else df
    
    def get_recalls_by_classification(self, classification: str = "Class I") -> pd.DataFrame:
        """
        Get recalls by classification (Class I, Class II, Class III)
        
        Args:
            classification: FDA recall classification
            
        Returns:
            DataFrame with recalls of specified classification
        """
        logger.info(f"Fetching {classification} drug recalls")
        
        params = {
            'search': f'product_type:"Drugs" AND classification:"{classification}"',
            'limit': 1000  # Use maximum available
        }
        
        response_data = self._make_api_request(self.drug_recall_api, params)
        
        if "error" in response_data or "results" not in response_data:
            logger.warning(f"No {classification} recalls found")
            return pd.DataFrame()
        
        # Process recalls
        recalls = []
        for item in response_data["results"]:
            try:
                recall_data = {
                    'drug_name': self._extract_drug_name(item.get('product_description', ['Unknown'])),
                    'recall_date': item.get('recall_initiation_date', ''),
                    'reason': item.get('reason_for_recall', ''),
                    'classification': item.get('classification', ''),
                    'status': item.get('status', ''),
                    'voluntary_mandated': item.get('voluntary_mandated', ''),
                    'distribution_pattern': item.get('distribution_pattern', ''),
                    'product_quantity': item.get('product_quantity', ''),
                    'event_id': item.get('event_id', ''),
                    'type': 'Recalled'
                }
                recalls.append(recall_data)
            except Exception as e:
                logger.warning(f"Error processing {classification} recall: {e}")
                continue
        
        df = pd.DataFrame(recalls)
        return self._clean_recall_data(df) if not df.empty else df
    
    def get_recall_summary_stats(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Get summary statistics for recall data
        
        Args:
            df: DataFrame with recall data
            
        Returns:
            Dictionary with summary statistics
        """
        if df.empty:
            return {"error": "No data to analyze"}
        
        stats = {
            'total_recalls': len(df),
            'unique_drugs': df['drug_name'].nunique(),
            'date_range': {
                'earliest': df['recall_date'].min() if df['recall_date'].notna().any() else None,
                'latest': df['recall_date'].max() if df['recall_date'].notna().any() else None
            },
            'classifications': df['classification'].value_counts().to_dict(),
            'status': df['status'].value_counts().to_dict(),
            'voluntary_vs_mandated': df['voluntary_mandated'].value_counts().to_dict(),
            'top_reasons': df['reason'].value_counts().head(5).to_dict()
        }
        
        return stats