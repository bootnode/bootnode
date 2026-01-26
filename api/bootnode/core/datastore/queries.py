"""DataStore query functions for blockchain analytics."""

from datetime import datetime
from typing import Any
from uuid import UUID

from .client import datastore_client


async def get_blocks(
    chain_id: int,
    network: str = "mainnet",
    from_block: int | None = None,
    to_block: int | None = None,
    limit: int = 100,
    offset: int = 0,
) -> list[dict[str, Any]]:
    """Get blocks from DataStore."""
    conditions = ["chain_id = {chain_id:UInt64}", "network = {network:String}"]
    params: dict[str, Any] = {"chain_id": chain_id, "network": network}

    if from_block is not None:
        conditions.append("block_number >= {from_block:UInt64}")
        params["from_block"] = from_block
    if to_block is not None:
        conditions.append("block_number <= {to_block:UInt64}")
        params["to_block"] = to_block

    query = f"""
        SELECT *
        FROM blocks
        WHERE {' AND '.join(conditions)}
        ORDER BY block_number DESC
        LIMIT {limit} OFFSET {offset}
    """
    return await datastore_client.fetch(query, params)


async def get_transactions(
    chain_id: int,
    network: str = "mainnet",
    address: str | None = None,
    from_block: int | None = None,
    to_block: int | None = None,
    limit: int = 100,
    offset: int = 0,
) -> list[dict[str, Any]]:
    """Get transactions from DataStore."""
    conditions = ["chain_id = {chain_id:UInt64}", "network = {network:String}"]
    params: dict[str, Any] = {"chain_id": chain_id, "network": network}

    if address:
        conditions.append("(from_address = {address:String} OR to_address = {address:String})")
        params["address"] = address.lower()
    if from_block is not None:
        conditions.append("block_number >= {from_block:UInt64}")
        params["from_block"] = from_block
    if to_block is not None:
        conditions.append("block_number <= {to_block:UInt64}")
        params["to_block"] = to_block

    query = f"""
        SELECT *
        FROM transactions
        WHERE {' AND '.join(conditions)}
        ORDER BY block_number DESC, tx_index DESC
        LIMIT {limit} OFFSET {offset}
    """
    return await datastore_client.fetch(query, params)


async def get_token_transfers(
    chain_id: int,
    network: str = "mainnet",
    address: str | None = None,
    token_address: str | None = None,
    from_block: int | None = None,
    to_block: int | None = None,
    limit: int = 100,
    offset: int = 0,
) -> list[dict[str, Any]]:
    """Get ERC-20 token transfers from DataStore."""
    conditions = ["chain_id = {chain_id:UInt64}", "network = {network:String}"]
    params: dict[str, Any] = {"chain_id": chain_id, "network": network}

    if address:
        conditions.append("(from_address = {address:String} OR to_address = {address:String})")
        params["address"] = address.lower()
    if token_address:
        conditions.append("token_address = {token_address:String}")
        params["token_address"] = token_address.lower()
    if from_block is not None:
        conditions.append("block_number >= {from_block:UInt64}")
        params["from_block"] = from_block
    if to_block is not None:
        conditions.append("block_number <= {to_block:UInt64}")
        params["to_block"] = to_block

    query = f"""
        SELECT *
        FROM token_transfers
        WHERE {' AND '.join(conditions)}
        ORDER BY block_number DESC, log_index DESC
        LIMIT {limit} OFFSET {offset}
    """
    return await datastore_client.fetch(query, params)


async def get_nft_transfers(
    chain_id: int,
    network: str = "mainnet",
    address: str | None = None,
    contract_address: str | None = None,
    token_id: int | None = None,
    from_block: int | None = None,
    to_block: int | None = None,
    limit: int = 100,
    offset: int = 0,
) -> list[dict[str, Any]]:
    """Get NFT transfers from DataStore."""
    conditions = ["chain_id = {chain_id:UInt64}", "network = {network:String}"]
    params: dict[str, Any] = {"chain_id": chain_id, "network": network}

    if address:
        conditions.append("(from_address = {address:String} OR to_address = {address:String})")
        params["address"] = address.lower()
    if contract_address:
        conditions.append("contract_address = {contract_address:String}")
        params["contract_address"] = contract_address.lower()
    if token_id is not None:
        conditions.append("token_id = {token_id:UInt256}")
        params["token_id"] = token_id
    if from_block is not None:
        conditions.append("block_number >= {from_block:UInt64}")
        params["from_block"] = from_block
    if to_block is not None:
        conditions.append("block_number <= {to_block:UInt64}")
        params["to_block"] = to_block

    query = f"""
        SELECT *
        FROM nft_transfers
        WHERE {' AND '.join(conditions)}
        ORDER BY block_number DESC, log_index DESC
        LIMIT {limit} OFFSET {offset}
    """
    return await datastore_client.fetch(query, params)


async def get_address_activity(
    chain_id: int,
    address: str,
    network: str = "mainnet",
    from_date: datetime | None = None,
    to_date: datetime | None = None,
) -> list[dict[str, Any]]:
    """Get aggregated address activity from DataStore."""
    conditions = [
        "chain_id = {chain_id:UInt64}",
        "network = {network:String}",
        "address = {address:String}",
    ]
    params: dict[str, Any] = {
        "chain_id": chain_id,
        "network": network,
        "address": address.lower(),
    }

    if from_date:
        conditions.append("date >= {from_date:Date}")
        params["from_date"] = from_date.date()
    if to_date:
        conditions.append("date <= {to_date:Date}")
        params["to_date"] = to_date.date()

    query = f"""
        SELECT *
        FROM address_activity
        WHERE {' AND '.join(conditions)}
        ORDER BY date DESC
    """
    return await datastore_client.fetch(query, params)


async def get_api_usage(
    project_id: UUID,
    from_date: datetime | None = None,
    to_date: datetime | None = None,
    chain_id: int | None = None,
) -> dict[str, Any]:
    """Get API usage statistics for a project."""
    conditions = ["project_id = {project_id:UUID}"]
    params: dict[str, Any] = {"project_id": str(project_id)}

    if from_date:
        conditions.append("timestamp >= {from_date:DateTime64(3)}")
        params["from_date"] = from_date
    if to_date:
        conditions.append("timestamp <= {to_date:DateTime64(3)}")
        params["to_date"] = to_date
    if chain_id:
        conditions.append("chain_id = {chain_id:UInt64}")
        params["chain_id"] = chain_id

    query = f"""
        SELECT
            count() as total_requests,
            sum(compute_units) as total_compute_units,
            avg(response_time_ms) as avg_response_time_ms,
            countIf(status_code >= 400) as error_count,
            uniq(endpoint) as unique_endpoints,
            uniq(chain_id) as chains_used
        FROM api_usage
        WHERE {' AND '.join(conditions)}
    """
    return await datastore_client.fetchone(query, params) or {}


async def record_api_usage(
    project_id: UUID,
    api_key_id: UUID,
    chain_id: int,
    network: str,
    endpoint: str,
    method: str,
    compute_units: int,
    response_time_ms: int,
    status_code: int,
    ip_address: str = "",
    user_agent: str = "",
) -> None:
    """Record API usage to DataStore."""
    await datastore_client.insert_one(
        "api_usage",
        {
            "project_id": str(project_id),
            "api_key_id": str(api_key_id),
            "chain_id": chain_id,
            "network": network,
            "endpoint": endpoint,
            "method": method,
            "compute_units": compute_units,
            "response_time_ms": response_time_ms,
            "status_code": status_code,
            "ip_address": ip_address,
            "user_agent": user_agent,
        },
    )


async def get_chain_stats(chain_id: int, network: str = "mainnet") -> dict[str, Any]:
    """Get chain statistics from DataStore."""
    query = """
        SELECT
            max(block_number) as latest_block,
            count() as total_transactions_24h,
            uniq(from_address) as unique_addresses_24h
        FROM transactions
        WHERE chain_id = {chain_id:UInt64}
          AND network = {network:String}
          AND timestamp >= now() - INTERVAL 24 HOUR
    """
    return await datastore_client.fetchone(
        query, {"chain_id": chain_id, "network": network}
    ) or {}
