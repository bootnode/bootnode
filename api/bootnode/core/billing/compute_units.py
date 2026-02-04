"""Compute Unit costs per RPC method.

Alchemy-style billing where each method costs a fixed number of compute units.
This allows for fair pricing based on actual resource consumption.
"""

# Default CU cost for unknown methods
DEFAULT_COMPUTE_UNITS = 10

# Compute units per method
COMPUTE_UNITS: dict[str, int] = {
    # =========================================================================
    # Free tier (1 CU) - Simple queries, minimal compute
    # =========================================================================
    "eth_chainId": 1,
    "eth_blockNumber": 1,
    "eth_syncing": 1,
    "eth_gasPrice": 1,
    "net_version": 1,
    "net_listening": 1,
    "net_peerCount": 1,
    "web3_clientVersion": 1,
    "web3_sha3": 1,
    # =========================================================================
    # Light (5 CU) - Single lookups, indexed queries
    # =========================================================================
    "eth_getBalance": 5,
    "eth_getCode": 5,
    "eth_getBlockByNumber": 5,
    "eth_getBlockByHash": 5,
    "eth_getTransactionByHash": 5,
    "eth_getTransactionReceipt": 5,
    "eth_getTransactionByBlockHashAndIndex": 5,
    "eth_getTransactionByBlockNumberAndIndex": 5,
    "eth_getBlockTransactionCountByHash": 5,
    "eth_getBlockTransactionCountByNumber": 5,
    "eth_getUncleCountByBlockHash": 5,
    "eth_getUncleCountByBlockNumber": 5,
    "eth_getUncleByBlockHashAndIndex": 5,
    "eth_getUncleByBlockNumberAndIndex": 5,
    "eth_getStorageAt": 5,
    "eth_getTransactionCount": 5,
    "eth_accounts": 5,
    "eth_protocolVersion": 5,
    "eth_coinbase": 5,
    "eth_mining": 5,
    "eth_hashrate": 5,
    # =========================================================================
    # Medium (10 CU) - EVM execution, moderate compute
    # =========================================================================
    "eth_call": 10,
    "eth_estimateGas": 10,
    "eth_feeHistory": 10,
    "eth_maxPriorityFeePerGas": 10,
    "eth_createAccessList": 10,
    "eth_getBlockReceipts": 10,
    "eth_getProof": 10,
    # =========================================================================
    # Heavy (25 CU) - Log queries, filter operations
    # =========================================================================
    "eth_getLogs": 25,
    "eth_newFilter": 25,
    "eth_newBlockFilter": 25,
    "eth_newPendingTransactionFilter": 25,
    "eth_getFilterLogs": 25,
    "eth_getFilterChanges": 25,
    "eth_uninstallFilter": 25,
    # =========================================================================
    # Transaction (50 CU) - State changes, mempool operations
    # =========================================================================
    "eth_sendRawTransaction": 50,
    "eth_sendTransaction": 50,
    "eth_sign": 50,
    "eth_signTransaction": 50,
    "personal_sign": 50,
    "eth_signTypedData_v4": 50,
    # =========================================================================
    # Debug/Trace (100 CU) - Heavy compute, full execution
    # =========================================================================
    "debug_traceTransaction": 100,
    "debug_traceBlockByNumber": 100,
    "debug_traceBlockByHash": 100,
    "debug_traceCall": 100,
    "trace_block": 100,
    "trace_call": 100,
    "trace_callMany": 100,
    "trace_filter": 100,
    "trace_get": 100,
    "trace_rawTransaction": 100,
    "trace_replayBlockTransactions": 100,
    "trace_replayTransaction": 100,
    "trace_transaction": 100,
    # =========================================================================
    # ERC-4337 Account Abstraction
    # =========================================================================
    "eth_sendUserOperation": 75,
    "eth_estimateUserOperationGas": 25,
    "eth_getUserOperationByHash": 10,
    "eth_getUserOperationReceipt": 10,
    "eth_supportedEntryPoints": 5,
    # =========================================================================
    # Bootnode Enhanced APIs - Token/NFT/Webhook
    # =========================================================================
    # Token APIs
    "tokens_getBalances": 15,
    "tokens_getMetadata": 10,
    "tokens_getTransfers": 20,
    "tokens_getHolders": 25,
    "tokens_getPrice": 10,
    # NFT APIs
    "nfts_getOwned": 20,
    "nfts_getMetadata": 10,
    "nfts_refreshMetadata": 50,
    "nfts_getTransfers": 20,
    "nfts_getFloorPrice": 15,
    "nfts_getCollectionMetadata": 15,
    # Webhook APIs
    "webhooks_create": 5,
    "webhooks_list": 5,
    "webhooks_delete": 5,
    "webhooks_test": 10,
    # Address APIs
    "address_getActivity": 20,
    "address_getTokens": 15,
    "address_getNFTs": 20,
    # =========================================================================
    # Solana-specific methods
    # =========================================================================
    "getAccountInfo": 5,
    "getBalance": 5,
    "getBlock": 10,
    "getBlockHeight": 1,
    "getBlockProduction": 10,
    "getBlockCommitment": 5,
    "getBlocks": 15,
    "getBlocksWithLimit": 15,
    "getBlockTime": 5,
    "getClusterNodes": 5,
    "getEpochInfo": 5,
    "getEpochSchedule": 5,
    "getFeeForMessage": 10,
    "getFirstAvailableBlock": 5,
    "getGenesisHash": 1,
    "getHealth": 1,
    "getHighestSnapshotSlot": 5,
    "getIdentity": 5,
    "getInflationGovernor": 5,
    "getInflationRate": 5,
    "getInflationReward": 10,
    "getLargestAccounts": 15,
    "getLatestBlockhash": 5,
    "getLeaderSchedule": 10,
    "getMaxRetransmitSlot": 5,
    "getMaxShredInsertSlot": 5,
    "getMinimumBalanceForRentExemption": 5,
    "getMultipleAccounts": 10,
    "getProgramAccounts": 25,
    "getRecentPerformanceSamples": 10,
    "getRecentPrioritizationFees": 10,
    "getSignaturesForAddress": 15,
    "getSignatureStatuses": 10,
    "getSlot": 1,
    "getSlotLeader": 5,
    "getSlotLeaders": 10,
    "getStakeActivation": 10,
    "getStakeMinimumDelegation": 5,
    "getSupply": 10,
    "getTokenAccountBalance": 5,
    "getTokenAccountsByDelegate": 15,
    "getTokenAccountsByOwner": 15,
    "getTokenLargestAccounts": 15,
    "getTokenSupply": 5,
    "getTransaction": 10,
    "getTransactionCount": 5,
    "getVersion": 1,
    "getVoteAccounts": 10,
    "isBlockhashValid": 5,
    "minimumLedgerSlot": 5,
    "requestAirdrop": 50,
    "sendTransaction": 50,
    "simulateTransaction": 25,
}


def get_compute_units(method: str) -> int:
    """Get compute unit cost for a method.

    Args:
        method: The RPC method name

    Returns:
        The compute unit cost for the method
    """
    return COMPUTE_UNITS.get(method, DEFAULT_COMPUTE_UNITS)


def get_batch_compute_units(methods: list[str]) -> int:
    """Calculate total compute units for a batch request.

    Args:
        methods: List of RPC method names

    Returns:
        Total compute units for all methods
    """
    return sum(get_compute_units(method) for method in methods)
