"""Seed script - creates a test project and API key for local development."""

import asyncio
import hashlib
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from bootnode.config import get_settings
from bootnode.db.models import ApiKey, Base, Project

DEV_API_KEY = "bn_dev_test_key_12345"


async def seed() -> None:
    """Create dev project and API key."""
    settings = get_settings()
    engine = create_async_engine(str(settings.database_url), echo=True)

    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with session_factory() as session:
        # Check if dev project already exists
        result = await session.execute(
            select(Project).where(Project.name == "Dev Project")
        )
        project = result.scalar_one_or_none()

        if project:
            print(f"Dev project already exists: {project.id}")
        else:
            project = Project(
                id=uuid.UUID("00000000-0000-0000-0000-000000000001"),
                name="Dev Project",
                owner_id=uuid.UUID("00000000-0000-0000-0000-000000000099"),
                description="Local development project",
                settings={"tier": "free", "env": "development"},
            )
            session.add(project)
            await session.flush()
            print(f"Created dev project: {project.id}")

        # Check if dev API key already exists
        key_hash = hashlib.sha256(
            f"{DEV_API_KEY}{settings.api_key_salt}".encode()
        ).hexdigest()

        result = await session.execute(
            select(ApiKey).where(ApiKey.key_hash == key_hash)
        )
        api_key = result.scalar_one_or_none()

        if api_key:
            print(f"Dev API key already exists: {api_key.key_prefix}...")
        else:
            api_key = ApiKey(
                id=uuid.UUID("00000000-0000-0000-0000-000000000002"),
                project_id=project.id,
                name="Dev Key",
                key_hash=key_hash,
                key_prefix=DEV_API_KEY[:12],
                rate_limit=10000,
                compute_units_limit=100000,
                allowed_origins=None,
                allowed_chains=None,
                is_active=True,
            )
            session.add(api_key)
            print(f"Created dev API key: {DEV_API_KEY}")

        await session.commit()

    await engine.dispose()
    print("\nSeed complete. Use this API key for local testing:")
    print(f"  X-API-Key: {DEV_API_KEY}")
    print(f"  curl -H 'X-API-Key: {DEV_API_KEY}' http://localhost:8100/v1/rpc/ethereum -d '{{\"method\":\"eth_blockNumber\",\"params\":[]}}'")


if __name__ == "__main__":
    asyncio.run(seed())
