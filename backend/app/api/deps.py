"""Shared FastAPI dependencies."""
from __future__ import annotations

from fastapi import Depends, Header
from sqlalchemy.orm import Session

from app import models
from app.db.session import get_db
from app.services import auth, sync_service


def get_current_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> models.User:
    """Resolve the request identity and return the (created-if-missing) user."""
    uid, email = auth.resolve_identity(authorization)
    return sync_service.get_or_create_user(db, uid, email)
