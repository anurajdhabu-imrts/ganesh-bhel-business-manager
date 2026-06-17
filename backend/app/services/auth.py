"""Authentication helpers.

Firebase auth is optional. When `FIREBASE_ENABLED` is true and a valid Bearer
token is supplied, the real Firebase UID/email are used. Otherwise the API
falls back to a single local user so the app works out-of-the-box in
local/offline development against PostgreSQL.
"""
from __future__ import annotations

import sys

from app.core.config import settings

LOCAL_UID = "local-user"
LOCAL_EMAIL = "local@ganeshbhel.local"

_firebase_app = None

if settings.FIREBASE_ENABLED:
    try:
        import firebase_admin  # type: ignore

        _firebase_app = firebase_admin.initialize_app()
    except Exception as exc:  # pragma: no cover - depends on runtime env
        print(f"Warning: Firebase Admin init failed: {exc}", file=sys.stderr)


def resolve_identity(authorization: str | None) -> tuple[str, str]:
    """Return (uid, email) for the request.

    Falls back to the local user when Firebase is disabled or no/invalid token
    is provided.
    """
    if settings.FIREBASE_ENABLED and authorization and _firebase_app is not None:
        token = authorization.removeprefix("Bearer ").strip()
        if token:
            try:
                from firebase_admin import auth  # type: ignore

                decoded = auth.verify_id_token(token)
                return decoded.get("uid", LOCAL_UID), decoded.get("email", LOCAL_EMAIL)
            except Exception as exc:  # pragma: no cover
                print(f"Auth token verification failed: {exc}", file=sys.stderr)

    return LOCAL_UID, LOCAL_EMAIL
