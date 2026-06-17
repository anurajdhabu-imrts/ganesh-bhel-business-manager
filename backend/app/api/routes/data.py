"""Core system-data sync endpoints (the blob the React app reads/writes)."""
from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models
from app.api.deps import get_current_user
from app.db.session import get_db
from app.services import backup_service, sync_service

router = APIRouter()


@router.get("/data")
def get_data(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
) -> Dict[str, Any]:
    try:
        data = sync_service.load_system_data(db, user)
        # Seed from the local JSON snapshot on first run when DB is empty.
        if not data.get("sales"):
            local = backup_service.read_local_json()
            if local:
                merged = {**local, **{k: v for k, v in data.items() if v}, "userRole": "owner"}
                sync_service.save_system_data(db, user, merged)
                return sync_service.load_system_data(db, user)
        return data
    except Exception as exc:
        print(f"Postgres fetch failed, serving local snapshot: {exc}")
        local = backup_service.read_local_json()
        if local:
            return local
        raise HTTPException(status_code=500, detail=f"Database error: {exc}")


@router.post("/data")
def save_data(
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
) -> Dict[str, str]:
    try:
        sync_service.save_system_data(db, user, payload)
        # Mirror to local snapshot + rolling backup for resilience.
        backup_service.write_local_json(payload)
        backup_service.trigger_backup(payload)
        return {"status": "success", "message": "PostgreSQL database synced"}
    except Exception as exc:
        db.rollback()
        print(f"Postgres save failed: {exc}")
        # Local fallback so data is never lost.
        current = backup_service.read_local_json()
        merged = {**current, **payload}
        if backup_service.write_local_json(merged):
            backup_service.trigger_backup(merged)
            return {"status": "success", "message": "Saved to local snapshot (DB unavailable)"}
        raise HTTPException(status_code=500, detail=f"Save failed: {exc}")
