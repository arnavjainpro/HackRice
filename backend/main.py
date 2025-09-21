# main.py

import os
import logging
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional

# Optional: load .env if present (safe no-op if not installed)
try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

import pandas as pd

# Local modules (your api/ package has __init__.py)
from api.supabase_retriever import SupabaseRetriever
from api.webscraper import scrape_fda_shortages_as_dataframe
from api.recall import FDARecallRetriever
from api.inventory_checker import InventoryChecker
from api.aiResponses import AiAlternativeFinder

logger = logging.getLogger("uvicorn")
app = FastAPI(title="RxBridge Backend", version="1.0.0")

# Initialize AI system at startup
ai_finder = None

@app.on_event("startup")
async def startup_event():
    """Initialize AI system on startup"""
    global ai_finder
    try:
        # Get Supabase credentials
        supabase_url = os.getenv('VITE_SUPABASE_URL') or os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('VITE_SUPABASE_ANON_KEY') or os.getenv('SUPABASE_KEY')
        
        if supabase_url and supabase_key:
            supabase_retriever = SupabaseRetriever(url=supabase_url, key=supabase_key)
            ai_finder = AiAlternativeFinder(supabase_retriever=supabase_retriever)
            logger.info("AI system initialized successfully")
        else:
            logger.warning("AI system not initialized - missing Supabase credentials")
    except Exception as e:
        logger.error(f"Failed to initialize AI system: {e}")

# Pydantic models
class AIRecommendationRequest(BaseModel):
    drug_name: str


def _combine_fda(shortage_df: pd.DataFrame, recall_df: pd.DataFrame) -> pd.DataFrame:
    """
    Combine shortages and recalls into a single FDA dataframe with priority de-duplication.
    """
    priority_map = {'Recalled': 3, 'Currently in Shortage': 2, 'Discontinuation': 1, 'Resolved': 0}
    combined = []

    if shortage_df is not None and not shortage_df.empty:
        for _, row in shortage_df.iterrows():
            combined.append({
                "fda_drug_name": row.get("generic_name", ""),
                "status": row.get("status", ""),
                "source": "shortage_db",
                "recall_classification": None,
                "recall_reason": None,
            })

    if recall_df is not None and not recall_df.empty:
        for _, row in recall_df.iterrows():
            combined.append({
                "fda_drug_name": row.get("drug_name", ""),
                "status": "Recalled",  # normalized
                "source": "recall_api",
                "recall_classification": row.get("classification", ""),
                "recall_reason": row.get("reason", "")
            })

    if not combined:
        return pd.DataFrame()

    fda_df = pd.DataFrame(combined)
    fda_df["priority"] = fda_df["status"].map(priority_map).fillna(0).astype(int)
    fda_df = fda_df.sort_values("priority", ascending=False)
    fda_df = fda_df.drop_duplicates(subset=["fda_drug_name"], keep="first").drop(columns=["priority"])
    return fda_df


@app.post("/inventory/run")
def run_inventory_check():
    """
    Synchronous orchestration:
    - Fetch inventory from Supabase
    - Scrape FDA shortages
    - Fetch FDA recalls (API)
    - Match & compute alerts via InventoryChecker
    - Return the same JSON structure (`summary`, `recalls`, `other_alerts`)
    """

    # ---- 1) Inventory (Supabase) ----
    supabase_url = os.getenv('VITE_SUPABASE_URL') or os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('VITE_SUPABASE_ANON_KEY') or os.getenv('SUPABASE_KEY')

    if not supabase_url or not supabase_key:
        raise HTTPException(status_code=500, detail="Supabase credentials not found in env.")

    try:
        supa = SupabaseRetriever(url=supabase_url, key=supabase_key)
        inventory_df = supa.get_pharmacy_inventory()  # standardized columns: drug_name, stock, average_daily_dispense, days_of_supply
    except Exception as e:
        logger.exception("Failed to fetch inventory from Supabase")
        raise HTTPException(status_code=502, detail=f"Failed to fetch inventory: {e}")

    if inventory_df is None or inventory_df.empty:
        raise HTTPException(status_code=404, detail="No inventory data found.")

    # ---- 2) FDA Shortages (web scrape) ----
    try:
        shortage_df = scrape_fda_shortages_as_dataframe()
    except Exception as e:
        logger.exception("Failed to scrape FDA shortages")
        raise HTTPException(status_code=502, detail=f"Failed to scrape FDA shortages: {e}")

    # ---- 3) FDA Recalls (API) ----
    try:
        fda_api_key = os.getenv("FDA_API_KEY")  # optional, fine if None
        recall_client = FDARecallRetriever(api_key=fda_api_key)
        recall_df = recall_client.get_all_recalls_df()  # Remove limit to get all available recalls
    except Exception as e:
        logger.exception("Failed to fetch FDA recalls")
        raise HTTPException(status_code=502, detail=f"Failed to fetch FDA recalls: {e}")

    # ---- 4) Combine FDA datasets ----
    fda_df = _combine_fda(shortage_df, recall_df)

    # ---- 5) Evaluate ----
    try:
        checker = InventoryChecker()
        api_json, _ = checker.evaluate(inventory_df=inventory_df, fda_df=fda_df, return_df=False)
    except Exception as e:
        logger.exception("Inventory evaluation failed")
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {e}")

    # If evaluate returned an error JSON, surface it properly
    if isinstance(api_json, dict) and api_json.get("status") == "error":
        raise HTTPException(status_code=500, detail=api_json.get("message", "Unknown error"))

    return JSONResponse(content=api_json)


@app.post("/ai-recommendations")
def get_ai_recommendations(request: AIRecommendationRequest):
    """
    Generate AI-powered recommendations for flagged medications
    Returns a simplified response with alternative medications and descriptions
    """
    global ai_finder
    
    if not ai_finder:
        # Try to initialize AI system if not already done
        try:
            supabase_url = os.getenv('VITE_SUPABASE_URL') or os.getenv('SUPABASE_URL')
            supabase_key = os.getenv('VITE_SUPABASE_ANON_KEY') or os.getenv('SUPABASE_KEY')
            
            if not supabase_url or not supabase_key:
                raise HTTPException(status_code=500, detail="Supabase credentials not found in env.")
            
            supabase_retriever = SupabaseRetriever(url=supabase_url, key=supabase_key)
            ai_finder = AiAlternativeFinder(supabase_retriever=supabase_retriever)
            logger.info("AI system initialized on demand")
            
        except Exception as e:
            logger.error(f"Failed to initialize AI system: {e}")
            return JSONResponse(content={
                "alt1": None,
                "d1": None,
                "alt2": None,
                "d2": None,
                "alt3": None,
                "d3": None,
                "doctor_info": {},
                "email_draft": f"AI system unavailable: {str(e)}"
            })
    
    try:
        logger.info(f"Generating AI recommendations for: {request.drug_name}")
        
        # Create drug alert data for the AI system
        drug_alert_data = {
            'drug_name': request.drug_name,
            'alert_level': 'RED',  # Default for now
            'fda_status': 'Shortage/Recall'
        }
        
        # Get AI recommendations using the real system
        result = ai_finder.process_drug_alert(drug_alert_data)
        
        if result['status'] == 'error':
            return JSONResponse(content={
                "alt1": None,
                "d1": None,
                "alt2": None,
                "d2": None,
                "alt3": None,
                "d3": None,
                "doctor_info": {},
                "email_draft": f"Error generating recommendations: {result.get('error', 'Unknown error')}"
            })
        
        # Extract alternatives from the result
        alternatives = result.get('suggested_alternatives', [])
        email_draft = result.get('email_draft', '')
        
        # Format response to match the expected structure
        response = {
            "alt1": None,
            "d1": None,
            "alt2": None,
            "d2": None,
            "alt3": None,
            "d3": None,
            "doctor_info": result.get('doctor_info', {}),
            "email_draft": email_draft if email_draft else "Contact your prescribing physician for guidance on medication alternatives."
        }
        
        # Fill in alternatives and create descriptions
        for i, alt in enumerate(alternatives[:3]):  # Take up to 3 alternatives
            alt_key = f"alt{i+1}"
            desc_key = f"d{i+1}"
            
            response[alt_key] = alt['name']
            response[desc_key] = f"Alternative with {alt['days_of_supply']} days supply ({alt['stock']} units in stock). Match type: {alt.get('match_type', 'unknown')}."
        
        # If no alternatives found, set appropriate message
        if not alternatives:
            response["email_draft"] = "No suitable alternatives with adequate supply currently available. Contact emergency supplier or prescribing physician for guidance."
        
        return JSONResponse(content=response)
        
    except Exception as e:
        logger.exception(f"Failed to generate AI recommendations for {request.drug_name}")
        return JSONResponse(content={
            "alt1": None,
            "d1": None,
            "alt2": None,
            "d2": None,
            "alt3": None,
            "d3": None,
            "doctor_info": {},
            "email_draft": f"System error: {str(e)}"
        })