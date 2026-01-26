"""Gas Manager API - Gas prices and sponsorship."""

import uuid
from datetime import datetime
from typing import Any

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select

from bootnode.api.deps import ApiKeyDep, DbDep, ProjectDep
from bootnode.db.models import GasPolicy
from bootnode.core.chains import ChainRegistry, RPCClient

router = APIRouter()


class GasPrices(BaseModel):
    """Current gas prices."""

    chain: str
    network: str
    timestamp: datetime
    # Legacy
    gas_price: str
    gas_price_gwei: float
    # EIP-1559
    base_fee: str | None
    base_fee_gwei: float | None
    max_priority_fee: str | None
    max_priority_fee_gwei: float | None
    # Recommended
    slow: dict[str, str]
    standard: dict[str, str]
    fast: dict[str, str]


class CreateGasPolicyRequest(BaseModel):
    """Create gas policy request."""

    name: str
    chain: str
    network: str = "mainnet"
    rules: dict[str, Any]
    max_gas_per_op: int = 1000000
    max_spend_per_day_usd: int = 100  # in cents
    allowed_contracts: list[str] | None = None
    allowed_methods: list[str] | None = None


class GasPolicyResponse(BaseModel):
    """Gas policy response."""

    id: uuid.UUID
    name: str
    chain: str
    network: str
    rules: dict[str, Any]
    max_gas_per_op: int
    max_spend_per_day_usd: int
    allowed_contracts: list[str] | None
    allowed_methods: list[str] | None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class SponsorRequest(BaseModel):
    """Gas sponsorship request."""

    user_op: dict[str, Any]
    entry_point: str
    policy_id: uuid.UUID | None = None


class SponsorResponse(BaseModel):
    """Gas sponsorship response."""

    paymaster_and_data: str
    pre_verification_gas: str
    verification_gas_limit: str
    call_gas_limit: str


@router.get("/{chain}/prices", response_model=GasPrices)
async def get_gas_prices(
    chain: str,
    api_key: ApiKeyDep,
    network: str = "mainnet",
) -> GasPrices:
    """Get current gas prices for a chain."""
    if not ChainRegistry.is_supported(chain, network):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported chain/network: {chain}/{network}",
        )

    async with RPCClient(chain, network) as client:
        # Get legacy gas price
        gas_price = await client.get_gas_price()
        gas_price_gwei = gas_price / 1e9

        # Try to get EIP-1559 data
        base_fee = None
        base_fee_gwei = None
        max_priority_fee = None
        max_priority_fee_gwei = None

        try:
            block = await client.call("eth_getBlockByNumber", ["latest", False])
            if block and block.get("baseFeePerGas"):
                base_fee = int(block["baseFeePerGas"], 16)
                base_fee_gwei = base_fee / 1e9

            max_priority_fee_result = await client.call("eth_maxPriorityFeePerGas", [])
            max_priority_fee = int(max_priority_fee_result, 16)
            max_priority_fee_gwei = max_priority_fee / 1e9
        except Exception:
            pass

        # Calculate recommended prices
        if base_fee is not None:
            # EIP-1559 chain
            slow_priority = max_priority_fee or gas_price // 10
            standard_priority = int(slow_priority * 1.5)
            fast_priority = int(slow_priority * 2)

            slow = {
                "maxFeePerGas": hex(base_fee + slow_priority),
                "maxPriorityFeePerGas": hex(slow_priority),
            }
            standard = {
                "maxFeePerGas": hex(int(base_fee * 1.1) + standard_priority),
                "maxPriorityFeePerGas": hex(standard_priority),
            }
            fast = {
                "maxFeePerGas": hex(int(base_fee * 1.25) + fast_priority),
                "maxPriorityFeePerGas": hex(fast_priority),
            }
        else:
            # Legacy chain
            slow = {"gasPrice": hex(gas_price)}
            standard = {"gasPrice": hex(int(gas_price * 1.1))}
            fast = {"gasPrice": hex(int(gas_price * 1.25))}

        return GasPrices(
            chain=chain,
            network=network,
            timestamp=datetime.utcnow(),
            gas_price=hex(gas_price),
            gas_price_gwei=gas_price_gwei,
            base_fee=hex(base_fee) if base_fee else None,
            base_fee_gwei=base_fee_gwei,
            max_priority_fee=hex(max_priority_fee) if max_priority_fee else None,
            max_priority_fee_gwei=max_priority_fee_gwei,
            slow=slow,
            standard=standard,
            fast=fast,
        )


@router.post("/policies", response_model=GasPolicyResponse)
async def create_gas_policy(
    request: CreateGasPolicyRequest,
    api_key: ApiKeyDep,
    project: ProjectDep,
    db: DbDep,
) -> GasPolicy:
    """Create a new gas sponsorship policy."""
    if not ChainRegistry.is_supported(request.chain, request.network):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported chain/network: {request.chain}/{request.network}",
        )

    policy = GasPolicy(
        project_id=project.id,
        name=request.name,
        chain=request.chain,
        network=request.network,
        rules=request.rules,
        max_gas_per_op=request.max_gas_per_op,
        max_spend_per_day_usd=request.max_spend_per_day_usd,
        allowed_contracts=[c.lower() for c in request.allowed_contracts] if request.allowed_contracts else None,
        allowed_methods=request.allowed_methods,
    )

    db.add(policy)
    await db.commit()
    await db.refresh(policy)

    return policy


@router.get("/policies", response_model=list[GasPolicyResponse])
async def list_gas_policies(
    api_key: ApiKeyDep,
    project: ProjectDep,
    db: DbDep,
    chain: str | None = None,
) -> list[GasPolicy]:
    """List all gas policies for the project."""
    query = select(GasPolicy).where(GasPolicy.project_id == project.id)

    if chain:
        query = query.where(GasPolicy.chain == chain)

    result = await db.execute(query)
    return list(result.scalars().all())


@router.get("/policies/{policy_id}", response_model=GasPolicyResponse)
async def get_gas_policy(
    policy_id: uuid.UUID,
    api_key: ApiKeyDep,
    project: ProjectDep,
    db: DbDep,
) -> GasPolicy:
    """Get a specific gas policy."""
    result = await db.execute(
        select(GasPolicy).where(
            GasPolicy.id == policy_id,
            GasPolicy.project_id == project.id,
        )
    )
    policy = result.scalar_one_or_none()

    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Policy not found",
        )

    return policy


@router.delete("/policies/{policy_id}")
async def delete_gas_policy(
    policy_id: uuid.UUID,
    api_key: ApiKeyDep,
    project: ProjectDep,
    db: DbDep,
) -> dict:
    """Delete a gas policy."""
    result = await db.execute(
        select(GasPolicy).where(
            GasPolicy.id == policy_id,
            GasPolicy.project_id == project.id,
        )
    )
    policy = result.scalar_one_or_none()

    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Policy not found",
        )

    await db.delete(policy)
    await db.commit()

    return {"status": "deleted", "id": str(policy_id)}


@router.post("/sponsor", response_model=SponsorResponse)
async def sponsor_user_operation(
    request: SponsorRequest,
    api_key: ApiKeyDep,
    project: ProjectDep,
    db: DbDep,
) -> SponsorResponse:
    """
    Get paymaster data to sponsor a UserOperation.

    This endpoint checks if the UserOp qualifies for sponsorship
    based on the project's gas policies and returns the paymaster data.
    """
    user_op = request.user_op
    sender = user_op.get("sender", "").lower()
    call_data = user_op.get("callData", "0x")

    # Find applicable policy
    if request.policy_id:
        result = await db.execute(
            select(GasPolicy).where(
                GasPolicy.id == request.policy_id,
                GasPolicy.project_id == project.id,
                GasPolicy.is_active == True,
            )
        )
        policy = result.scalar_one_or_none()
    else:
        # Find first matching active policy
        result = await db.execute(
            select(GasPolicy).where(
                GasPolicy.project_id == project.id,
                GasPolicy.is_active == True,
            )
        )
        policy = result.scalars().first()

    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active gas policy found",
        )

    # Check policy rules
    # 1. Check allowed contracts
    if policy.allowed_contracts:
        # Extract target from callData (first 4 bytes are selector, next is target for execute())
        # This is simplified - real implementation needs proper decoding
        target = call_data[10:50] if len(call_data) > 50 else None
        if target and f"0x{target}" not in policy.allowed_contracts:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Target contract not allowed by policy",
            )

    # 2. Check gas limits
    call_gas = int(user_op.get("callGasLimit", "0x0"), 16)
    verification_gas = int(user_op.get("verificationGasLimit", "0x0"), 16)
    total_gas = call_gas + verification_gas

    if total_gas > policy.max_gas_per_op:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Gas exceeds policy limit ({total_gas} > {policy.max_gas_per_op})",
        )

    # In production, this would:
    # 1. Sign the UserOp with the paymaster's key
    # 2. Return proper paymasterAndData with signature
    # 3. Track spending against daily limits

    # Simplified response
    return SponsorResponse(
        paymaster_and_data="0x",  # Would be actual paymaster + signature
        pre_verification_gas=user_op.get("preVerificationGas", "0x5208"),
        verification_gas_limit=user_op.get("verificationGasLimit", "0x186a0"),
        call_gas_limit=user_op.get("callGasLimit", "0x186a0"),
    )


@router.post("/estimate")
async def estimate_gas(
    chain: str,
    to: str,
    api_key: ApiKeyDep,
    network: str = "mainnet",
    data: str = "0x",
    value: str = "0x0",
    from_address: str | None = None,
) -> dict:
    """Estimate gas for a transaction."""
    if not ChainRegistry.is_supported(chain, network):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported chain/network: {chain}/{network}",
        )

    async with RPCClient(chain, network) as client:
        gas_estimate = await client.estimate_gas(
            to=to,
            data=data if data != "0x" else None,
            from_address=from_address,
            value=int(value, 16) if value != "0x0" else None,
        )

        gas_price = await client.get_gas_price()

        return {
            "gas_estimate": gas_estimate,
            "gas_estimate_hex": hex(gas_estimate),
            "gas_price": gas_price,
            "gas_price_hex": hex(gas_price),
            "estimated_cost_wei": gas_estimate * gas_price,
            "estimated_cost_gwei": (gas_estimate * gas_price) / 1e9,
            "estimated_cost_eth": (gas_estimate * gas_price) / 1e18,
        }
