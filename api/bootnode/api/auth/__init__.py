"""Bootnode Authentication.

Supports:
- Local auth (development): email/password
- Hanzo IAM (production): OAuth2 with hanzo.id, zoo.id, lux.id, pars.id
"""

from fastapi import APIRouter

from bootnode.api.auth_keys import router as api_keys_router
from bootnode.config import get_settings
from .local import router as local_router
from .oauth import router as oauth_router

settings = get_settings()
router = APIRouter()

# Local auth routes (login, register, me)
router.include_router(local_router, tags=["Authentication"])

# Hanzo IAM OAuth routes
router.include_router(oauth_router, tags=["Hanzo IAM"])

# API key management routes
router.include_router(api_keys_router, tags=["API Keys"])
