"""API routes."""

from fastapi import APIRouter

from bootnode.api.rpc import router as rpc_router
from bootnode.api.tokens import router as tokens_router
from bootnode.api.nfts import router as nfts_router
from bootnode.api.transfers import router as transfers_router
from bootnode.api.webhooks import router as webhooks_router
from bootnode.api.wallets import router as wallets_router
from bootnode.api.bundler import router as bundler_router
from bootnode.api.gas import router as gas_router
from bootnode.api.chains import router as chains_router
from bootnode.api.auth import router as auth_router

router = APIRouter()

# Include all sub-routers
router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
router.include_router(chains_router, prefix="/chains", tags=["Chains"])
router.include_router(rpc_router, prefix="/rpc", tags=["RPC"])
router.include_router(tokens_router, prefix="/tokens", tags=["Tokens"])
router.include_router(nfts_router, prefix="/nfts", tags=["NFTs"])
router.include_router(transfers_router, prefix="/transfers", tags=["Transfers"])
router.include_router(webhooks_router, prefix="/webhooks", tags=["Webhooks"])
router.include_router(wallets_router, prefix="/wallets", tags=["Smart Wallets"])
router.include_router(bundler_router, prefix="/bundler", tags=["Bundler (ERC-4337)"])
router.include_router(gas_router, prefix="/gas", tags=["Gas Manager"])
