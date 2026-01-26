"""Bootnode API - Main application entry point."""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse

from bootnode.config import get_settings
from bootnode.api import router as api_router
from bootnode.ws import router as ws_router
from bootnode.db.session import engine, init_db
from bootnode.core.cache import redis_client
from bootnode.core.datastore import datastore_client

logger = structlog.get_logger()
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan handler."""
    # Startup
    logger.info("Starting Bootnode API", env=settings.app_env)
    await init_db()
    await redis_client.initialize()

    # Initialize DataStore (ClickHouse) - optional, won't fail startup
    try:
        await datastore_client.initialize()
        logger.info("DataStore connected")
    except Exception as e:
        logger.warning("DataStore not available", error=str(e))

    yield

    # Shutdown
    logger.info("Shutting down Bootnode API")
    await engine.dispose()
    await redis_client.close()
    await datastore_client.close()


app = FastAPI(
    title="Bootnode API",
    description="Blockchain Development Platform - Multi-chain RPC, Token API, NFT API, Smart Wallets, and more",
    version="2.0.0",
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
    openapi_url="/openapi.json" if not settings.is_production else None,
    default_response_class=ORJSONResponse,
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if not settings.is_production else ["https://bootnode.dev"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix=settings.api_prefix)

# Include WebSocket routes
app.include_router(ws_router, prefix=f"{settings.api_prefix}/ws", tags=["WebSocket"])


@app.get("/health")
async def health_check() -> dict:
    """Health check endpoint."""
    return {"status": "healthy", "version": "2.0.0"}


@app.get("/")
async def root() -> dict:
    """Root endpoint."""
    return {
        "name": "Bootnode API",
        "version": "2.0.0",
        "docs": "/docs",
        "status": "operational",
    }
