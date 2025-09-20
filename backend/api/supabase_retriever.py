"""
Fixed SupabaseRetriever class with correct column names
"""

import pandas as pd
from supabase import create_client, Client
from typing import Optional, List, Dict, Any
import os

class SupabaseRetriever:
    """Retriever class for Supabase pharmacy inventory data - FIXED VERSION"""
    
    def __init__(self, url: Optional[str] = None, key: Optional[str] = None):
        """
        Initialize Supabase client
        
        Args:
            url: Supabase URL (optional, will use env var if not provided)
            key: Supabase anon key (optional, will use env var if not provided)
        """
        self.url = url or os.getenv('SUPABASE_URL')
        self.key = key or os.getenv('SUPABASE_KEY')
        
        if not self.url or not self.key:
            raise ValueError("Supabase URL and key are required")
            
        self.client: Client = create_client(self.url, self.key)
        # ✅ FIXED: Correct table name
        self.table_name = "Pharmacy Inventory"
    
    def get_table_info(self) -> Dict[str, Any]:
        """Get table structure information"""
        try:
            # ✅ FIXED: Use correct table name
            response = self.client.table(self.table_name).select("*").limit(1).execute()
            
            if response.data:
                sample_record = response.data[0]
                columns = list(sample_record.keys())
                return {
                    "table_name": self.table_name,
                    "columns": columns,
                    "total_columns": len(columns),
                    "sample_data": sample_record
                }
            else:
                return {
                    "table_name": self.table_name,
                    "columns": [],
                    "total_columns": 0
                }
        except Exception as e:
            return {"error": str(e)}
    
    def get_pharmacy_inventory(
        self, 
        columns: Optional[List[str]] = None,
        limit: Optional[int] = None,
        filters: Optional[Dict[str, Any]] = None
    ) -> pd.DataFrame:
        """
        Get pharmacy inventory data
        
        Args:
            columns: List of columns to select (use actual column names)
            limit: Maximum number of records
            filters: Dictionary of filters to apply
            
        Returns:
            DataFrame with inventory data
        """
        try:
            # ✅ FIXED: Default to correct column names
            if columns is None:
                columns = ["Name", "Quantity", "avg_daily_dispensed"]
            
            # Build query
            query = self.client.table(self.table_name).select(','.join(columns))
            
            # Apply filters
            if filters:
                for column, filter_config in filters.items():
                    if isinstance(filter_config, dict):
                        for operator, value in filter_config.items():
                            if operator == 'eq':
                                query = query.eq(column, value)
                            elif operator == 'gt':
                                query = query.gt(column, value)
                            elif operator == 'gte':
                                query = query.gte(column, value)
                            elif operator == 'lt':
                                query = query.lt(column, value)
                            elif operator == 'lte':
                                query = query.lte(column, value)
                    else:
                        query = query.eq(column, filter_config)
            
            # Apply limit
            if limit:
                query = query.limit(limit)
            
            response = query.execute()
            
            if response.data:
                df = pd.DataFrame(response.data)
                
                # ✅ FIXED: Map to standardized column names for consistency
                column_mapping = {
                    'Name': 'drug_name',
                    'Quantity': 'stock',
                    'avg_daily_dispensed': 'average_daily_dispense'
                }
                
                # Only rename columns that exist in the dataframe
                rename_dict = {old: new for old, new in column_mapping.items() if old in df.columns}
                if rename_dict:
                    df = df.rename(columns=rename_dict)
                
                # Calculate days of supply if we have the needed columns
                if 'stock' in df.columns and 'average_daily_dispense' in df.columns:
                    df['days_of_supply'] = df['stock'] / df['average_daily_dispense']
                    df['days_of_supply'] = df['days_of_supply'].fillna(0)
                
                return df
            else:
                return pd.DataFrame()
                
        except Exception as e:
            print(f"Error retrieving data: {e}")
            return pd.DataFrame()
    
    def get_low_stock_items(self, threshold: int = 10) -> pd.DataFrame:
        """Get items with low stock"""
        try:
            # ✅ FIXED: Use correct column name 'Quantity'
            filters = {'Quantity': {'lt': threshold}}
            return self.get_pharmacy_inventory(filters=filters)
        except Exception as e:
            print(f"Error getting low stock items: {e}")
            return pd.DataFrame()
    
    def get_high_demand_items(self, min_daily_dispensed: int = 5) -> pd.DataFrame:
        """Get high demand items"""
        try:
            # ✅ FIXED: Use correct column name 'avg_daily_dispensed'
            filters = {'avg_daily_dispensed': {'gte': min_daily_dispensed}}
            return self.get_pharmacy_inventory(filters=filters)
        except Exception as e:
            print(f"Error getting high demand items: {e}")
            return pd.DataFrame()
    
    def search_by_name(self, name_pattern: str) -> pd.DataFrame:
        """Search items by name pattern"""
        try:
            # ✅ FIXED: Use correct column name 'Name'
            query = self.client.table(self.table_name)\
                .select("Name, Quantity, avg_daily_dispensed")\
                .ilike("Name", f"%{name_pattern}%")
            
            response = query.execute()
            
            if response.data:
                df = pd.DataFrame(response.data)
                # Map to standardized names
                column_mapping = {
                    'Name': 'drug_name',
                    'Quantity': 'stock',
                    'avg_daily_dispensed': 'average_daily_dispense'
                }
                df = df.rename(columns=column_mapping)
                return df
            else:
                return pd.DataFrame()
                
        except Exception as e:
            print(f"Error searching by name: {e}")
            return pd.DataFrame()
    
    def update_stock(self, drug_name: str, new_quantity: int) -> bool:
        """Update stock for a specific drug"""
        try:
            # ✅ FIXED: Use correct column names
            response = self.client.table(self.table_name)\
                .update({"Quantity": new_quantity})\
                .eq("Name", drug_name)\
                .execute()
            
            return len(response.data) > 0
        except Exception as e:
            print(f"Error updating stock: {e}")
            return False