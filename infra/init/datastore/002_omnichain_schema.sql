-- ============================================================================
-- Omnichain Analytics Schema for ClickHouse
-- Supports 100+ chains with high-performance time-series analytics
-- ============================================================================

-- Chain metrics (real-time stats)
CREATE TABLE IF NOT EXISTS chain_metrics (
    chain String,
    network String,
    metric_name String,
    metric_value Float64,
    timestamp DateTime64(3) DEFAULT now64(3)
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (chain, network, metric_name, timestamp)
TTL timestamp + INTERVAL 90 DAY;

-- Blocks (for analytics queries)
CREATE TABLE IF NOT EXISTS blocks (
    chain String,
    network String,
    block_number UInt64,
    block_hash String,
    parent_hash String,
    timestamp DateTime64(3),
    transaction_count UInt32,
    gas_used UInt64,
    gas_limit UInt64,
    base_fee_per_gas Nullable(UInt64),
    miner String,
    block_time Float32,  -- seconds since last block
    INDEX idx_hash block_hash TYPE bloom_filter GRANULARITY 4
) ENGINE = MergeTree()
PARTITION BY (chain, toYYYYMM(timestamp))
ORDER BY (chain, network, block_number)
TTL timestamp + INTERVAL 2 YEAR;

-- Transactions (for analytics)
CREATE TABLE IF NOT EXISTS transactions (
    chain String,
    network String,
    tx_hash String,
    block_number UInt64,
    tx_index UInt32,
    timestamp DateTime64(3),
    from_address String,
    to_address Nullable(String),
    value UInt256,
    gas UInt64,
    gas_price UInt256,
    gas_used UInt64,
    status UInt8,
    tx_type UInt8,
    method_id String,
    INDEX idx_from from_address TYPE bloom_filter GRANULARITY 4,
    INDEX idx_to to_address TYPE bloom_filter GRANULARITY 4,
    INDEX idx_hash tx_hash TYPE bloom_filter GRANULARITY 4
) ENGINE = MergeTree()
PARTITION BY (chain, toYYYYMM(timestamp))
ORDER BY (chain, network, block_number, tx_index)
TTL timestamp + INTERVAL 2 YEAR;

-- Token transfers (ERC20/721/1155)
CREATE TABLE IF NOT EXISTS token_transfers (
    chain String,
    network String,
    tx_hash String,
    log_index UInt32,
    block_number UInt64,
    timestamp DateTime64(3),
    token_address String,
    token_name String,
    token_symbol String,
    token_type String,  -- ERC20, ERC721, ERC1155
    from_address String,
    to_address String,
    value UInt256,
    token_id Nullable(UInt256),
    INDEX idx_token token_address TYPE bloom_filter GRANULARITY 4,
    INDEX idx_from from_address TYPE bloom_filter GRANULARITY 4,
    INDEX idx_to to_address TYPE bloom_filter GRANULARITY 4
) ENGINE = MergeTree()
PARTITION BY (chain, toYYYYMM(timestamp))
ORDER BY (chain, network, block_number, log_index)
TTL timestamp + INTERVAL 2 YEAR;

-- DeFi TVL snapshots
CREATE TABLE IF NOT EXISTS defi_tvl (
    chain String,
    network String,
    protocol String,
    pool_address String,
    tvl_usd Float64,
    tvl_native Float64,
    timestamp DateTime64(3) DEFAULT now64(3)
) ENGINE = MergeTree()
PARTITION BY (chain, toYYYYMM(timestamp))
ORDER BY (chain, network, protocol, timestamp)
TTL timestamp + INTERVAL 1 YEAR;

-- DEX swaps
CREATE TABLE IF NOT EXISTS dex_swaps (
    chain String,
    network String,
    tx_hash String,
    log_index UInt32,
    block_number UInt64,
    timestamp DateTime64(3),
    protocol String,
    pool_address String,
    trader String,
    token_in String,
    token_out String,
    amount_in UInt256,
    amount_out UInt256,
    amount_usd Float64,
    INDEX idx_trader trader TYPE bloom_filter GRANULARITY 4,
    INDEX idx_pool pool_address TYPE bloom_filter GRANULARITY 4
) ENGINE = MergeTree()
PARTITION BY (chain, toYYYYMM(timestamp))
ORDER BY (chain, network, block_number, log_index)
TTL timestamp + INTERVAL 2 YEAR;

-- Bridge transfers
CREATE TABLE IF NOT EXISTS bridge_transfers (
    source_chain String,
    source_network String,
    dest_chain String,
    dest_network String,
    tx_hash String,
    block_number UInt64,
    timestamp DateTime64(3),
    bridge_protocol String,
    sender String,
    receiver String,
    token String,
    amount UInt256,
    amount_usd Float64,
    INDEX idx_sender sender TYPE bloom_filter GRANULARITY 4,
    INDEX idx_receiver receiver TYPE bloom_filter GRANULARITY 4
) ENGINE = MergeTree()
PARTITION BY (source_chain, toYYYYMM(timestamp))
ORDER BY (source_chain, source_network, block_number)
TTL timestamp + INTERVAL 2 YEAR;

-- NFT sales
CREATE TABLE IF NOT EXISTS nft_sales (
    chain String,
    network String,
    tx_hash String,
    log_index UInt32,
    block_number UInt64,
    timestamp DateTime64(3),
    marketplace String,
    collection_address String,
    token_id UInt256,
    seller String,
    buyer String,
    price_wei UInt256,
    price_usd Float64,
    currency_token String,
    INDEX idx_collection collection_address TYPE bloom_filter GRANULARITY 4,
    INDEX idx_seller seller TYPE bloom_filter GRANULARITY 4,
    INDEX idx_buyer buyer TYPE bloom_filter GRANULARITY 4
) ENGINE = MergeTree()
PARTITION BY (chain, toYYYYMM(timestamp))
ORDER BY (chain, network, block_number, log_index)
TTL timestamp + INTERVAL 2 YEAR;

-- Gas price history (for gas oracle)
CREATE TABLE IF NOT EXISTS gas_prices (
    chain String,
    network String,
    block_number UInt64,
    timestamp DateTime64(3),
    base_fee UInt64,
    priority_fee_slow UInt64,
    priority_fee_avg UInt64,
    priority_fee_fast UInt64,
    gas_used_percent Float32
) ENGINE = MergeTree()
PARTITION BY (chain, toYYYYMM(timestamp))
ORDER BY (chain, network, timestamp)
TTL timestamp + INTERVAL 30 DAY;

-- Address activity (daily aggregates)
CREATE TABLE IF NOT EXISTS address_activity_daily (
    chain String,
    network String,
    address String,
    date Date,
    tx_count_sent UInt32,
    tx_count_received UInt32,
    volume_sent UInt256,
    volume_received UInt256,
    gas_spent UInt256,
    unique_counterparties UInt32
) ENGINE = SummingMergeTree()
PARTITION BY (chain, toYYYYMM(date))
ORDER BY (chain, network, address, date)
TTL date + INTERVAL 2 YEAR;

-- Token holders (snapshots)
CREATE TABLE IF NOT EXISTS token_holders (
    chain String,
    network String,
    token_address String,
    holder_address String,
    balance UInt256,
    balance_usd Float64,
    timestamp DateTime64(3) DEFAULT now64(3)
) ENGINE = ReplacingMergeTree(timestamp)
PARTITION BY (chain, token_address)
ORDER BY (chain, network, token_address, holder_address);

-- Materialized views for common queries

-- Hourly transaction stats per chain
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_tx_stats_hourly
ENGINE = SummingMergeTree()
PARTITION BY (chain, toYYYYMM(hour))
ORDER BY (chain, network, hour)
AS SELECT
    chain,
    network,
    toStartOfHour(timestamp) as hour,
    count() as tx_count,
    countDistinct(from_address) as unique_senders,
    countDistinct(to_address) as unique_receivers,
    sum(gas_used * gas_price) as total_fees
FROM transactions
GROUP BY chain, network, hour;

-- Daily volume per token
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_token_volume_daily
ENGINE = SummingMergeTree()
PARTITION BY (chain, toYYYYMM(day))
ORDER BY (chain, network, token_address, day)
AS SELECT
    chain,
    network,
    token_address,
    toDate(timestamp) as day,
    count() as transfer_count,
    countDistinct(from_address) as unique_senders,
    countDistinct(to_address) as unique_receivers,
    sum(value) as total_volume
FROM token_transfers
GROUP BY chain, network, token_address, day;

-- Daily DEX volume
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_dex_volume_daily
ENGINE = SummingMergeTree()
PARTITION BY (chain, toYYYYMM(day))
ORDER BY (chain, network, protocol, day)
AS SELECT
    chain,
    network,
    protocol,
    toDate(timestamp) as day,
    count() as swap_count,
    countDistinct(trader) as unique_traders,
    sum(amount_usd) as total_volume_usd
FROM dex_swaps
GROUP BY chain, network, protocol, day;

-- Daily NFT sales
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_nft_sales_daily
ENGINE = SummingMergeTree()
PARTITION BY (chain, toYYYYMM(day))
ORDER BY (chain, network, marketplace, day)
AS SELECT
    chain,
    network,
    marketplace,
    toDate(timestamp) as day,
    count() as sale_count,
    countDistinct(collection_address) as collections_traded,
    countDistinct(buyer) as unique_buyers,
    sum(price_usd) as total_volume_usd
FROM nft_sales
GROUP BY chain, network, marketplace, day;
