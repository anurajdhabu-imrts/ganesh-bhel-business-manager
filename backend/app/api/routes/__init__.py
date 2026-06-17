"""Aggregate all API routers under a single router."""
from fastapi import APIRouter

from app.api.routes import ai, backups, data, health

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(data.router, tags=["data"])
api_router.include_router(backups.router, prefix="/backups", tags=["backups"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
