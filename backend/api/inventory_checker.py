# api/inventory_checker.py

import pandas as pd
import re
from typing import Optional, Dict, List, Tuple
from rapidfuzz import fuzz, process
import logging

logger = logging.getLogger(__name__)

class InventoryChecker:
    """
    Matching/alert logic ONLY.
    Accepts pre-fetched inventory and FDA datasets, outputs dashboard JSON (and optional DataFrame).
    """

    def __init__(self):
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

    # ---------- helpers ----------
    def clean_drug_name(self, name: str) -> str:
        if pd.isna(name) or not isinstance(name, str):
            return ""
        clean_name = str(name).lower().strip()
        clean_name = re.sub(r'[^\w\s]', ' ', clean_name)
        clean_name = re.sub(r'\s+', ' ', clean_name).strip()
        return clean_name

    def find_drug_match(self, drug_name: str, reference_list: List[str]) -> Tuple[Optional[str], int, str]:
        if not drug_name or not reference_list:
            return None, 0, "no_match"
        clean_target = self.clean_drug_name(drug_name)
        clean_refs = [self.clean_drug_name(ref) for ref in reference_list]

        if clean_target in clean_refs:
            idx = clean_refs.index(clean_target)
            return reference_list[idx], 100, "exact"

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

    def _calculate_severity(self, status: str, recall_class: str, days_supply: float, stock: int) -> str:
        if status == 'Recalled':
            if recall_class == 'Class I':
                return 'Critical'
            elif recall_class == 'Class II':
                return 'High'
            else:
                return 'Medium'
        elif status == 'Currently in Shortage':
            if days_supply <= 3:
                return 'Critical'
            elif days_supply <= 7:
                return 'High'
            elif days_supply <= 14:
                return 'Medium'
            else:
                return 'Low'
        elif status == 'Discontinuation':
            if days_supply <= 7:
                return 'High'
            elif days_supply <= 30:
                return 'Medium'
            else:
                return 'Low'
        return 'Low'

    def _calculate_dashboard_alert_level(self, status: str, recall_class: str, days_supply: float, is_flagged: bool) -> Optional[str]:
        weeks_supply = (days_supply / 7) if days_supply not in (None, float('inf')) else float('inf')
        if is_flagged:
            if weeks_supply < 2:
                return 'RED'
            elif weeks_supply <= 8.57:  # ~60 days
                return 'PURPLE'
            else:
                return 'YELLOW'
        else:
            if weeks_supply < 2:
                return 'BLUE'
            return None

    def _format_api_response(self, flagged_items: list) -> dict:
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

        recalls, other_alerts = [], []
        for item in flagged_items:
            if 'Recalled' in item.get('flag_status', ''):
                recalls.append(item)
            else:
                other_alerts.append(item)

        alert_counts = {}
        for item in flagged_items:
            lvl = item['alert_level']
            alert_counts[lvl] = alert_counts.get(lvl, 0) + 1

        critical_items = len([i for i in flagged_items if i['alert_level'] in ['RED', 'PURPLE']])
        alert_priority = {'RED': 4, 'PURPLE': 3, 'YELLOW': 2, 'BLUE': 1}

        def sort_items(items):
            return sorted(items, key=lambda x: (alert_priority.get(x['alert_level'], 0), -x['days_of_supply']), reverse=True)

        def format_item(item, idx):
            return {
                "id": idx + 1,
                "drug_name": item['drug_name'],
                "alert_level": item['alert_level'],
                "days_of_supply": round(item['days_of_supply'], 1) if pd.notna(item['days_of_supply']) else None,
                "current_stock": item['current_stock'],
                "average_daily_dispense": item['average_daily_dispense'],
                "fda_status": item['flag_status'],
                "fda_matched_name": item['fda_matched_name'],
                "match_confidence": round(item['match_confidence'], 1) if item['match_confidence'] > 0 else None,
                "recall_classification": item['recall_classification'] or None,
                "recall_reason": item['recall_reason'] or None,
                "requires_immediate_action": item['requires_immediate_action'],
                "has_fda_issue": item['has_fda_issue']
            }

        sorted_recalls = sort_items(recalls)
        sorted_other_alerts = sort_items(other_alerts)

        return {
            "status": "success",
            "timestamp": pd.Timestamp.now().isoformat(),
            "summary": {
                "total_items_checked": len(flagged_items),  # (If needed, replace with total inventory count)
                "items_requiring_attention": len(flagged_items),
                "recall_items": len(sorted_recalls),
                "shortage_items": len([i for i in sorted_other_alerts if 'Shortage' in i.get('flag_status', '')]),
                "discontinuation_items": len([i for i in sorted_other_alerts if 'Discontinuation' in i.get('flag_status', '')]),
                "low_stock_items": len([i for i in sorted_other_alerts if 'Low Stock' in i.get('flag_status', '')]),
                "alert_breakdown": alert_counts,
                "critical_items": critical_items,
                "avg_days_supply": (
                    sum(i['days_of_supply'] for i in flagged_items) / len(flagged_items)
                    if flagged_items else 0
                ),
            },
            "recalls": [format_item(item, idx) for idx, item in enumerate(sorted_recalls)],
            "other_alerts": [format_item(item, idx) for idx, item in enumerate(sorted_other_alerts)],
        }

    # ---------- public API ----------
    def evaluate(self, inventory_df: pd.DataFrame, fda_df: pd.DataFrame, return_df: bool = False):
        """
        Core evaluation: match inventory with FDA data and produce alerts JSON.
        Returns (json, df?) depending on return_df.
        """
        if inventory_df is None or inventory_df.empty:
            return {"status": "error", "message": "No inventory data available"}, (pd.DataFrame() if return_df else None)

        fda_names = fda_df['fda_drug_name'].tolist() if (fda_df is not None and not fda_df.empty) else []
        flagged_items = []

        for _, inv_row in inventory_df.iterrows():
            drug_name = inv_row.get('drug_name', '') or inv_row.get('Name', '')
            stock = int(inv_row.get('stock', inv_row.get('Quantity', 0)) or 0)
            daily_dispense = inv_row.get('average_daily_dispense', inv_row.get('avg_daily_dispensed', 0)) or 0
            days_supply = (stock / daily_dispense) if daily_dispense and daily_dispense > 0 else float('inf')

            fda_match = None
            matched_name, confidence, match_type = None, 0, "no_match"

            if fda_names:
                matched_name, confidence, match_type = self.find_drug_match(drug_name, fda_names)
                if matched_name and confidence >= self.fuzzy_match_threshold:
                    fda_match = fda_df[fda_df['fda_drug_name'] == matched_name].iloc[0]

            is_flagged = fda_match is not None
            alert_level = self._calculate_dashboard_alert_level(
                fda_match['status'] if is_flagged else '',
                (fda_match.get('recall_classification', '') if is_flagged else ''),
                days_supply,
                is_flagged
            )

            if alert_level:
                severity = (
                    self._calculate_severity(
                        fda_match['status'],
                        fda_match.get('recall_classification', ''),
                        days_supply,
                        stock
                    ) if is_flagged else 'Low'
                )

                flagged_items.append({
                    'drug_name': drug_name,
                    'current_stock': stock,
                    'average_daily_dispense': daily_dispense,
                    'days_of_supply': days_supply,
                    'fda_matched_name': matched_name if is_flagged else '',
                    'match_confidence': confidence if is_flagged else 0,
                    'match_type': match_type if is_flagged else 'no_match',
                    'flag_status': fda_match['status'] if is_flagged else 'Low Stock Only',
                    'flag_source': fda_match['source'] if is_flagged else 'inventory_analysis',
                    'recall_classification': fda_match.get('recall_classification', '') if is_flagged else '',
                    'recall_reason': fda_match.get('recall_reason', '') if is_flagged else '',
                    'alert_level': alert_level,
                    'priority_score': (self.priority_map.get(fda_match['status'], 0) if is_flagged else 0),
                    'severity': severity,
                    'requires_immediate_action': alert_level in ['RED', 'PURPLE'],
                    'has_fda_issue': is_flagged
                })

        api_json = self._format_api_response(flagged_items)
        if return_df:
            df = pd.DataFrame(flagged_items) if flagged_items else pd.DataFrame()
            if not df.empty:
                alert_priority = {'RED': 4, 'PURPLE': 3, 'YELLOW': 2, 'BLUE': 1}
                df['alert_priority'] = df['alert_level'].map(alert_priority)
                df = df.sort_values(['alert_priority', 'days_of_supply'], ascending=[False, True]).drop(columns=['alert_priority'])
            return api_json, df
        else:
            return api_json, None
