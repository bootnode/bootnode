-- Bootnode PostgreSQL Schema
-- Operational data: projects, API keys, webhooks, smart wallets

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- PROJECTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    owner_id UUID NOT NULL,
    description TEXT,
    settings JSONB DEFAULT '{}',
    tier VARCHAR(50) DEFAULT 'free',
    monthly_cu_limit BIGINT DEFAULT 100000000,  -- 100M compute units
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_projects_owner ON projects(owner_id);

-- =============================================================================
-- API KEYS
-- =============================================================================

CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) NOT NULL UNIQUE,
    key_prefix VARCHAR(10) NOT NULL,  -- "bn_" + first 4 chars
    permissions JSONB DEFAULT '["read", "write"]',
    allowed_origins TEXT[],
    allowed_ips INET[],
    rate_limit_per_second INT DEFAULT 100,
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_api_keys_project ON api_keys(project_id);
CREATE INDEX idx_api_keys_prefix ON api_keys(key_prefix);

-- =============================================================================
-- WEBHOOKS
-- =============================================================================

CREATE TABLE IF NOT EXISTS webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    secret VARCHAR(255) NOT NULL,  -- HMAC signing secret
    chain_id BIGINT NOT NULL,
    network VARCHAR(50) NOT NULL,
    event_type VARCHAR(50) NOT NULL,  -- ADDRESS_ACTIVITY, NFT_ACTIVITY, TOKEN_TRANSFER, MINED_TRANSACTION
    filters JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    failure_count INT DEFAULT 0,
    last_triggered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webhooks_project ON webhooks(project_id);
CREATE INDEX idx_webhooks_chain ON webhooks(chain_id, network);
CREATE INDEX idx_webhooks_event ON webhooks(event_type);
CREATE INDEX idx_webhooks_active ON webhooks(is_active) WHERE is_active = TRUE;

-- =============================================================================
-- SMART WALLETS (ERC-4337)
-- =============================================================================

CREATE TABLE IF NOT EXISTS smart_wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    chain_id BIGINT NOT NULL,
    network VARCHAR(50) NOT NULL,
    address VARCHAR(42) NOT NULL,
    owner_address VARCHAR(42) NOT NULL,
    factory_address VARCHAR(42) NOT NULL,
    implementation VARCHAR(50) DEFAULT 'simple_account',  -- simple_account, kernel, safe
    salt VARCHAR(66),
    is_deployed BOOLEAN DEFAULT FALSE,
    deploy_tx_hash VARCHAR(66),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(chain_id, network, address)
);

CREATE INDEX idx_smart_wallets_project ON smart_wallets(project_id);
CREATE INDEX idx_smart_wallets_owner ON smart_wallets(owner_address);
CREATE INDEX idx_smart_wallets_chain ON smart_wallets(chain_id, network);

-- =============================================================================
-- GAS POLICIES (Paymaster)
-- =============================================================================

CREATE TABLE IF NOT EXISTS gas_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    chain_id BIGINT NOT NULL,
    network VARCHAR(50) NOT NULL,
    policy_type VARCHAR(50) DEFAULT 'sponsorship',  -- sponsorship, token_paymaster, verifying
    rules JSONB NOT NULL DEFAULT '{}',
    max_gas_per_tx BIGINT DEFAULT 1000000,
    daily_limit_usd DECIMAL(20, 6) DEFAULT 100.00,
    monthly_limit_usd DECIMAL(20, 6) DEFAULT 1000.00,
    current_daily_spend_usd DECIMAL(20, 6) DEFAULT 0,
    current_monthly_spend_usd DECIMAL(20, 6) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gas_policies_project ON gas_policies(project_id);
CREATE INDEX idx_gas_policies_chain ON gas_policies(chain_id, network);

-- =============================================================================
-- USER OPERATIONS (ERC-4337)
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_operations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id),
    chain_id BIGINT NOT NULL,
    network VARCHAR(50) NOT NULL,
    user_op_hash VARCHAR(66) NOT NULL UNIQUE,
    sender VARCHAR(42) NOT NULL,
    nonce BIGINT NOT NULL,
    init_code TEXT,
    call_data TEXT NOT NULL,
    call_gas_limit BIGINT NOT NULL,
    verification_gas_limit BIGINT NOT NULL,
    pre_verification_gas BIGINT NOT NULL,
    max_fee_per_gas BIGINT NOT NULL,
    max_priority_fee_per_gas BIGINT NOT NULL,
    paymaster_and_data TEXT,
    signature TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',  -- pending, submitted, included, failed
    tx_hash VARCHAR(66),
    block_number BIGINT,
    actual_gas_cost BIGINT,
    actual_gas_used BIGINT,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_ops_project ON user_operations(project_id);
CREATE INDEX idx_user_ops_sender ON user_operations(sender);
CREATE INDEX idx_user_ops_status ON user_operations(status);
CREATE INDEX idx_user_ops_chain ON user_operations(chain_id, network);

-- =============================================================================
-- TOKEN METADATA CACHE
-- =============================================================================

CREATE TABLE IF NOT EXISTS token_metadata (
    chain_id BIGINT NOT NULL,
    network VARCHAR(50) NOT NULL,
    address VARCHAR(42) NOT NULL,
    name VARCHAR(255),
    symbol VARCHAR(50),
    decimals SMALLINT,
    total_supply NUMERIC(78, 0),
    logo_uri TEXT,
    website TEXT,
    description TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (chain_id, network, address)
);

-- =============================================================================
-- NFT COLLECTION METADATA
-- =============================================================================

CREATE TABLE IF NOT EXISTS nft_collections (
    chain_id BIGINT NOT NULL,
    network VARCHAR(50) NOT NULL,
    address VARCHAR(42) NOT NULL,
    name VARCHAR(255),
    symbol VARCHAR(50),
    token_standard VARCHAR(20),  -- ERC721, ERC1155
    total_supply BIGINT,
    description TEXT,
    image_uri TEXT,
    external_url TEXT,
    floor_price NUMERIC(78, 0),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (chain_id, network, address)
);

-- =============================================================================
-- CHAIN CONFIGURATION
-- =============================================================================

CREATE TABLE IF NOT EXISTS chains (
    chain_id BIGINT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL,  -- ethereum-l1, layer-2, alt-l1, bitcoin, other
    chain_type VARCHAR(50) NOT NULL,  -- evm, svm, move, bitcoin, starknet, other
    native_currency_name VARCHAR(50),
    native_currency_symbol VARCHAR(20),
    native_currency_decimals SMALLINT DEFAULT 18,
    block_explorer_url TEXT,
    is_testnet BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    rpc_endpoints JSONB DEFAULT '[]',
    features JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chain_networks (
    id SERIAL PRIMARY KEY,
    chain_id BIGINT REFERENCES chains(chain_id),
    network_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    is_testnet BOOLEAN DEFAULT FALSE,
    rpc_url TEXT,
    ws_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(chain_id, network_id)
);

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_webhooks_updated_at BEFORE UPDATE ON webhooks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_smart_wallets_updated_at BEFORE UPDATE ON smart_wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gas_policies_updated_at BEFORE UPDATE ON gas_policies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_operations_updated_at BEFORE UPDATE ON user_operations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
