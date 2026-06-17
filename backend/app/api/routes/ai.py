"""Gemini-backed AI endpoints (chat, forecast, health, voice parsing)."""
from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models
from app.api.deps import get_current_user
from app.db.session import get_db
from app.schemas import AIChatRequest, VoiceInputRequest
from app.services import backup_service, gemini_service, sync_service

router = APIRouter()


def _current_data(db: Session, user: models.User) -> Dict[str, Any]:
    try:
        return sync_service.load_system_data(db, user)
    except Exception:
        return backup_service.read_local_json()


@router.post("/chat")
def ai_chat(
    request: AIChatRequest,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
) -> Dict[str, str]:
    return gemini_service.run_ai_chat(request.messages, _current_data(db, user))


@router.post("/forecast")
def ai_forecast(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
) -> Dict[str, Any]:
    return gemini_service.run_ai_forecast(_current_data(db, user).get("sales", []))


@router.post("/health")
def ai_health(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
) -> Dict[str, Any]:
    data = _current_data(db, user)
    sales = data.get("sales", [])
    purchases = data.get("purchases", [])
    advances = data.get("advances", [])
    inventory = data.get("inventory", [])

    stats = {
        "totalSales": sum(float(s.get("totalSales", 0)) for s in sales),
        "totalPurchases": sum(float(p.get("amount", 0)) for p in purchases),
        "staffCount": len(data.get("staff", [])),
        "advancesOutstanding": sum(
            float(a.get("amount", 0)) - float(a.get("recoveredAmount", 0)) for a in advances
        ),
        "lowStockCount": len(
            [
                i for i in inventory
                if float(i.get("closingStock", 0)) <= float(i.get("lowStockThreshold", 0))
            ]
        ),
    }
    return gemini_service.run_ai_health(stats)


@router.post("/parse-voice")
def ai_parse_voice(request: VoiceInputRequest) -> Dict[str, Any]:
    return gemini_service.run_voice_parse(request.text)
