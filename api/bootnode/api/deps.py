"""API dependencies."""

import hashlib
from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from bootnode.db.session import get_db
from bootnode.db.models import ApiKey, Project
from bootnode.core.cache import redis_client
from bootnode.config import get_settings

settings = get_settings()


async def verify_api_key(
    x_api_key: Annotated[str | None, Header()] = None,
    authorization: Annotated[str | None, Header()] = None,
    db: AsyncSession = Depends(get_db),
) -> ApiKey:
    """Verify API key from header."""
    # Extract key from either X-API-Key or Authorization: Bearer header
    api_key = x_api_key
    if not api_key and authorization:
        if authorization.startswith("Bearer "):
            api_key = authorization[7:]

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key required. Pass via X-API-Key header or Authorization: Bearer <key>",
        )

    # Hash the key for lookup
    key_hash = hashlib.sha256(
        f"{api_key}{settings.api_key_salt}".encode()
    ).hexdigest()

    # Look up the key
    result = await db.execute(
        select(ApiKey).where(ApiKey.key_hash == key_hash, ApiKey.is_active == True)
    )
    db_key = result.scalar_one_or_none()

    if not db_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key",
        )

    # Check rate limit
    rate_key = f"rate:{db_key.id}"
    allowed, remaining = await redis_client.rate_limit_check(
        rate_key, db_key.rate_limit
    )

    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded",
            headers={"X-RateLimit-Remaining": "0", "Retry-After": "60"},
        )

    return db_key


async def get_project_from_key(
    api_key: ApiKey = Depends(verify_api_key),
    db: AsyncSession = Depends(get_db),
) -> Project:
    """Get project from API key."""
    result = await db.execute(
        select(Project).where(Project.id == api_key.project_id)
    )
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    return project


# Type aliases for dependency injection
ApiKeyDep = Annotated[ApiKey, Depends(verify_api_key)]
ProjectDep = Annotated[Project, Depends(get_project_from_key)]
DbDep = Annotated[AsyncSession, Depends(get_db)]
