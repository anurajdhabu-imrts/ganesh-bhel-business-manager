"""Gemini AI integration with graceful local fallbacks.

If GEMINI_API_KEY is unset, every function returns a deterministic locally
computed result so the app remains fully usable offline.
"""
from __future__ import annotations

import json
import re
from typing import Any, Dict, List, Optional

from pydantic import BaseModel

from app.core.config import settings


class ForecastResult(BaseModel):
    tomorrowSales: int
    weeklySales: int
    monthlySales: int
    confidence: int
    analysisText: str


class HealthScoreResult(BaseModel):
    score: int
    rating: str
    profitabilityScore: int
    cashFlowScore: int
    expenseControlScore: int
    inventoryScore: int
    analysisText: str


class VoiceEntryResult(BaseModel):
    entryType: str
    parsedFields: Optional[Dict[str, Any]] = None
    confidence: int
    explanation: str


def _get_client():
    api_key = settings.GEMINI_API_KEY
    if not api_key or api_key == "MY_GEMINI_API_KEY":
        return None
    try:
        from google import genai

        return genai.Client(api_key=api_key)
    except Exception as exc:
        print(f"Error initialising Gemini client: {exc}")
        return None


def run_ai_chat(messages: List[Dict[str, Any]], db_data: Dict[str, Any]) -> Dict[str, str]:
    client = _get_client()

    sales = db_data.get("sales", [])
    sales_summary = "\n".join(
        f"Date: {s.get('date')}, Total: {s.get('totalSales')}, "
        f"Cash: {s.get('cashCollection')}, UPI: {s.get('upiCollection')}"
        for s in sales[-10:]
    ) or "No sales data on file."

    staff = db_data.get("staff", [])
    staff_summary = ", ".join(
        f"{st.get('name')} ({st.get('designation')}), Salary: ₹{st.get('salary')}/mo" for st in staff
    ) or "No staff on record."

    advances = db_data.get("advances", [])
    total_advances = sum(
        float(a.get("amount", 0)) - float(a.get("recoveredAmount", 0)) for a in advances
    )

    inventory = db_data.get("inventory", [])
    low_stock = [
        f"{i.get('name')} (Closing: {i.get('closingStock')} {i.get('unit')})"
        for i in inventory
        if float(i.get("closingStock", 0)) <= float(i.get("lowStockThreshold", 0))
    ]
    low_stock_summary = ", ".join(low_stock) if low_stock else "None"

    products = db_data.get("products", [])
    menu_summary = ", ".join(f"{p.get('name')} (₹{p.get('sellingPrice')})" for p in products[:15])

    system_instruction = f"""
You are the Ganesh Bhel Business Operations Assistant (GBMS AI Helper).
You are speaking with the business owner or managers of Ganesh Bhel (snack stall in Pune, Maharashtra).
The core business is Bhel, Pani Puri, Sev Puri, Misal, etc.

Current business state:
- Staff: {staff_summary}
- Outstanding Staff Advances Total: ₹{total_advances}
- Low Stock Items: {low_stock_summary}
- Main Products/Menu: {menu_summary}

Historical Sales Log:
{sales_summary}

Instructions:
1. Answer strictly from this data. Do not invent numbers.
2. Be brief, professional and business-oriented.
3. Support bilingual terminology (English & Marathi, e.g. "Outstanding (बाकी)").
4. Walk through calculations clearly when asked.
"""

    if not client:
        return {
            "reply": (
                f"[Offline Helper Mode] Gemini API key is not set. Local scan shows "
                f"{len(staff)} staff and ₹{total_advances:,.2f} in pending advances. "
                f"The dashboard continues to work offline."
            )
        }

    try:
        from google.genai import types

        contents = [
            types.Content(
                role="user" if m.get("role") == "user" else "model",
                parts=[types.Part.from_text(text=m.get("content", ""))],
            )
            for m in messages
        ]
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction, temperature=0.7
            ),
        )
        return {"reply": response.text or "No reply generated."}
    except Exception as exc:
        print(f"Gemini chat failure: {exc}")
        return {"reply": f"[API Error - Fallback] Unable to reach the model: {exc}"}


def run_ai_forecast(sales_log: List[Dict[str, Any]]) -> Dict[str, Any]:
    if len(sales_log) < 5:
        return {
            "tomorrowSales": 14500, "weeklySales": 105000, "monthlySales": 435000,
            "confidence": 60,
            "analysisText": "Limited history on file; seeding standard projection benchmarks.",
        }

    client = _get_client()
    if not client:
        total = sum(float(s.get("totalSales", 0)) for s in sales_log)
        avg = round(total / len(sales_log))
        return {
            "tomorrowSales": avg, "weeklySales": avg * 7, "monthlySales": avg * 30,
            "confidence": 75,
            "analysisText": "Forecast computed locally using a rolling average. Set GEMINI_API_KEY for AI forecasts.",
        }

    try:
        from google.genai import types

        recent = json.dumps(sales_log[-14:], default=str)
        prompt = f"""
Analyze this recent Ganesh Bhel sales data and predict tomorrow, next week and month
sales (INR), a confidence percentage (0-100) and a short bilingual coaching note.

Sales data:
{recent}
"""
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=ForecastResult,
                temperature=0.4,
            ),
        )
        return json.loads(response.text)
    except Exception as exc:
        print(f"Forecast failure: {exc}")
        return {
            "tomorrowSales": 14000, "weeklySales": 98000, "monthlySales": 420000,
            "confidence": 50, "analysisText": f"Forecasting fallback active. Issue: {exc}",
        }


def run_ai_health(stats: Dict[str, Any]) -> Dict[str, Any]:
    client = _get_client()
    if not client:
        score = 84
        low_stock_count = int(stats.get("lowStockCount", 0))
        advances_outstanding = float(stats.get("advancesOutstanding", 0))
        total_purchases = float(stats.get("totalPurchases", 0))
        total_sales = float(stats.get("totalSales", 0))

        if low_stock_count > 0:
            score -= min(15, low_stock_count * 3)
        if advances_outstanding > 5000:
            score -= 4
        if total_purchases > total_sales and total_sales > 0:
            score -= 10
        score = max(60, min(98, score))

        rating = "Excellent" if score >= 90 else "Good" if score >= 75 else "Average" if score >= 60 else "Poor"
        return {
            "score": score,
            "rating": rating,
            "profitabilityScore": max(55, min(99, 88 - int((total_purchases / total_sales) * 10) if total_sales > 0 else 88)),
            "cashFlowScore": max(50, min(98, 85 - (10 if advances_outstanding > 10000 else 0))),
            "expenseControlScore": max(60, min(98, 88 - (8 if total_purchases > 15000 else 0))),
            "inventoryScore": max(40, min(99, 95 - (low_stock_count * 8))),
            "analysisText": f"Local scorecard: performance rated {rating} ({score}/100). Recover staff advances and watch low-stock triggers.",
        }

    try:
        from google.genai import types

        prompt = f"""
Analyze this quick-service restaurant health scorecard based on these stats:
{json.dumps(stats)}

Return a structured JSON scorecard. Use bilingual terms ('UPI', 'Galla') in coaching.
"""
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=HealthScoreResult,
                temperature=0.3,
            ),
        )
        return json.loads(response.text)
    except Exception as exc:
        print(f"Health scorecard failure: {exc}")
        return {
            "score": 80, "rating": "Good", "profitabilityScore": 80, "cashFlowScore": 80,
            "expenseControlScore": 80, "inventoryScore": 80,
            "analysisText": f"Health calculation fallback active. Error: {exc}",
        }


def run_voice_parse(text: str) -> Dict[str, Any]:
    client = _get_client()
    if not client:
        txt = text.lower()
        if any(k in txt for k in ("purchase", "bought", "purchased", "खरेदी")):
            amount_match = re.search(r"\d+", txt)
            amount = int(amount_match.group(0)) if amount_match else 500
            return {
                "entryType": "purchase",
                "parsedFields": {
                    "purchaseType": "Shop",
                    "vendorName": "Mahesh Traders" if "mahesh" in txt else "Local Vendor",
                    "itemName": "Potato" if "potato" in txt else "Sev" if "sev" in txt else "Snack ingredient",
                    "category": "Potato" if "potato" in txt else "Sev" if "sev" in txt else "Other",
                    "quantity": 1, "unit": "pcs", "rate": amount, "amount": amount, "paymentMode": "UPI",
                },
                "confidence": 85,
                "explanation": f"[Local pattern matching] Interpreted as a purchase for ₹{amount}.",
            }
        return {
            "entryType": "unknown", "parsedFields": None, "confidence": 0,
            "explanation": "Voice parsing fallback active. Set GEMINI_API_KEY for NL understanding.",
        }

    try:
        from google.genai import types

        prompt = f"""
You are an operational command processor for Ganesh Bhel.
Convert this transcript (Marathi/Hindi/English/mix) into a structured entry.
Determine if it is a PURCHASE or a SALE summary. Return JSON matching the schema.

User spoke: "{text}"
"""
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=VoiceEntryResult,
                temperature=0.2,
            ),
        )
        return json.loads(response.text)
    except Exception as exc:
        print(f"Voice parse failure: {exc}")
        return {
            "entryType": "unknown", "parsedFields": None, "confidence": 0,
            "explanation": f"API parsing error: {exc}",
        }
