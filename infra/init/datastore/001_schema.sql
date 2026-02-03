-- Bootnode DataStore Schema (ClickHouse)
-- High-performance analytics for blockchain data

-- =============================================================================
-- BLOCKS TABLE (Partitioned by chain_id and month)
-- =============================================================================

CREATE TABLE IF NOT EXISTS blocks (
    chain_id UInt64,
    network String,
    block_number UInt64,
    block_hash String,
    parent_hash String,
    timestamp DateTime64(3),
    miner String,
    gas_used UInt64,
    gas_limit UInt64,
    base_fee_per_gas Nullable(UInt64),
    transaction_count UInt32,
    size UInt32,
    extra_data String,
    created_at DateTime64(3) DEFAULT now64(3)
)
ENGINE = ReplacingMergeTree(created_at)
PARTITION BY (chain_id, toYYYYMM(timestamp))
ORDER BY (chain_id, block_number)
SETTINGS index_granularity = 8192;

-- =============================================================================
-- TRANSACTIONS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS transactions (
    chain_id UInt64,
    network String,
    tx_hash String,
    block_number UInt64,
    block_hash String,
    tx_index UInt32,
    from_address String,
    to_address Nullable(String),
    value UInt256,
    gas UInt64,
    gas_price UInt64,
    max_fee_per_gas Nullable(UInt64),
    max_priority_fee_per_gas Nullable(UInt64),
    input String,
    nonce UInt64,
    tx_type UInt8,
    status UInt8,  -- 0: failed, 1: success
    gas_used UInt64,
    effective_gas_price UInt64,
    timestamp DateTime64(3),
    created_at DateTime64(3) DEFAULT now64(3)
)
ENGINE = ReplacingMergeTree(created_at)
PARTITION BY (chain_id, toYYYYMM(timestamp))
ORDER BY (chain_id, block_number, tx_index)
SETTINGS index_granularity = 8192;

-- =============================================================================
-- LOGS (Events) TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS logs (
    chain_id UInt64,
    network String,
    block_number UInt64,
    block_hash String,
    tx_hash String,
    tx_index UInt32,
    log_index UInt32,
    address String,
    topic0 String,
    topic1 Nullable(String),
    topic2 Nullable(String),
    topic3 Nullable(String),
    data String,
    removed UInt8,
    timestamp DateTime64(3),
    created_at DateTime64(3) DEFAULT now64(3)
)
ENGINE = ReplacingMergeTree(created_at)
PARTITION BY (chain_id, toYYYYMM(timestamp))
ORDER BY (chain_id, block_number, tx_index, log_index)
SETTINGS index_granularity = 8192;

-- =============================================================================
-- TOKEN TRANSFERS (ERC-20)
-- =============================================================================

CREATE TABLE IF NOT EXISTS token_transfers (
    chain_id UInt64,
    network String,
    block_number UInt64,
    tx_hash String,
    log_index UInt32,
    token_address String,
    from_address String,
    to_address String,
    value UInt256,
    token_decimals UInt8,
    token_symbol String,
    timestamp DateTime64(3),
    created_at DateTime64(3) DEFAULT now64(3)
)
ENGINE = ReplacingMergeTree(created_at)
PARTITION BY (chain_id, toYYYYMM(timestamp))
ORDER BY (chain_id, block_number, tx_hash, log_index)
SETTINGS index_granularity = 8192;

-- =============================================================================
-- NFT TRANSFERS (ERC-721 & ERC-1155)
-- =============================================================================

CREATE TABLE IF NOT EXISTS nft_transfers (
    chain_id UInt64,
    network String,
    block_number UInt64,
    tx_hash String,
    log_index UInt32,
    contract_address String,
    token_standard Enum8('ERC721' = 1, 'ERC1155' = 2),
    from_address String,
    to_address String,
    token_id UInt256,
    amount UInt256,  -- Always 1 for ERC-721
    operator Nullable(String),  -- For ERC-1155
    timestamp DateTime64(3),
    created_at DateTime64(3) DEFAULT now64(3)
)
ENGINE = ReplacingMergeTree(created_at)
PARTITION BY (chain_id, toYYYYMM(timestamp))
ORDER BY (chain_id, block_number, tx_hash, log_index)
SETTINGS index_granularity = 8192;

-- =============================================================================
-- TOKEN BALANCES (Materialized View)
-- =============================================================================

CREATE TABLE IF NOT EXISTS token_balances (
    chain_id UInt64,
    network String,
    address String,
    token_address String,
    balance UInt256,
    last_block UInt64,
    updated_at DateTime64(3) DEFAULT now64(3)
)
ENGINE = ReplacingMergeTree(updated_at)
ORDER BY (chain_id, address, token_address)
SETTINGS index_granularity = 8192;

-- =============================================================================
-- NFT OWNERSHIP
-- =============================================================================

CREATE TABLE IF NOT EXISTS nft_ownership (
    chain_id UInt64,
    network String,
    contract_address String,
    token_id UInt256,
    owner_address String,
    amount UInt256,  -- Always 1 for ERC-721
    last_block UInt64,
    updated_at DateTime64(3) DEFAULT now64(3)
)
ENGINE = ReplacingMergeTree(updated_at)
ORDER BY (chain_id, contract_address, token_id)
SETTINGS index_granularity = 8192;

-- =============================================================================
-- INTERNAL TRANSACTIONS (Traces)
-- =============================================================================

CREATE TABLE IF NOT EXISTS internal_transactions (
    chain_id UInt64,
    network String,
    block_number UInt64,
    tx_hash String,
    trace_address Array(UInt32),
    trace_type Enum8('call' = 1, 'create' = 2, 'suicide' = 3, 'reward' = 4),
    from_address String,
    to_address Nullable(String),
    value UInt256,
    gas UInt64,
    gas_used UInt64,
    input String,
    output Nullable(String),
    error Nullable(String),
    timestamp DateTime64(3),
    created_at DateTime64(3) DEFAULT now64(3)
)
ENGINE = ReplacingMergeTree(created_at)
PARTITION BY (chain_id, toYYYYMM(timestamp))
ORDER BY (chain_id, block_number, tx_hash, trace_address)
SETTINGS index_granularity = 8192;

-- =============================================================================
-- ADDRESS ACTIVITY (Aggregated)
-- =============================================================================

CREATE TABLE IF NOT EXISTS address_activity (
    chain_id UInt64,
    network String,
    address String,
    date Date,
    tx_count UInt32,
    tx_sent UInt32,
    tx_received UInt32,
    eth_sent UInt256,
    eth_received UInt256,
    token_transfers_out UInt32,
    token_transfers_in UInt32,
    nft_transfers_out UInt32,
    nft_transfers_in UInt32,
    gas_spent UInt256,
    first_tx_block UInt64,
    last_tx_block UInt64,
    created_at DateTime64(3) DEFAULT now64(3)
)
ENGINE = SummingMergeTree()
PARTITION BY (chain_id, toYYYYMM(date))
ORDER BY (chain_id, address, date)
SETTINGS index_granularity = 8192;

-- =============================================================================
-- PROTOCOL EVENTS (DeFi, NFT Marketplaces, etc.)
-- =============================================================================

CREATE TABLE IF NOT EXISTS protocol_events (
    chain_id UInt64,
    network String,
    block_number UInt64,
    tx_hash String,
    log_index UInt32,
    protocol String,         -- e.g., 'uniswap_v3', 'aave_v3', 'seaport'
    event_type String,       -- e.g., 'swap', 'deposit', 'sale'
    contract_address String,
    user_address String,
    data String,             -- JSON encoded event data
    timestamp DateTime64(3),
    created_at DateTime64(3) DEFAULT now64(3)
)
ENGINE = ReplacingMergeTree(created_at)
PARTITION BY (chain_id, toYYYYMM(timestamp))
ORDER BY (chain_id, protocol, block_number, tx_hash, log_index)
SETTINGS index_granularity = 8192;

-- =============================================================================
-- WEBHOOK DELIVERIES LOG
-- =============================================================================

CREATE TABLE IF NOT EXISTS webhook_deliveries (
    id UUID DEFAULT generateUUIDv4(),
    webhook_id UUID,
    project_id UUID,
    chain_id UInt64,
    network String,
    event_type String,
    payload String,
    status Enum8('pending' = 0, 'success' = 1, 'failed' = 2),
    status_code UInt16,
    response_time_ms UInt32,
    attempt UInt8,
    error Nullable(String),
    created_at DateTime64(3) DEFAULT now64(3),
    delivered_at Nullable(DateTime64(3))
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(created_at)
ORDER BY (webhook_id, created_at)
TTL created_at + INTERVAL 30 DAY
SETTINGS index_granularity = 8192;

-- =============================================================================
-- API USAGE METRICS
-- =============================================================================

CREATE TABLE IF NOT EXISTS api_usage (
    project_id UUID,
    api_key_id UUID,
    chain_id UInt64,
    network String,
    endpoint String,
    method String,
    compute_units UInt32,
    response_time_ms UInt32,
    status_code UInt16,
    ip_address String,
    user_agent String,
    timestamp DateTime64(3) DEFAULT now64(3)
)
ENGINE = MergeTree()
PARTITION BY toYYYYMMDD(timestamp)
ORDER BY (project_id, timestamp)
TTL timestamp + INTERVAL 90 DAY
SETTINGS index_granularity = 8192;

-- =============================================================================
-- MATERIALIZED VIEWS FOR REAL-TIME AGGREGATIONS
-- =============================================================================

-- Hourly API usage per project
CREATE MATERIALIZED VIEW IF NOT EXISTS api_usage_hourly
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(hour)
ORDER BY (project_id, chain_id, hour)
AS SELECT
    project_id,
    chain_id,
    toStartOfHour(timestamp) as hour,
    count() as request_count,
    sum(compute_units) as total_compute_units,
    avg(response_time_ms) as avg_response_time_ms,
    countIf(status_code >= 400) as error_count
FROM api_usage
GROUP BY project_id, chain_id, hour;

-- Daily transaction counts per chain
CREATE MATERIALIZED VIEW IF NOT EXISTS chain_daily_stats
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (chain_id, date)
AS SELECT
    chain_id,
    toDate(timestamp) as date,
    count() as tx_count,
    uniq(from_address) as unique_senders,
    uniq(to_address) as unique_receivers,
    sum(value) as total_value,
    sum(gas_used) as total_gas_used
FROM transactions
GROUP BY chain_id, date;

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Bloom filter for address lookups
ALTER TABLE transactions ADD INDEX idx_from_address from_address TYPE bloom_filter GRANULARITY 4;
ALTER TABLE transactions ADD INDEX idx_to_address to_address TYPE bloom_filter GRANULARITY 4;
ALTER TABLE logs ADD INDEX idx_address address TYPE bloom_filter GRANULARITY 4;
ALTER TABLE logs ADD INDEX idx_topic0 topic0 TYPE bloom_filter GRANULARITY 4;
ALTER TABLE token_transfers ADD INDEX idx_from from_address TYPE bloom_filter GRANULARITY 4;
ALTER TABLE token_transfers ADD INDEX idx_to to_address TYPE bloom_filter GRANULARITY 4;
ALTER TABLE token_transfers ADD INDEX idx_token token_address TYPE bloom_filter GRANULARITY 4;
