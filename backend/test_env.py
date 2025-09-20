#!/usr/bin/env python3
"""
Test script to verify environment variables are loaded correctly
"""

import os
import sys
from dotenv import load_dotenv

def test_env_variables():
    """Test if environment variables are loaded correctly"""
    
    print("Testing environment variable loading...")
    print("=" * 50)
    
    # Load environment variables from .env file
    load_dotenv()
    
    # Check VITE_ prefixed variables (frontend style)
    vite_url = os.getenv('VITE_SUPABASE_URL')
    vite_key = os.getenv('VITE_SUPABASE_ANON_KEY')
    
    # Check standard variables (backend style)
    url = os.getenv('SUPABASE_URL')
    key = os.getenv('SUPABASE_KEY')
    
    print("VITE_ prefixed variables:")
    print(f"  VITE_SUPABASE_URL: {'✅ Found' if vite_url else '❌ Missing'}")
    if vite_url:
        print(f"    Value: {vite_url[:30]}...")
    
    print(f"  VITE_SUPABASE_ANON_KEY: {'✅ Found' if vite_key else '❌ Missing'}")
    if vite_key:
        print(f"    Value: {vite_key[:30]}...")
    
    print("\nStandard variables:")
    print(f"  SUPABASE_URL: {'✅ Found' if url else '❌ Missing'}")
    if url:
        print(f"    Value: {url[:30]}...")
    
    print(f"  SUPABASE_KEY: {'✅ Found' if key else '❌ Missing'}")
    if key:
        print(f"    Value: {key[:30]}...")
    
    print("\n" + "=" * 50)
    
    # Test SupabaseRetriever initialization
    try:
        print("Testing SupabaseRetriever initialization...")
        sys.path.append('/Users/arnavjain/VS Code Projects/HackRice/backend/api')
        from supabase_retriever import SupabaseRetriever
        
        retriever = SupabaseRetriever()
        print("✅ SupabaseRetriever initialized successfully!")
        print(f"   Using URL: {retriever.url[:30]}...")
        print(f"   Using Key: {retriever.key[:30]}...")
        
        # Test table info retrieval
        print("\nTesting table info retrieval...")
        table_info = retriever.get_table_info()
        if 'error' not in table_info:
            print("✅ Successfully connected to Supabase!")
            print(f"   Table: {table_info.get('table_name', 'Unknown')}")
            print(f"   Columns: {table_info.get('total_columns', 0)}")
            if table_info.get('columns'):
                print(f"   Sample columns: {', '.join(table_info['columns'][:3])}")
        else:
            print(f"❌ Failed to retrieve table info: {table_info['error']}")
            
    except Exception as e:
        print(f"❌ SupabaseRetriever initialization failed: {e}")
    
    print("\n" + "=" * 50)
    print("Environment test completed!")

if __name__ == "__main__":
    test_env_variables()