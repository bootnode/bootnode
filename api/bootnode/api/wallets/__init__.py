"""Smart Wallets API - ERC-4337 Account Abstraction."""

import uuid
from datetime import datetime
from typing import Any

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select

from bootnode.api.deps import ApiKeyDep, DbDep, ProjectDep
from bootnode.db.models import SmartWallet
from bootnode.core.chains import ChainRegistry, RPCClient

router = APIRouter()


# Common SimpleAccount factory addresses
SIMPLE_ACCOUNT_FACTORY = {
    "ethereum": "0x9406Cc6185a346906296840746125a0E44976454",
    "polygon": "0x9406Cc6185a346906296840746125a0E44976454",
    "arbitrum": "0x9406Cc6185a346906296840746125a0E44976454",
    "optimism": "0x9406Cc6185a346906296840746125a0E44976454",
    "base": "0x9406Cc6185a346906296840746125a0E44976454",
}

# EntryPoint v0.6
ENTRY_POINT_V06 = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"
# EntryPoint v0.7
ENTRY_POINT_V07 = "0x0000000071727De22E5E9d8BAf0edAc6f37da032"


class CreateWalletRequest(BaseModel):
    """Create smart wallet request."""

    owner_address: str
    chain: str
    network: str = "mainnet"
    salt: str | None = None  # Optional custom salt


class SmartWalletResponse(BaseModel):
    """Smart wallet response."""

    id: uuid.UUID
    address: str
    owner_address: str
    factory_address: str
    chain: str
    network: str
    is_deployed: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserOperation(BaseModel):
    """ERC-4337 UserOperation."""

    sender: str
    nonce: str
    init_code: str = "0x"
    call_data: str = "0x"
    call_gas_limit: str = "0x0"
    verification_gas_limit: str = "0x0"
    pre_verification_gas: str = "0x0"
    max_fee_per_gas: str = "0x0"
    max_priority_fee_per_gas: str = "0x0"
    paymaster_and_data: str = "0x"
    signature: str = "0x"


class UserOpEstimate(BaseModel):
    """UserOperation gas estimate."""

    call_gas_limit: str
    verification_gas_limit: str
    pre_verification_gas: str
    max_fee_per_gas: str
    max_priority_fee_per_gas: str


@router.post("/create", response_model=SmartWalletResponse)
async def create_smart_wallet(
    request: CreateWalletRequest,
    api_key: ApiKeyDep,
    project: ProjectDep,
    db: DbDep,
) -> SmartWallet:
    """
    Create a counterfactual smart wallet address.

    The wallet is not deployed on-chain until the first transaction.
    """
    if not ChainRegistry.is_supported(request.chain, request.network):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported chain/network: {request.chain}/{request.network}",
        )

    owner_address = request.owner_address.lower()

    # Generate salt if not provided
    if request.salt:
        salt = request.salt
    else:
        import secrets
        salt = "0x" + secrets.token_hex(32)

    # Get factory address for chain
    factory_address = SIMPLE_ACCOUNT_FACTORY.get(request.chain)
    if not factory_address:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Smart wallets not supported on {request.chain}",
        )

    # Calculate counterfactual address
    # This would normally involve calling getAddress on the factory
    # For simplicity, we'll compute it deterministically
    wallet_address = await _compute_wallet_address(
        request.chain, request.network, factory_address, owner_address, salt
    )

    # Check if wallet already exists
    existing = await db.execute(
        select(SmartWallet).where(SmartWallet.address == wallet_address)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Wallet already exists",
        )

    wallet = SmartWallet(
        project_id=project.id,
        address=wallet_address,
        owner_address=owner_address,
        factory_address=factory_address,
        chain=request.chain,
        network=request.network,
        salt=salt,
        is_deployed=False,
    )

    db.add(wallet)
    await db.commit()
    await db.refresh(wallet)

    return wallet


@router.get("/{address}", response_model=SmartWalletResponse)
async def get_smart_wallet(
    address: str,
    api_key: ApiKeyDep,
    project: ProjectDep,
    db: DbDep,
) -> SmartWallet:
    """Get smart wallet by address."""
    address = address.lower()

    result = await db.execute(
        select(SmartWallet).where(
            SmartWallet.address == address,
            SmartWallet.project_id == project.id,
        )
    )
    wallet = result.scalar_one_or_none()

    if not wallet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wallet not found",
        )

    # Check if deployed on-chain
    async with RPCClient(wallet.chain, wallet.network) as client:
        code = await client.call("eth_getCode", [wallet.address, "latest"])
        is_deployed = code and code != "0x"

        if is_deployed and not wallet.is_deployed:
            wallet.is_deployed = True
            await db.commit()
            await db.refresh(wallet)

    return wallet


@router.get("", response_model=list[SmartWalletResponse])
async def list_smart_wallets(
    api_key: ApiKeyDep,
    project: ProjectDep,
    db: DbDep,
    chain: str | None = None,
) -> list[SmartWallet]:
    """List all smart wallets for the project."""
    query = select(SmartWallet).where(SmartWallet.project_id == project.id)

    if chain:
        query = query.where(SmartWallet.chain == chain)

    result = await db.execute(query)
    return list(result.scalars().all())


@router.post("/{address}/estimate", response_model=UserOpEstimate)
async def estimate_user_operation(
    address: str,
    user_op: UserOperation,
    api_key: ApiKeyDep,
    project: ProjectDep,
    db: DbDep,
) -> UserOpEstimate:
    """
    Estimate gas for a UserOperation.

    Returns recommended gas limits and fees.
    """
    address = address.lower()

    # Get wallet
    result = await db.execute(
        select(SmartWallet).where(
            SmartWallet.address == address,
            SmartWallet.project_id == project.id,
        )
    )
    wallet = result.scalar_one_or_none()

    if not wallet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wallet not found",
        )

    async with RPCClient(wallet.chain, wallet.network) as client:
        # Get current gas prices
        gas_price = await client.get_gas_price()

        try:
            # Try to get EIP-1559 fees
            max_priority_fee = await client.call("eth_maxPriorityFeePerGas", [])
            max_priority_fee_int = int(max_priority_fee, 16)

            # Get latest block for baseFee
            block = await client.call("eth_getBlockByNumber", ["latest", False])
            base_fee = int(block.get("baseFeePerGas", "0x0"), 16)

            max_fee = base_fee + max_priority_fee_int
        except Exception:
            max_priority_fee_int = gas_price // 10
            max_fee = gas_price

        # Estimate verification and call gas
        # These are rough estimates - real implementation would simulate
        verification_gas = 100000
        call_gas = 50000
        pre_verification_gas = 21000

        return UserOpEstimate(
            call_gas_limit=hex(call_gas),
            verification_gas_limit=hex(verification_gas),
            pre_verification_gas=hex(pre_verification_gas),
            max_fee_per_gas=hex(max_fee),
            max_priority_fee_per_gas=hex(max_priority_fee_int),
        )


@router.get("/{address}/nonce")
async def get_wallet_nonce(
    address: str,
    api_key: ApiKeyDep,
    project: ProjectDep,
    db: DbDep,
    key: str = "0x0",  # Nonce key for multi-dimensional nonces
) -> dict:
    """Get the current nonce for a smart wallet."""
    address = address.lower()

    # Get wallet
    result = await db.execute(
        select(SmartWallet).where(
            SmartWallet.address == address,
            SmartWallet.project_id == project.id,
        )
    )
    wallet = result.scalar_one_or_none()

    if not wallet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wallet not found",
        )

    async with RPCClient(wallet.chain, wallet.network) as client:
        # Call getNonce on EntryPoint
        # getNonce(address sender, uint192 key) returns (uint256)
        key_padded = key[2:].zfill(48) if key.startswith("0x") else key.zfill(48)
        sender_padded = address[2:].zfill(64)
        data = f"0x35567e1a{sender_padded}{key_padded.zfill(64)}"

        try:
            nonce_result = await client.call_contract(ENTRY_POINT_V06, data)
            nonce = int(nonce_result, 16) if nonce_result != "0x" else 0
        except Exception:
            nonce = 0

        return {
            "address": address,
            "key": key,
            "nonce": nonce,
            "nonce_hex": hex(nonce),
        }


async def _compute_wallet_address(
    chain: str,
    network: str,
    factory_address: str,
    owner_address: str,
    salt: str,
) -> str:
    """
    Compute the counterfactual wallet address.

    This calls getAddress on the factory contract.
    """
    async with RPCClient(chain, network) as client:
        # getAddress(address owner, uint256 salt) returns (address)
        owner_padded = owner_address[2:].zfill(64)
        salt_padded = salt[2:].zfill(64) if salt.startswith("0x") else salt.zfill(64)
        data = f"0x8cb84e18{owner_padded}{salt_padded}"

        try:
            result = await client.call_contract(factory_address, data)
            if result and result != "0x":
                return "0x" + result[-40:]
        except Exception:
            pass

        # Fallback: compute CREATE2 address manually
        import hashlib
        from eth_account._utils.structured_data.hashing import hash_domain

        # This is a simplified version - real implementation needs init code hash
        combined = f"{factory_address}{owner_address}{salt}"
        address_hash = hashlib.sha256(combined.encode()).hexdigest()[-40:]
        return f"0x{address_hash}"
