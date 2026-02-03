"""Authentication API."""

import hashlib
import secrets
import uuid
from datetime import datetime

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select

from bootnode.api.deps import DbDep
from bootnode.config import get_settings
from bootnode.db.models import ApiKey, Project

router = APIRouter()
settings = get_settings()


class CreateProjectRequest(BaseModel):
    """Create project request."""

    name: str
    description: str | None = None
    owner_id: uuid.UUID  # In production, this would come from auth


class ProjectResponse(BaseModel):
    """Project response."""

    id: uuid.UUID
    name: str
    description: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class CreateApiKeyRequest(BaseModel):
    """Create API key request."""

    project_id: uuid.UUID
    name: str
    rate_limit: int = 100
    compute_units_limit: int = 1000
    allowed_origins: list[str] | None = None
    allowed_chains: list[str] | None = None


class ApiKeyResponse(BaseModel):
    """API key response."""

    id: uuid.UUID
    name: str
    key: str  # Only returned on creation
    key_prefix: str
    rate_limit: int
    compute_units_limit: int
    created_at: datetime


class ApiKeyListResponse(BaseModel):
    """API key list response (without full key)."""

    id: uuid.UUID
    name: str
    key_prefix: str
    rate_limit: int
    compute_units_limit: int
    is_active: bool
    last_used_at: datetime | None
    created_at: datetime

    class Config:
        from_attributes = True


@router.post("/projects", response_model=ProjectResponse)
async def create_project(
    request: CreateProjectRequest,
    db: DbDep,
) -> Project:
    """Create a new project."""
    project = Project(
        name=request.name,
        description=request.description,
        owner_id=request.owner_id,
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return project


@router.get("/projects/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: uuid.UUID,
    db: DbDep,
) -> Project:
    """Get project by ID."""
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    return project


@router.post("/keys", response_model=ApiKeyResponse)
async def create_api_key(
    request: CreateApiKeyRequest,
    db: DbDep,
) -> dict:
    """Create a new API key."""
    # Verify project exists
    result = await db.execute(select(Project).where(Project.id == request.project_id))
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    # Generate secure API key
    raw_key = f"bn_{secrets.token_urlsafe(32)}"
    key_hash = hashlib.sha256(
        f"{raw_key}{settings.api_key_salt}".encode()
    ).hexdigest()
    key_prefix = raw_key[:12]

    api_key = ApiKey(
        project_id=request.project_id,
        name=request.name,
        key_hash=key_hash,
        key_prefix=key_prefix,
        rate_limit=request.rate_limit,
        compute_units_limit=request.compute_units_limit,
        allowed_origins=request.allowed_origins,
        allowed_chains=request.allowed_chains,
    )
    db.add(api_key)
    await db.commit()
    await db.refresh(api_key)

    return {
        "id": api_key.id,
        "name": api_key.name,
        "key": raw_key,  # Only returned once!
        "key_prefix": api_key.key_prefix,
        "rate_limit": api_key.rate_limit,
        "compute_units_limit": api_key.compute_units_limit,
        "created_at": api_key.created_at,
    }


@router.get("/keys", response_model=list[ApiKeyListResponse])
async def list_api_keys(
    project_id: uuid.UUID,
    db: DbDep,
) -> list[ApiKey]:
    """List API keys for a project."""
    result = await db.execute(
        select(ApiKey).where(ApiKey.project_id == project_id)
    )
    return list(result.scalars().all())


@router.delete("/keys/{key_id}")
async def delete_api_key(
    key_id: uuid.UUID,
    db: DbDep,
) -> dict:
    """Delete (deactivate) an API key."""
    result = await db.execute(select(ApiKey).where(ApiKey.id == key_id))
    api_key = result.scalar_one_or_none()

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found",
        )

    api_key.is_active = False
    await db.commit()

    return {"status": "deleted", "id": str(key_id)}
