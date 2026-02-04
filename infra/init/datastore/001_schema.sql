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
    tier String DEFAULT 'free',
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

-- =============================================================================
-- BILLING TABLES
-- =============================================================================

-- Billing invoices (monthly statements)
CREATE TABLE IF NOT EXISTS billing_invoices (
    id UUID DEFAULT generateUUIDv4(),
    project_id UUID,
    period_start Date,
    period_end Date,
    tier String,
    total_cu UInt64,
    total_requests UInt64,
    base_cost_cents UInt32,
    overage_cost_cents UInt32,
    total_cost_cents UInt32,
    status Enum8('draft' = 0, 'pending' = 1, 'paid' = 2, 'overdue' = 3, 'void' = 4),
    hanzo_invoice_id Nullable(String),
    hanzo_payment_id Nullable(String),
    paid_at Nullable(DateTime64(3)),
    created_at DateTime64(3) DEFAULT now64(3),
    updated_at DateTime64(3) DEFAULT now64(3)
)
ENGINE = ReplacingMergeTree(updated_at)
ORDER BY (project_id, period_start)
SETTINGS index_granularity = 8192;

-- Daily compute unit usage (aggregated from api_usage)
CREATE TABLE IF NOT EXISTS billing_daily_usage (
    project_id UUID,
    date Date,
    tier String,
    total_cu UInt64,
    total_requests UInt64,
    cu_by_method Map(String, UInt64),
    cu_by_chain Map(UInt64, UInt64),
    peak_rps UInt32,
    error_count UInt32,
    created_at DateTime64(3) DEFAULT now64(3)
)
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (project_id, date)
SETTINGS index_granularity = 8192;

-- Materialized view: Daily CU aggregation
CREATE MATERIALIZED VIEW IF NOT EXISTS billing_daily_usage_mv
TO billing_daily_usage
AS SELECT
    project_id,
    toDate(timestamp) as date,
    '' as tier,  -- Filled by application
    sum(compute_units) as total_cu,
    count() as total_requests,
    cast(
        groupArray((method, toUInt64(compute_units))) as Map(String, UInt64)
    ) as cu_by_method,
    cast(
        groupArray((chain_id, toUInt64(compute_units))) as Map(UInt64, UInt64)
    ) as cu_by_chain,
    0 as peak_rps,  -- Calculated separately
    countIf(status_code >= 400) as error_count,
    now64(3) as created_at
FROM api_usage
GROUP BY project_id, date;

-- Monthly CU summary (for billing)
CREATE MATERIALIZED VIEW IF NOT EXISTS billing_monthly_summary
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(month)
ORDER BY (project_id, month)
AS SELECT
    project_id,
    toStartOfMonth(timestamp) as month,
    sum(compute_units) as total_cu,
    count() as total_requests,
    uniq(api_key_id) as unique_api_keys,
    countIf(status_code >= 400) as error_count,
    avg(response_time_ms) as avg_response_time_ms,
    quantile(0.95)(response_time_ms) as p95_response_time_ms
FROM api_usage
GROUP BY project_id, month;

-- Rate limit events (for analytics and alerting)
CREATE TABLE IF NOT EXISTS rate_limit_events (
    project_id UUID,
    timestamp DateTime64(3),
    tier String,
    limit_type String,  -- 'cu_quota', 'rate_limit', 'app_limit', 'webhook_limit'
    current_value UInt64,
    limit_value UInt64,
    blocked Bool,
    api_key_id Nullable(UUID),
    ip_address Nullable(String)
)
ENGINE = MergeTree()
PARTITION BY toYYYYMMDD(timestamp)
ORDER BY (project_id, timestamp)
TTL timestamp + INTERVAL 30 DAY
SETTINGS index_granularity = 8192;

-- Subscription changes audit log
CREATE TABLE IF NOT EXISTS subscription_changes (
    id UUID DEFAULT generateUUIDv4(),
    project_id UUID,
    old_tier String,
    new_tier String,
    change_type Enum8('upgrade' = 1, 'downgrade' = 2, 'renewal' = 3),
    hanzo_subscription_id Nullable(String),
    effective_at DateTime64(3),
    created_at DateTime64(3) DEFAULT now64(3)
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(created_at)
ORDER BY (project_id, created_at)
SETTINGS index_granularity = 8192;

-- =============================================================================
-- BILLING ANALYTICS TABLES
-- =============================================================================

-- Daily billing usage aggregation
CREATE TABLE IF NOT EXISTS billing_usage_daily (
    project_id UUID,
    date Date,
    tier String,
    chain String,
    method String,
    compute_units UInt64,
    request_count UInt64,
    error_count UInt64,
    avg_response_time_ms Float32,
    p99_response_time_ms Float32,
    created_at DateTime64(3) DEFAULT now64(3)
)
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (project_id, date, chain, method)
SETTINGS index_granularity = 8192;

-- Monthly rollup for invoicing
CREATE MATERIALIZED VIEW IF NOT EXISTS billing_usage_monthly
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(month)
ORDER BY (project_id, month, tier)
AS SELECT
    project_id,
    toStartOfMonth(date) as month,
    tier,
    sum(compute_units) as total_compute_units,
    sum(request_count) as total_requests,
    sum(error_count) as total_errors,
    avg(avg_response_time_ms) as avg_response_time_ms
FROM billing_usage_daily
GROUP BY project_id, month, tier;

-- Compute unit breakdown by method (for analytics dashboard)
CREATE TABLE IF NOT EXISTS cu_by_method (
    project_id UUID,
    date Date,
    method String,
    chain String,
    compute_units UInt64,
    call_count UInt64
)
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (project_id, date, method, chain);
