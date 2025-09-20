#!/usr/bin/env python3
"""
Scrape all tabs and all pages from:
https://www.accessdata.fda.gov/scripts/drugshortages/

Outputs:
  - data/drug_shortages.csv
  - data/drug_shortages.json  (optional: --json)
Usage:
  pip install playwright
  playwright install
  python scrape_fda_drug_shortages.py --json
"""

import asyncio
import csv
import json
import os
import sys
from datetime import datetime
from typing import List, Dict, Optional

from playwright.async_api import async_playwright, Page, TimeoutError as PWTimeoutError

BASE_URL = "https://www.accessdata.fda.gov/scripts/drugshortages/"

OUT_DIR = "data"
CSV_PATH = os.path.join(OUT_DIR, "drug_shortages.csv")
JSON_PATH = os.path.join(OUT_DIR, "drug_shortages.json")

# Tweak these if the site is slow
NAV_TIMEOUT = 30_000   # ms
STEP_DELAY  = 400      # ms courtesy delay between actions

# ---- Helper functions -------------------------------------------------------

async def gentle_wait(ms: int = STEP_DELAY, page: Optional[Page] = None):
    if page:
        await page.wait_for_timeout(ms)

async def get_all_tab_handles(page: Page) -> List[Dict]:
    """
    Try to discover tab-like controls in a robust way.
    Prefer ARIA role=tab; fall back to Bootstrap-like .nav-tabs.
    Returns a list of dicts: [{"name": "Current Shortages", "locator": Locator}, ...]
    """
    tabs = []

    # 1) ARIA tabs (best case)
    aria_tabs = page.get_by_role("tab")
    count = await aria_tabs.count()
    if count > 0:
        for i in range(count):
            loc = aria_tabs.nth(i)
            name = await loc.inner_text()
            name = " ".join(name.split())
            tabs.append({"name": name, "locator": loc})
        return tabs

    # 2) Bootstrap .nav-tabs a
    candidates = page.locator(".nav-tabs a, ul[role='tablist'] a")
    count = await candidates.count()
    for i in range(count):
        loc = candidates.nth(i)
        name = await loc.inner_text()
        name = " ".join(name.split())
        tabs.append({"name": name, "locator": loc})

    # If no tabs are found, we'll still try to scrape the default (first) table
    return tabs

async def extract_rows_on_current_page(page: Page, current_tab: str) -> List[Dict]:
    """
    Extract rows from the main table on the current view.
    We grab:
      - generic_or_active_ingredient (col 1)
      - status (col 2)
      - detail_url (if col 1 has a link)
    """
    rows = []
    # Be tolerant to different table IDs; rely on structure.
    table = page.locator("table:has(thead):has(tbody)")
    await table.first.wait_for(timeout=NAV_TIMEOUT)
    tbody_rows = table.first.locator("tbody tr")
    n = await tbody_rows.count()
    for i in range(n):
        tr = tbody_rows.nth(i)
        tds = tr.locator("td")
        td_count = await tds.count()
        if td_count < 2:
            continue

        # Column 1: text + possible link href
        cell1 = tds.nth(0)
        text1 = " ".join((await cell1.inner_text()).split())
        link = cell1.locator("a")
        href = None
        if await link.count() > 0:
            try:
                href = await link.first.get_attribute("href")
                if href and href.startswith("/"):
                    href = "https://www.accessdata.fda.gov" + href
            except PWTimeoutError:
                href = None

        # Column 2: status
        cell2 = tds.nth(1)
        text2 = " ".join((await cell2.inner_text()).split())

        rows.append({
            "tab": current_tab or "",
            "generic_or_active_ingredient": text1,
            "status": text2,
            "detail_url": href or "",
        })
    return rows

async def go_to_next_page_if_any(page: Page) -> bool:
    """
    Click the 'Next' pagination control if it's enabled/visible.
    Returns True if we navigated to the next page, False if we are at the last page.
    """
    # Targets common DataTables/Bootstrap pagination
    # Try role=button/link with name "Next"
    next_candidates = [
        page.get_by_role("button", name="Next"),
        page.get_by_role("link", name="Next"),
        page.locator("a:has-text('Next')"),
        page.locator("button:has-text('Next')"),
        page.locator("li.next a, li:has-text('Next') a"),
    ]

    for cand in next_candidates:
        try:
            if await cand.count() == 0:
                continue

            # If parent li has 'disabled' or element has aria-disabled
            # treat as not clickable.
            disabled = False
            try:
                aria = await cand.get_attribute("aria-disabled")
                if aria and aria.lower() in ("true", "1"):
                    disabled = True
            except Exception:
                pass

            # Check if parent li has class disabled
            try:
                li_parent = cand.locator("xpath=ancestor::li[1]")
                if await li_parent.count() > 0:
                    cls = await li_parent.first.get_attribute("class") or ""
                    if "disabled" in cls.lower():
                        disabled = True
            except Exception:
                pass

            # Also check computed state
            if not disabled:
                if await cand.is_enabled() and await cand.is_visible():
                    # Click and wait for table to refresh (row text likely changes)
                    await cand.click()
                    # Small delay to allow redraw; then wait for network idle-ish
                    await gentle_wait(page=page)
                    return True
        except PWTimeoutError:
            continue
        except Exception:
            continue

    return False

async def scrape_all() -> List[Dict]:
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        ctx = await browser.new_context(user_agent="Mozilla/5.0 (research scraper; contact: you@example.com)")
        page = await ctx.new_page()
        await page.goto(BASE_URL, timeout=NAV_TIMEOUT)
        await gentle_wait(page=page)

        # Collect all tabs
        tabs = await get_all_tab_handles(page)

        results: List[Dict] = []
        scraped_at = datetime.utcnow().isoformat(timespec="seconds") + "Z"

        async def scrape_current_view(current_tab_name: str):
            # Start from page 1 if there's a "Previous" button; try clicking "1" as a reset
            # (best-effort; safe if missing)
            try:
                page_one = page.get_by_role("link", name="1")
                if await page_one.count():
                    await page_one.first.click()
                    await gentle_wait(page=page)
            except Exception:
                pass

            while True:
                rows = await extract_rows_on_current_page(page, current_tab=current_tab_name)
                for r in rows:
                    r["scraped_at"] = scraped_at
                results.extend(rows)

                advanced = await go_to_next_page_if_any(page)
                if not advanced:
                    break

        if not tabs:
            # No visible tabs; just scrape the default table.
            await scrape_current_view("Default")
        else:
            # Click through each discovered tab and scrape its pagination.
            for i, tab in enumerate(tabs):
                name = tab["name"] or f"Tab {i+1}"
                try:
                    await tab["locator"].click()
                    await gentle_wait(page=page)
                except Exception:
                    # If click failed, still attempt scraping current view
                    pass
                await scrape_current_view(name)

        await browser.close()
        return results

def write_outputs(rows: List[Dict], write_json: bool = False):
    os.makedirs(OUT_DIR, exist_ok=True)
    fieldnames = ["tab", "generic_or_active_ingredient", "status", "detail_url", "scraped_at"]

    # CSV
    with open(CSV_PATH, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)

    # JSON (optional)
    if write_json:
        with open(JSON_PATH, "w", encoding="utf-8") as f:
            json.dump(rows, f, ensure_ascii=False, indent=2)

    print(f"Wrote {len(rows)} rows to {CSV_PATH}")
    if write_json:
        print(f"Wrote JSON to {JSON_PATH}")

# ---- Main -------------------------------------------------------------------

if __name__ == "__main__":
    write_json = "--json" in sys.argv
    rows = asyncio.run(scrape_all())
    write_outputs(rows, write_json)
