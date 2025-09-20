# main.py

import os
import logging
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse

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
from api.aiResponses import generate_recommendation  # <-- NEW

logger = logging.getLogger("uvicorn")
app = FastAPI(title="RxBridge Backend", version="1.0.0")


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

# in main.py (top-level with other imports)
# import os

# @app.get("/health/ai")
# def health_ai():
#     has_key = bool(os.getenv("GOOGLE_API_KEY"))
#     return {"ai_enabled": has_key}


@app.post("/inventory/run")
def run_inventory_check():
    """
    Synchronous orchestration:
    - Fetch inventory from Supabase
    - Scrape FDA shortages
    - Fetch FDA recalls (API)
    - Match & compute alerts via InventoryChecker
    - Enrich each item with Gemini AI recommendations
    - Return the JSON structure (`summary`, `recalls`, `other_alerts`)
    """

    # ---- 1) Inventory (Supabase) ----
    supabase_url = os.getenv('VITE_SUPABASE_URL') or os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('VITE_SUPABASE_ANON_KEY') or os.getenv('SUPABASE_KEY')

    if not supabase_url or not supabase_key:
        raise HTTPException(status_code=500, detail="Supabase credentials not found in env.")

    try:
        supa = SupabaseRetriever(url=supabase_url, key=supabase_key)
        # standardized columns after retriever rename: drug_name, stock, average_daily_dispense, days_of_supply
        inventory_df = supa.get_pharmacy_inventory()
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
        fda_api_key = os.getenv("FDA_API_KEY")  # optional
        recall_client = FDARecallRetriever(api_key=fda_api_key)
        recall_df = recall_client.get_all_recalls_df(limit=500)  # cleaned/sorted in module
    except Exception as e:
        logger.exception("Failed to fetch FDA recalls")
        raise HTTPException(status_code=502, detail=f"Failed to fetch FDA recalls: {e}")

    # ---- 4) Combine FDA datasets ----
    fda_df = _combine_fda(shortage_df, recall_df)

    # ---- 5) Evaluate (matching/alerts) ----
    try:
        checker = InventoryChecker()
        api_json, _ = checker.evaluate(inventory_df=inventory_df, fda_df=fda_df, return_df=False)
    except Exception as e:
        logger.exception("Inventory evaluation failed")
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {e}")

    if isinstance(api_json, dict) and api_json.get("status") == "error":
        raise HTTPException(status_code=500, detail=api_json.get("message", "Unknown error"))

    # ---- 6) Enrich with AI recommendations (best-effort; non-fatal) ----
    def _attach_ai(items: list):
        for item in items:
            item["ai_recommendation"] = generate_recommendation(
                drug_name=item.get("drug_name", ""),
                alert_level=item.get("alert_level", ""),
                fda_status=item.get("fda_status", ""),
                recall_classification=item.get("recall_classification"),
                recall_reason=item.get("recall_reason"),
                days_of_supply=item.get("days_of_supply"),
                avg_daily_dispense=item.get("average_daily_dispense"),
            )

    _attach_ai(api_json.get("recalls", []))
    _attach_ai(api_json.get("other_alerts", []))

    # ---- 7) Return ----
    return JSONResponse(content=api_json)
