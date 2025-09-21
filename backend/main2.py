import os
from dotenv import load_dotenv
import pandas as pd

# This test script assumes it is located in the `backend/` directory.
# It is designed to import and test the classes from the `api/` subdirectory.
from api.aiResponses import AiAlternativeFinder
from api.supabase_retriever import SupabaseRetriever

def run_tests():
    """
    Main function to execute a comprehensive test of the AiAlternativeFinder class.
    """
    print("=============================================")
    print("= Running Test Suite for RxBridge AI Logic  =")
    print("=============================================")

    # --- Step 1: Load Environment Variables ---
    load_dotenv()
    print("\n[ Step 1/5 ] Loading environment variables...")
    
    # Check for the correct environment variable names
    required_vars = ['GEMINI_API_KEY']
    supabase_url = os.getenv('SUPABASE_URL') or os.getenv('VITE_SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_KEY') or os.getenv('VITE_SUPABASE_ANON_KEY')
    gemini_key = os.getenv('GEMINI_API_KEY')
    
    if not supabase_url:
        print("❌ CRITICAL ERROR: Missing SUPABASE_URL or VITE_SUPABASE_URL in environment variables.")
        print("   Please ensure one of these is set in your .env file.")
        return
    
    if not supabase_key:
        print("❌ CRITICAL ERROR: Missing SUPABASE_KEY or VITE_SUPABASE_ANON_KEY in environment variables.")
        print("   Please ensure one of these is set in your .env file.")
        return
        
    if not gemini_key:
        print("❌ CRITICAL ERROR: Missing GEMINI_API_KEY in environment variables.")
        print("   Please ensure GEMINI_API_KEY is set in your .env file.")
        return
    
    print("✅ Success: Environment variables loaded.")
    print(f"   - Supabase URL: {supabase_url[:50]}...")
    print(f"   - Supabase Key: {supabase_key[:20]}...")
    print(f"   - Gemini Key: {gemini_key[:20]}...")

    # --- Step 2: Initialize Database Connection ---
    try:
        print("\n[ Step 2/5 ] Initializing Supabase database retriever...")
        # Pass the credentials explicitly since SupabaseRetriever expects them
        supabase_retriever = SupabaseRetriever(url=supabase_url, key=supabase_key)
        
        # Test the connection by getting table info
        table_info = supabase_retriever.get_table_info()
        if 'error' in table_info:
            print(f"❌ WARNING: Supabase connection issue: {table_info['error']}")
        else:
            print("✅ Success: Supabase retriever initialized.")
            print(f"   - Table: {table_info.get('table_name', 'Unknown')}")
            print(f"   - Columns: {table_info.get('total_columns', 0)} found")
            
    except Exception as e:
        print(f"❌ CRITICAL ERROR: Could not initialize SupabaseRetriever. Error: {e}")
        return

    # --- Step 3: Initialize AI Finder ---
    try:
        print("\n[ Step 3/5 ] Initializing AiAlternativeFinder...")
        ai_finder = AiAlternativeFinder(supabase_retriever=supabase_retriever)
        print("✅ Success: AI finder initialized.")
    except Exception as e:
        print(f"❌ CRITICAL ERROR: Could not initialize AiAlternativeFinder. Error: {e}")
        print(f"   - Check that GEMINI_API_KEY is valid and Gemini API is accessible")
        return

    # --- Step 4: Test Finding & Validating Alternatives ---
    print("\n[ Step 4/5 ] Running 'find_and_validate_alternatives' test...")
    
    # First, let's see what's actually in the inventory
    try:
        print("   - Checking current inventory...")
        inventory_df = supabase_retriever.get_pharmacy_inventory()
        if inventory_df.empty:
            print("❌ WARNING: No inventory data found in Supabase.")
            print("   - Make sure your 'Pharmacy Inventory' table has data")
            return
        else:
            print(f"   - Found {len(inventory_df)} items in inventory")
            print("   - Sample drugs in inventory:")
            for i, drug in enumerate(inventory_df['drug_name'].head(5)):
                print(f"     {i+1}. {drug}")
    except Exception as e:
        print(f"❌ ERROR fetching inventory: {e}")
        return
    
    # Use drugs that are more likely to be in a typical pharmacy inventory
    drugs_in_shortage = ["Lisinopril", "Amoxicillin", "Metformin"]
    print(f"   - Testing with drugs: {drugs_in_shortage}")

    try:
        validated_alternatives = ai_finder.find_and_validate_alternatives(drugs_in_shortage)
        
        print("\n   --- TEST RESULTS ---")
        if validated_alternatives:
            for original_drug, alts in validated_alternatives.items():
                print(f"\n   For '{original_drug}':")
                if alts:
                    print(f"     ✅ Found {len(alts)} IN-STOCK alternatives with >14 days supply:")
                    for alt in alts:
                        print(f"       - {alt['name']} (Stock: {alt['stock']}, Days Supply: {alt['days_of_supply']})")
                else:
                    print("     🟡 No suitable alternatives with >14 days of supply were found in inventory.")
        else:
            print("   🟡 No results returned. Check AI response or inventory data.")

    except Exception as e:
        print(f"❌ ERROR during 'find_and_validate_alternatives': {e}")
        import traceback
        traceback.print_exc()
        return

    # --- Step 5: Test Generating Doctor Communication ---
    print("\n[ Step 5/5 ] Running 'generate_communication_for_doctor' test...")
    
    # Find the first drug that had valid alternatives for testing
    test_drug_for_comm = None
    test_alternatives = []
    
    if validated_alternatives:
        for drug, alts in validated_alternatives.items():
            if alts:  # If this drug has alternatives
                test_drug_for_comm = drug
                test_alternatives = alts
                break
    
    if test_drug_for_comm and test_alternatives:
        print(f"   - Generating communication for: {test_drug_for_comm}")
        try:
            communication = ai_finder.generate_communication_for_doctor(
                original_drug=test_drug_for_comm,
                validated_alternatives=test_alternatives
            )
            print("\n   --- GENERATED MESSAGE ---")
            print("   " + "-"*60)
            print(communication)
            print("   " + "-"*60)
            print("   ✅ Success: Communication generated.")

        except Exception as e:
            print(f"❌ ERROR during 'generate_communication_for_doctor': {e}")
            import traceback
            traceback.print_exc()
    else:
        print("   🟡 Skipping communication test - no alternatives found to test with.")
        print("   - This could mean:")
        print("     1. AI didn't suggest alternatives")
        print("     2. Suggested alternatives aren't in your inventory") 
        print("     3. Alternatives don't meet the >14 days supply threshold")

    # --- Step 6: Test the new process_drug_alert method ---
    print("\n[ Step 6/6 ] Testing 'process_drug_alert' method...")
    
    test_alert = {
        'drug_name': 'Lisinopril',
        'alert_level': 'RED',
        'fda_status': 'Currently in Shortage',
        'days_of_supply': 5
    }
    
    try:
        result = ai_finder.process_drug_alert(test_alert)
        print(f"   - Status: {result['status']}")
        print(f"   - Alternatives found: {result['alternatives_found']}")
        if result['status'] == 'success' and result['alternatives_found'] > 0:
            print("   ✅ Success: Full workflow completed successfully.")
        else:
            print("   🟡 Workflow completed but no alternatives found.")
    except Exception as e:
        print(f"❌ ERROR during 'process_drug_alert': {e}")

    print("\n=============================================")
    print("=             Test Suite Finished           =")
    print("=============================================")

if __name__ == "__main__":
    run_tests()