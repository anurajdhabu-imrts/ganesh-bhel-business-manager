"""Backup snapshot management endpoints."""
from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, HTTPException

from app.schemas import BackupRestoreRequest
from app.services import backup_service

router = APIRouter()


@router.get("")
def get_backups() -> Dict[str, Any]:
    try:
        return {"success": True, "backups": backup_service.list_backups()}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/create")
def create_backup() -> Dict[str, Any]:
    try:
        backup_service.trigger_backup(backup_service.read_local_json())
        return {"success": True, "message": "Manual backup registered."}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/restore")
def restore_backup(request: BackupRestoreRequest) -> Dict[str, Any]:
    try:
        parsed = backup_service.read_backup(request.filename)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Backup snapshot not found.")
    backup_service.write_local_json(parsed)
    return {"success": True, "message": f"Restored state from {request.filename}"}


@router.post("/upload")
def upload_backup(payload: Dict[str, Any]) -> Dict[str, Any]:
    try:
        backup_service.write_local_json(payload)
        backup_service.trigger_backup(payload)
        return {"success": True, "message": "Backup uploaded and set as primary snapshot."}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
