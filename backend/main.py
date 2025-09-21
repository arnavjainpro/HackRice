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
from api.aiResponses import AIRecommendationEngine

logger = logging.getLogger("uvicorn")
app = FastAPI(title="RxBridge Backend", version="1.0.0")

# Initialize AI recommendation engine
ai_engine = AIRecommendationEngine()

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
async def get_ai_recommendations(request: AIRecommendationRequest):
    """
    Generate AI-powered recommendations for flagged medications
    Returns a simplified response with alternative medications and descriptions
    """
    try:
        logger.info(f"Generating AI recommendations for: {request.drug_name}")
        
        # Mock response for now - replace with actual AI logic later
        mock_response = {
            "alt1": "Lisinopril 5mg",
            "d1": "Lower dose alternative with similar efficacy. Monitor blood pressure closely during transition.",
            "alt2": "Enalapril 10mg", 
            "d2": "ACE inhibitor with similar mechanism of action. May have fewer side effects for some patients.",
            "alt3": "Losartan 50mg",
            "d3": "ARB alternative that works differently but achieves similar blood pressure control.",
            "email": "Contact your prescribing physician at physician@hospital.com for medication adjustment guidance."
        }
        
        # For some drugs, simulate no alternatives available
        if "unavailable" in request.drug_name.lower():
            mock_response = {
                "alt1": None,
                "d1": None,
                "alt2": None,
                "d2": None,
                "alt3": None,
                "d3": None,
                "email": "No alternative medications currently available. Contact emergency supplier at emergency@pharmacy.com"
            }
        
        return JSONResponse(content=mock_response)
        
    except Exception as e:
        logger.exception(f"Failed to generate AI recommendations for {request.drug_name}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to generate AI recommendations: {str(e)}"
        )