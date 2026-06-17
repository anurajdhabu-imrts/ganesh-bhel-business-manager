"""Local JSON snapshot + rolling backup management.

Provides a resilient on-disk fallback store (db.json) and timestamped backups,
mirroring the behaviour of the original Node/Express implementation.
"""
from __future__ import annotations

import json
import os
from datetime import datetime
from typing import Any, Dict, List

from app.core.config import settings

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DB_PATH = os.path.join(BASE_DIR, "db.json")
BACKUPS_DIR = os.path.join(BASE_DIR, "backups")

os.makedirs(BACKUPS_DIR, exist_ok=True)


def read_local_json() -> Dict[str, Any]:
    try:
        if not os.path.exists(DB_PATH):
            return {}
        with open(DB_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as exc:
        print(f"Error reading local JSON store: {exc}")
        return {}


def write_local_json(data: Dict[str, Any]) -> bool:
    try:
        with open(DB_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False, default=str)
        return True
    except Exception as exc:
        print(f"Error writing local JSON store: {exc}")
        return False


def trigger_backup(data: Dict[str, Any]) -> None:
    """Write a timestamped snapshot and prune to the configured retention."""
    try:
        timestamp = datetime.now().isoformat().replace(":", "-").replace(".", "-")
        backup_path = os.path.join(BACKUPS_DIR, f"db_backup_{timestamp}.json")
        with open(backup_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False, default=str)

        files = [
            f for f in os.listdir(BACKUPS_DIR)
            if f.startswith("db_backup_") and f.endswith(".json")
        ]
        files.sort(
            key=lambda x: os.path.getmtime(os.path.join(BACKUPS_DIR, x)),
            reverse=True,
        )
        for old_file in files[settings.MAX_BACKUPS:]:
            os.remove(os.path.join(BACKUPS_DIR, old_file))
    except Exception as exc:
        print(f"Failed to create backup: {exc}")


def list_backups() -> List[Dict[str, Any]]:
    backups: List[Dict[str, Any]] = []
    for f in os.listdir(BACKUPS_DIR):
        if f.startswith("db_backup_") and f.endswith(".json"):
            stats = os.stat(os.path.join(BACKUPS_DIR, f))
            backups.append(
                {
                    "filename": f,
                    "timestamp": datetime.fromtimestamp(stats.st_mtime).isoformat() + "Z",
                    "size": stats.st_size,
                }
            )
    backups.sort(key=lambda x: x["timestamp"], reverse=True)
    return backups


def read_backup(filename: str) -> Dict[str, Any]:
    target = os.path.join(BACKUPS_DIR, filename)
    if not os.path.abspath(target).startswith(os.path.abspath(BACKUPS_DIR)):
        raise FileNotFoundError("Invalid backup path")
    if not os.path.exists(target):
        raise FileNotFoundError(filename)
    with open(target, "r", encoding="utf-8") as f:
        return json.load(f)
