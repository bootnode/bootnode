export type ChainCategory =
  | "ethereum-l1"
  | "layer-2"
  | "alt-l1"
  | "bitcoin"
  | "other"

export type ChainType = "evm" | "svm" | "move" | "bitcoin" | "starknet" | "other"

export interface ChainNetwork {
  id: string
  name: string
  chainId?: number
  isTestnet: boolean
  rpcUrl?: string
}

export interface Chain {
  id: string
  name: string
  slug: string
  category: ChainCategory
  type: ChainType
  logo?: string
  color?: string
  description: string
  networks: ChainNetwork[]
  features: string[]
  docs?: {
    quickstart?: string
    faq?: string
    overview?: string
    endpoints?: string
  }
  deprecated?: boolean
  deprecationNotice?: string
}

export const CHAINS: Chain[] = [
  // Ethereum & EVM Layer 1s
  {
    id: "ethereum",
    name: "Ethereum",
    slug: "ethereum",
    category: "ethereum-l1",
    type: "evm",
    color: "#627EEA",
    description: "The leading smart contract platform and home to DeFi, NFTs, and Web3",
    networks: [
      { id: "mainnet", name: "Mainnet", chainId: 1, isTestnet: false },
      { id: "sepolia", name: "Sepolia", chainId: 11155111, isTestnet: true },
      { id: "holesky", name: "Holesky", chainId: 17000, isTestnet: true },
    ],
    features: ["MEV Protection", "Beacon API", "Archive Nodes", "Debug APIs"],
    docs: {
      quickstart: "/docs/ethereum/quickstart",
      faq: "/docs/ethereum/faq",
      overview: "/docs/ethereum/overview",
      endpoints: "/docs/ethereum/endpoints",
    },
  },
  {
    id: "bnb",
    name: "BNB Smart Chain",
    slug: "bnb-smart-chain",
    category: "ethereum-l1",
    type: "evm",
    color: "#F3BA2F",
    description: "High-performance blockchain compatible with Ethereum tooling",
    networks: [
      { id: "mainnet", name: "Mainnet", chainId: 56, isTestnet: false },
      { id: "testnet", name: "Testnet", chainId: 97, isTestnet: true },
    ],
    features: ["Fast Finality", "Low Fees", "EVM Compatible"],
    docs: {
      quickstart: "/docs/bnb/quickstart",
      faq: "/docs/bnb/faq",
      overview: "/docs/bnb/overview",
      endpoints: "/docs/bnb/endpoints",
    },
  },
  {
    id: "avalanche",
    name: "Avalanche C-Chain",
    slug: "avalanche",
    category: "ethereum-l1",
    type: "evm",
    color: "#E84142",
    description: "Fast, low-cost blockchain with sub-second finality",
    networks: [
      { id: "mainnet", name: "Mainnet", chainId: 43114, isTestnet: false },
      { id: "fuji", name: "Fuji", chainId: 43113, isTestnet: true },
    ],
    features: ["Sub-second Finality", "Subnets", "EVM Compatible"],
    docs: {
      quickstart: "/docs/avalanche/quickstart",
      faq: "/docs/avalanche/faq",
      endpoints: "/docs/avalanche/endpoints",
    },
  },
  {
    id: "gnosis",
    name: "Gnosis",
    slug: "gnosis",
    category: "ethereum-l1",
    type: "evm",
    color: "#04795B",
    description: "Community-owned Ethereum sidechain focused on payments and prediction markets",
    networks: [
      { id: "mainnet", name: "Mainnet", chainId: 100, isTestnet: false },
      { id: "chiado", name: "Chiado", chainId: 10200, isTestnet: true },
    ],
    features: ["xDai Stablecoin", "Community Governance", "EVM Compatible"],
    docs: {
      quickstart: "/docs/gnosis/quickstart",
      faq: "/docs/gnosis/faq",
      overview: "/docs/gnosis/overview",
      endpoints: "/docs/gnosis/endpoints",
    },
  },
  {
    id: "fantom",
    name: "Fantom",
    slug: "fantom",
    category: "ethereum-l1",
    type: "evm",
    color: "#1969FF",
    description: "High-speed, scalable smart contract platform",
    networks: [
      { id: "mainnet", name: "Mainnet", chainId: 250, isTestnet: false },
    ],
    features: ["Lachesis Consensus", "Fast Finality"],
    deprecated: true,
    deprecationNotice: "Fantom support is being deprecated. Please migrate to Sonic.",
  },
  {
    id: "rootstock",
    name: "Rootstock",
    slug: "rootstock",
    category: "ethereum-l1",
    type: "evm",
    color: "#00B520",
    description: "Bitcoin-secured smart contract platform",
    networks: [
      { id: "mainnet", name: "Mainnet", chainId: 30, isTestnet: false },
      { id: "testnet", name: "Testnet", chainId: 31, isTestnet: true },
    ],
    features: ["Bitcoin Security", "Merge Mining", "EVM Compatible"],
    docs: {
      quickstart: "/docs/rootstock/quickstart",
      faq: "/docs/rootstock/faq",
      overview: "/docs/rootstock/overview",
      endpoints: "/docs/rootstock/endpoints",
    },
  },
  {
    id: "celo",
    name: "Celo",
    slug: "celo",
    category: "ethereum-l1",
    type: "evm",
    color: "#FCFF52",
    description: "Mobile-first blockchain for financial inclusion",
    networks: [
      { id: "mainnet", name: "Mainnet", chainId: 42220, isTestnet: false },
      { id: "alfajores", name: "Alfajores", chainId: 44787, isTestnet: true },
    ],
    features: ["Phone Number Identity", "Stablecoins", "Carbon Negative"],
    docs: {
      quickstart: "/docs/celo/quickstart",
      faq: "/docs/celo/faq",
      overview: "/docs/celo/overview",
      endpoints: "/docs/celo/endpoints",
    },
  },

  // Layer 2 - Optimistic Rollups
  {
    id: "arbitrum",
    name: "Arbitrum One",
    slug: "arbitrum",
    category: "layer-2",
    type: "evm",
    color: "#28A0F0",
    description: "Leading Ethereum L2 with EVM compatibility and lower fees",
    networks: [
      { id: "mainnet", name: "Mainnet", chainId: 42161, isTestnet: false },
      { id: "sepolia", name: "Sepolia", chainId: 421614, isTestnet: true },
    ],
    features: ["Nitro Technology", "Stylus", "Full EVM Compatibility"],
    docs: {
      quickstart: "/docs/arbitrum/quickstart",
      faq: "/docs/arbitrum/faq",
      overview: "/docs/arbitrum/overview",
      endpoints: "/docs/arbitrum/endpoints",
    },
  },
  {
    id: "arbitrum-nova",
    name: "Arbitrum Nova",
    slug: "arbitrum-nova",
    category: "layer-2",
    type: "evm",
    color: "#E87B2A",
    description: "Ultra-low-cost Arbitrum chain for gaming and social",
    networks: [
      { id: "mainnet", name: "Mainnet", chainId: 42170, isTestnet: false },
    ],
    features: ["AnyTrust Technology", "Ultra Low Fees", "Gaming Optimized"],
    docs: {
      quickstart: "/docs/arbitrum-nova/quickstart",
      faq: "/docs/arbitrum-nova/faq",
      overview: "/docs/arbitrum-nova/overview",
      endpoints: "/docs/arbitrum-nova/endpoints",
    },
  },
  {
    id: "optimism",
    name: "OP Mainnet",
    slug: "optimism",
    category: "layer-2",
    type: "evm",
    color: "#FF0420",
    description: "Optimistic rollup from Optimism Collective",
    networks: [
      { id: "mainnet", name: "Mainnet", chainId: 10, isTestnet: false },
      { id: "sepolia", name: "Sepolia", chainId: 11155420, isTestnet: true },
    ],
    features: ["OP Stack", "Superchain", "Flashblocks API"],
    docs: {
      quickstart: "/docs/optimism/quickstart",
      faq: "/docs/optimism/faq",
      overview: "/docs/optimism/overview",
      endpoints: "/docs/optimism/endpoints",
    },
  },
  {
    id: "base",
    name: "Base",
    slug: "base",
    category: "layer-2",
    type: "evm",
    color: "#0052FF",
    description: "Coinbase's Ethereum L2 built on the OP Stack",
    networks: [
      { id: "mainnet", name: "Mainnet", chainId: 8453, isTestnet: false },
      { id: "sepolia", name: "Sepolia", chainId: 84532, isTestnet: true },
    ],
    features: ["OP Stack", "Coinbase Integration", "Flashblocks API"],
    docs: {
      quickstart: "/docs/base/quickstart",
      faq: "/docs/base/faq",
      overview: "/docs/base/overview",
      endpoints: "/docs/base/endpoints",
    },
  },
  {
    id: "blast",
    name: "Blast",
    slug: "blast",
    category: "layer-2",
    type: "evm",
    color: "#FCFC03",
    description: "L2 with native yield for ETH and stablecoins",
    networks: [
      { id: "mainnet", name: "Mainnet", chainId: 81457, isTestnet: false },
      { id: "sepolia", name: "Sepolia", chainId: 168587773, isTestnet: true },
    ],
    features: ["Native Yield", "Gas Rebates", "Auto-compounding"],
    docs: {
      quickstart: "/docs/blast/quickstart",
      faq: "/docs/blast/faq",
      overview: "/docs/blast/overview",
      endpoints: "/docs/blast/endpoints",
    },
  },
  {
    id: "mantle",
    name: "Mantle",
    slug: "mantle",
    category: "layer-2",
    type: "evm",
    color: "#000000",
    description: "Modular L2 with low fees",
    networks: [
      { id: "mainnet", name: "Mainnet", chainId: 5000, isTestnet: false },
      { id: "sepolia", name: "Sepolia", chainId: 5003, isTestnet: true },
    ],
    features: ["Modular Architecture", "Data Availability", "Low Fees"],
    docs: {
      quickstart: "/docs/mantle/quickstart",
      faq: "/docs/mantle/faq",
      overview: "/docs/mantle/overview",
      endpoints: "/docs/mantle/endpoints",
    },
  },
  {
    id: "metis",
    name: "Metis",
    slug: "metis",
    category: "layer-2",
    type: "evm",
    color: "#00D2FF",
    description: "Decentralized optimistic rollup",
    networks: [
      { id: "mainnet", name: "Andromeda", chainId: 1088, isTestnet: false },
      { id: "sepolia", name: "Sepolia", chainId: 59902, isTestnet: true },
    ],
    features: ["Decentralized Sequencer", "Hybrid Rollup", "Native Storage"],
    docs: {
      quickstart: "/docs/metis/quickstart",
      faq: "/docs/metis/faq",
      overview: "/docs/metis/overview",
      endpoints: "/docs/metis/endpoints",
    },
  },
  {
    id: "mode",
    name: "Mode",
    slug: "mode",
    category: "layer-2",
    type: "evm",
    color: "#DFFE00",
    description: "Optimistic L2 focused on DeFi",
    networks: [
      { id: "mainnet", name: "Mainnet", chainId: 34443, isTestnet: false },
      { id: "sepolia", name: "Sepolia", chainId: 919, isTestnet: true },
    ],
    features: ["OP Stack", "DeFi Native", "Sequencer Fee Sharing"],
    docs: {
      quickstart: "/docs/mode/quickstart",
      faq: "/docs/mode/faq",
      overview: "/docs/mode/overview",
      endpoints: "/docs/mode/endpoints",
    },
  },
  {
    id: "zora",
    name: "Zora",
    slug: "zora",
    category: "layer-2",
    type: "evm",
    color: "#000000",
    description: "Creator-focused Ethereum L2",
    networks: [
      { id: "mainnet", name: "Mainnet", chainId: 7777777, isTestnet: false },
      { id: "sepolia", name: "Sepolia", chainId: 999999999, isTestnet: true },
    ],
    features: ["OP Stack", "NFT Optimized", "Creator Tools"],
    docs: {
      quickstart: "/docs/zora/quickstart",
      faq: "/docs/zora/faq",
      overview: "/docs/zora/overview",
      endpoints: "/docs/zora/endpoints",
    },
  },

  // Layer 2 - ZK Rollups
  {
    id: "polygon-zkevm",
    name: "Polygon zkEVM",
    slug: "polygon-zkevm",
    category: "layer-2",
    type: "evm",
    color: "#8247E5",
    description: "Zero-knowledge rollup with full EVM equivalence",
    networks: [
      { id: "mainnet", name: "Mainnet", chainId: 1101, isTestnet: false },
      { id: "cardona", name: "Cardona", chainId: 2442, isTestnet: true },
    ],
    features: ["zkEVM", "EVM Equivalence", "Polygon Ecosystem"],
    docs: {
      quickstart: "/docs/polygon-zkevm/quickstart",
      faq: "/docs/polygon-zkevm/faq",
      endpoints: "/docs/polygon-zkevm/endpoints",
    },
  },
  {
    id: "zksync",
    name: "zkSync Era",
    slug: "zksync",
    category: "layer-2",
    type: "evm",
    color: "#8C8DFC",
    description: "Privacy-preserving and scalable ZK rollup",
    networks: [
      { id: "mainnet", name: "Mainnet", chainId: 324, isTestnet: false },
      { id: "sepolia", name: "Sepolia", chainId: 300, isTestnet: true },
    ],
    features: ["zkEVM", "Account Abstraction", "Hyperchains"],
    docs: {
      quickstart: "/docs/zksync/quickstart",
      faq: "/docs/zksync/faq",
      endpoints: "/docs/zksync/endpoints",
    },
  },
  {
    id: "scroll",
    name: "Scroll",
    slug: "scroll",
    category: "layer-2",
    type: "evm",
    color: "#FFEEDA",
    description: "Bytecode-level compatible zkEVM",
    networks: [
      { id: "mainnet", name: "Mainnet", chainId: 534352, isTestnet: false },
      { id: "sepolia", name: "Sepolia", chainId: 534351, isTestnet: true },
    ],
    features: ["zkEVM", "Bytecode Compatible", "Decentralized Provers"],
    docs: {
      quickstart: "/docs/scroll/quickstart",
      faq: "/docs/scroll/faq",
      overview: "/docs/scroll/overview",
      endpoints: "/docs/scroll/endpoints",
    },
  },
  {
    id: "linea",
    name: "Linea",
    slug: "linea",
    category: "layer-2",
    type: "evm",
    color: "#61DFFF",
    description: "ConsenSys zkEVM rollup",
    networks: [
      { id: "mainnet", name: "Mainnet", chainId: 59144, isTestnet: false },
      { id: "sepolia", name: "Sepolia", chainId: 59141, isTestnet: true },
    ],
    features: ["zkEVM", "ConsenSys Ecosystem", "MetaMask Integration"],
    docs: {
      quickstart: "/docs/linea/quickstart",
      faq: "/docs/linea/faq",
      overview: "/docs/linea/overview",
      endpoints: "/docs/linea/endpoints",
    },
  },
  {
    id: "starknet",
    name: "Starknet",
    slug: "starknet",
    category: "layer-2",
    type: "starknet",
    color: "#EC796B",
    description: "Validity rollup using STARK proofs",
    networks: [
      { id: "mainnet", name: "Mainnet", isTestnet: false },
      { id: "sepolia", name: "Sepolia", isTestnet: true },
    ],
    features: ["STARK Proofs", "Cairo Language", "Account Abstraction"],
    docs: {
      quickstart: "/docs/starknet/quickstart",
      faq: "/docs/starknet/faq",
      overview: "/docs/starknet/overview",
      endpoints: "/docs/starknet/endpoints",
    },
  },

  // Layer 2 - Other
  {
    id: "polygon",
    name: "Polygon PoS",
    slug: "polygon",
    category: "layer-2",
    type: "evm",
    color: "#8247E5",
    description: "High-throughput Ethereum sidechain",
    networks: [
      { id: "mainnet", name: "Mainnet", chainId: 137, isTestnet: false },
      { id: "amoy", name: "Amoy", chainId: 80002, isTestnet: true },
    ],
    features: ["PoS Consensus", "Low Fees", "High Throughput"],
    docs: {
      quickstart: "/docs/polygon/quickstart",
      faq: "/docs/polygon/faq",
      overview: "/docs/polygon/overview",
      endpoints: "/docs/polygon/endpoints",
    },
  },
  {
    id: "opbnb",
    name: "opBNB",
    slug: "opbnb",
    category: "layer-2",
    type: "evm",
    color: "#F3BA2F",
    description: "BNB Chain's optimistic rollup L2",
    networks: [
      { id: "mainnet", name: "Mainnet", chainId: 204, isTestnet: false },
      { id: "testnet", name: "Testnet", chainId: 5611, isTestnet: true },
    ],
    features: ["OP Stack", "BNB Ecosystem", "Ultra Low Fees"],
    docs: {
      quickstart: "/docs/opbnb/quickstart",
      faq: "/docs/opbnb/faq",
      endpoints: "/docs/opbnb/endpoints",
    },
  },

  // Alternative Layer 1s
  {
    id: "solana",
    name: "Solana",
    slug: "solana",
    category: "alt-l1",
    type: "svm",
    color: "#9945FF",
    description: "High-performance blockchain with fast transactions and low fees",
    networks: [
      { id: "mainnet", name: "Mainnet", isTestnet: false },
      { id: "devnet", name: "Devnet", isTestnet: true },
    ],
    features: ["Proof of History", "DAS APIs", "High TPS"],
    docs: {
      quickstart: "/docs/solana/quickstart",
      faq: "/docs/solana/faq",
      overview: "/docs/solana/overview",
      endpoints: "/docs/solana/endpoints",
    },
  },
  {
    id: "aptos",
    name: "Aptos",
    slug: "aptos",
    category: "alt-l1",
    type: "move",
    color: "#4CD9A5",
    description: "Secure, scalable blockchain using the Move language",
    networks: [
      { id: "mainnet", name: "Mainnet", isTestnet: false },
      { id: "testnet", name: "Testnet", isTestnet: true },
    ],
    features: ["Move Language", "Block-STM", "Parallel Execution"],
    docs: {
      quickstart: "/docs/aptos/quickstart",
      faq: "/docs/aptos/faq",
      endpoints: "/docs/aptos/endpoints",
    },
  },
  {
    id: "flow",
    name: "Flow",
    slug: "flow",
    category: "alt-l1",
    type: "other",
    color: "#00EF8B",
    description: "Blockchain built for NFTs, games, and digital assets",
    networks: [
      { id: "mainnet", name: "Mainnet", isTestnet: false },
      { id: "testnet", name: "Testnet", isTestnet: true },
    ],
    features: ["Cadence Language", "Multi-role Architecture", "Flow EVM"],
    docs: {
      quickstart: "/docs/flow/quickstart",
      faq: "/docs/flow/faq",
      endpoints: "/docs/flow/endpoints",
    },
  },
  {
    id: "berachain",
    name: "Berachain",
    slug: "berachain",
    category: "alt-l1",
    type: "evm",
    color: "#D48B00",
    description: "DeFi-native blockchain with novel consensus",
    networks: [
      { id: "mainnet", name: "Mainnet", chainId: 80094, isTestnet: false },
      { id: "bartio", name: "Bartio", chainId: 80084, isTestnet: true },
    ],
    features: ["Proof of Liquidity", "BeaconKit", "EVM Compatible"],
    docs: {
      quickstart: "/docs/berachain/quickstart",
      faq: "/docs/berachain/faq",
      overview: "/docs/berachain/overview",
      endpoints: "/docs/berachain/endpoints",
    },
  },
  {
    id: "sei",
    name: "Sei",
    slug: "sei",
    category: "alt-l1",
    type: "evm",
    color: "#9B1C1C",
    description: "Purpose-built L1 for trading applications",
    networks: [
      { id: "mainnet", name: "Mainnet", chainId: 1329, isTestnet: false },
      { id: "testnet", name: "Atlantic", chainId: 1328, isTestnet: true },
    ],
    features: ["Parallel EVM", "Built-in Orderbook", "Fast Finality"],
    docs: {
      quickstart: "/docs/sei/quickstart",
      faq: "/docs/sei/faq",
      overview: "/docs/sei/overview",
      endpoints: "/docs/sei/endpoints",
    },
  },
  {
    id: "sonic",
    name: "Sonic",
    slug: "sonic",
    category: "alt-l1",
    type: "evm",
    color: "#FF6B00",
    description: "High-performance EVM chain (formerly Fantom Sonic)",
    networks: [
      { id: "mainnet", name: "Mainnet", chainId: 146, isTestnet: false },
      { id: "testnet", name: "Testnet", chainId: 57054, isTestnet: true },
    ],
    features: ["Sonic Consensus", "Sub-second Finality", "High TPS"],
    docs: {
      quickstart: "/docs/sonic/quickstart",
      faq: "/docs/sonic/faq",
      overview: "/docs/sonic/overview",
      endpoints: "/docs/sonic/endpoints",
    },
  },
  {
    id: "monad",
    name: "Monad",
    slug: "monad",
    category: "alt-l1",
    type: "evm",
    color: "#836EF9",
    description: "High-performance EVM-compatible blockchain",
    networks: [
      { id: "testnet", name: "Devnet", isTestnet: true },
    ],
    features: ["Parallel Execution", "MonadBFT", "10,000 TPS"],
    docs: {
      quickstart: "/docs/monad/quickstart",
      faq: "/docs/monad/faq",
      overview: "/docs/monad/overview",
      endpoints: "/docs/monad/endpoints",
    },
  },
  {
    id: "tron",
    name: "Tron",
    slug: "tron",
    category: "alt-l1",
    type: "other",
    color: "#FF0013",
    description: "High-throughput blockchain for digital content",
    networks: [
      { id: "mainnet", name: "Mainnet", isTestnet: false },
      { id: "shasta", name: "Shasta", isTestnet: true },
    ],
    features: ["DPoS Consensus", "High Throughput", "USDT Hub"],
    docs: {
      quickstart: "/docs/tron/quickstart",
      faq: "/docs/tron/faq",
      overview: "/docs/tron/overview",
      endpoints: "/docs/tron/endpoints",
    },
  },

  // Bitcoin
  {
    id: "bitcoin",
    name: "Bitcoin",
    slug: "bitcoin",
    category: "bitcoin",
    type: "bitcoin",
    color: "#F7931A",
    description: "The original cryptocurrency and decentralized network",
    networks: [
      { id: "mainnet", name: "Mainnet", isTestnet: false },
      { id: "testnet", name: "Testnet", isTestnet: true },
    ],
    features: ["UTXO Model", "Ordinals", "BRC-20"],
    docs: {
      quickstart: "/docs/bitcoin/quickstart",
      faq: "/docs/bitcoin/faq",
      overview: "/docs/bitcoin/overview",
      endpoints: "/docs/bitcoin/endpoints",
    },
  },

  // Emerging Networks
  {
    id: "astar",
    name: "Astar",
    slug: "astar",
    category: "layer-2",
    type: "evm",
    color: "#0070EB",
    description: "Multi-chain smart contract platform on Polkadot",
    networks: [
      { id: "mainnet", name: "Mainnet", chainId: 592, isTestnet: false },
      { id: "shibuya", name: "Shibuya", chainId: 81, isTestnet: true },
    ],
    features: ["Polkadot Parachain", "WASM + EVM", "dApp Staking"],
    docs: {
      quickstart: "/docs/astar/quickstart",
      faq: "/docs/astar/faq",
      overview: "/docs/astar/overview",
      endpoints: "/docs/astar/endpoints",
    },
  },
  {
    id: "zetachain",
    name: "ZetaChain",
    slug: "zetachain",
    category: "alt-l1",
    type: "evm",
    color: "#00D169",
    description: "Omnichain blockchain connecting all chains",
    networks: [
      { id: "mainnet", name: "Mainnet", chainId: 7000, isTestnet: false },
      { id: "testnet", name: "Athens", chainId: 7001, isTestnet: true },
    ],
    features: ["Omnichain Messaging", "Cross-chain Smart Contracts", "TSS"],
    docs: {
      quickstart: "/docs/zetachain/quickstart",
      faq: "/docs/zetachain/faq",
      overview: "/docs/zetachain/overview",
      endpoints: "/docs/zetachain/endpoints",
    },
  },
  {
    id: "ink",
    name: "Ink",
    slug: "ink",
    category: "layer-2",
    type: "evm",
    color: "#7B61FF",
    description: "L2 solution for decentralized apps",
    networks: [
      { id: "mainnet", name: "Mainnet", chainId: 57073, isTestnet: false },
      { id: "sepolia", name: "Sepolia", chainId: 763373, isTestnet: true },
    ],
    features: ["OP Stack", "Kraken Integration"],
    docs: {
      quickstart: "/docs/ink/quickstart",
      faq: "/docs/ink/faq",
      overview: "/docs/ink/overview",
      endpoints: "/docs/ink/endpoints",
    },
  },
  {
    id: "shape",
    name: "Shape",
    slug: "shape",
    category: "layer-2",
    type: "evm",
    color: "#000000",
    description: "Scalable L2 network",
    networks: [
      { id: "mainnet", name: "Mainnet", chainId: 360, isTestnet: false },
      { id: "sepolia", name: "Sepolia", chainId: 11011, isTestnet: true },
    ],
    features: ["OP Stack", "Creator Economy"],
    docs: {
      quickstart: "/docs/shape/quickstart",
      faq: "/docs/shape/faq",
      overview: "/docs/shape/overview",
      endpoints: "/docs/shape/endpoints",
    },
  },
  {
    id: "unichain",
    name: "Unichain",
    slug: "unichain",
    category: "layer-2",
    type: "evm",
    color: "#FF007A",
    description: "Uniswap's L2 solution",
    networks: [
      { id: "mainnet", name: "Mainnet", chainId: 130, isTestnet: false },
      { id: "sepolia", name: "Sepolia", chainId: 1301, isTestnet: true },
    ],
    features: ["OP Stack", "Flashblocks API", "MEV Redistribution"],
    docs: {
      quickstart: "/docs/unichain/quickstart",
      faq: "/docs/unichain/faq",
      overview: "/docs/unichain/overview",
      endpoints: "/docs/unichain/endpoints",
    },
  },
  {
    id: "world-chain",
    name: "World Chain",
    slug: "world-chain",
    category: "layer-2",
    type: "evm",
    color: "#000000",
    description: "Identity-focused L2",
    networks: [
      { id: "mainnet", name: "Mainnet", chainId: 480, isTestnet: false },
      { id: "sepolia", name: "Sepolia", chainId: 4801, isTestnet: true },
    ],
    features: ["OP Stack", "World ID", "Proof of Personhood"],
    docs: {
      quickstart: "/docs/world-chain/quickstart",
      faq: "/docs/world-chain/faq",
      overview: "/docs/world-chain/overview",
      endpoints: "/docs/world-chain/endpoints",
    },
  },
  {
    id: "abstract",
    name: "Abstract",
    slug: "abstract",
    category: "layer-2",
    type: "evm",
    color: "#00D395",
    description: "Application-specific L2",
    networks: [
      { id: "mainnet", name: "Mainnet", chainId: 2741, isTestnet: false },
      { id: "testnet", name: "Testnet", chainId: 11124, isTestnet: true },
    ],
    features: ["ZK Stack", "Consumer Apps", "Account Abstraction"],
    docs: {
      quickstart: "/docs/abstract/quickstart",
      faq: "/docs/abstract/faq",
      overview: "/docs/abstract/overview",
      endpoints: "/docs/abstract/endpoints",
    },
  },
  {
    id: "soneium",
    name: "Soneium",
    slug: "soneium",
    category: "layer-2",
    type: "evm",
    color: "#0066CC",
    description: "Next-generation L2 platform",
    networks: [
      { id: "mainnet", name: "Mainnet", chainId: 1868, isTestnet: false },
      { id: "minato", name: "Minato", chainId: 1946, isTestnet: true },
    ],
    features: ["OP Stack", "Sony Partnership"],
    docs: {
      quickstart: "/docs/soneium/quickstart",
      faq: "/docs/soneium/faq",
      overview: "/docs/soneium/overview",
      endpoints: "/docs/soneium/endpoints",
    },
  },
  {
    id: "crossfi",
    name: "CrossFi",
    slug: "crossfi",
    category: "alt-l1",
    type: "evm",
    color: "#6366F1",
    description: "Cross-chain DeFi blockchain",
    networks: [
      { id: "mainnet", name: "Mainnet", chainId: 4158, isTestnet: false },
      { id: "testnet", name: "Testnet", chainId: 4157, isTestnet: true },
    ],
    features: ["Cross-chain DeFi", "EVM Compatible"],
    docs: {
      quickstart: "/docs/crossfi/quickstart",
      faq: "/docs/crossfi/faq",
      overview: "/docs/crossfi/overview",
      endpoints: "/docs/crossfi/endpoints",
    },
  },
  {
    id: "apechain",
    name: "ApeChain",
    slug: "apechain",
    category: "layer-2",
    type: "evm",
    color: "#0055FF",
    description: "Yuga Labs' Arbitrum L3",
    networks: [
      { id: "mainnet", name: "Mainnet", chainId: 33139, isTestnet: false },
      { id: "curtis", name: "Curtis", chainId: 33111, isTestnet: true },
    ],
    features: ["Arbitrum Orbit", "ApeCoin Native", "NFT Ecosystem"],
    docs: {
      quickstart: "/docs/apechain/quickstart",
      faq: "/docs/apechain/faq",
      endpoints: "/docs/apechain/endpoints",
    },
  },
  {
    id: "lens",
    name: "Lens",
    slug: "lens",
    category: "layer-2",
    type: "evm",
    color: "#00501E",
    description: "Social graph protocol L2",
    networks: [
      { id: "mainnet", name: "Mainnet", chainId: 37111, isTestnet: false },
      { id: "testnet", name: "Sepolia", chainId: 37111, isTestnet: true },
    ],
    features: ["ZK Stack", "Social Graph", "Content Ownership"],
    docs: {
      quickstart: "/docs/lens/quickstart",
      faq: "/docs/lens/faq",
      overview: "/docs/lens/overview",
      endpoints: "/docs/lens/endpoints",
    },
  },
  {
    id: "lumia",
    name: "Lumia",
    slug: "lumia",
    category: "layer-2",
    type: "evm",
    color: "#FF6B35",
    description: "Real-world asset L2",
    networks: [
      { id: "mainnet", name: "Mainnet", chainId: 994873017, isTestnet: false },
      { id: "testnet", name: "Testnet", chainId: 1952959480, isTestnet: true },
    ],
    features: ["RWA Focus", "Polygon CDK"],
    docs: {
      quickstart: "/docs/lumia/quickstart",
      faq: "/docs/lumia/faq",
      overview: "/docs/lumia/overview",
      endpoints: "/docs/lumia/endpoints",
    },
  },
  {
    id: "hyperliquid",
    name: "Hyperliquid",
    slug: "hyperliquid",
    category: "alt-l1",
    type: "evm",
    color: "#00FF88",
    description: "Perpetual exchange L1",
    networks: [
      { id: "mainnet", name: "Mainnet", chainId: 42161, isTestnet: false },
    ],
    features: ["On-chain Orderbook", "Perpetuals", "Sub-second Settlement"],
    docs: {
      quickstart: "/docs/hyperliquid/quickstart",
      faq: "/docs/hyperliquid/faq",
      endpoints: "/docs/hyperliquid/endpoints",
    },
  },
  {
    id: "xmtp",
    name: "XMTP",
    slug: "xmtp",
    category: "other",
    type: "other",
    color: "#FC4F37",
    description: "Web3 messaging protocol",
    networks: [
      { id: "mainnet", name: "Mainnet", isTestnet: false },
      { id: "dev", name: "Dev", isTestnet: true },
    ],
    features: ["E2E Encryption", "Cross-chain Identity", "Messaging"],
    docs: {
      quickstart: "/docs/xmtp/quickstart",
      faq: "/docs/xmtp/faq",
      overview: "/docs/xmtp/overview",
      endpoints: "/docs/xmtp/endpoints",
    },
  },
  {
    id: "ronin",
    name: "Ronin",
    slug: "ronin",
    category: "layer-2",
    type: "evm",
    color: "#1273EA",
    description: "Gaming blockchain (Axie Infinity)",
    networks: [
      { id: "mainnet", name: "Mainnet", chainId: 2020, isTestnet: false },
      { id: "saigon", name: "Saigon", chainId: 2021, isTestnet: true },
    ],
    features: ["Gaming Focus", "Low Fees", "High TPS"],
    docs: {
      quickstart: "/docs/ronin/quickstart",
      faq: "/docs/ronin/faq",
      overview: "/docs/ronin/overview",
      endpoints: "/docs/ronin/endpoints",
    },
  },
  {
    id: "moonbeam",
    name: "Moonbeam",
    slug: "moonbeam",
    category: "alt-l1",
    type: "evm",
    color: "#53CBC9",
    description: "Polkadot EVM parachain",
    networks: [
      { id: "mainnet", name: "Mainnet", chainId: 1284, isTestnet: false },
      { id: "moonbase", name: "Moonbase Alpha", chainId: 1287, isTestnet: true },
    ],
    features: ["Polkadot Parachain", "Full EVM", "Cross-chain"],
    docs: {
      quickstart: "/docs/moonbeam/quickstart",
      faq: "/docs/moonbeam/faq",
      overview: "/docs/moonbeam/overview",
      endpoints: "/docs/moonbeam/endpoints",
    },
  },
  {
    id: "bob",
    name: "BOB",
    slug: "bob",
    category: "layer-2",
    type: "evm",
    color: "#F7931A",
    description: "Bitcoin-centric L2",
    networks: [
      { id: "mainnet", name: "Mainnet", chainId: 60808, isTestnet: false },
      { id: "sepolia", name: "Sepolia", chainId: 808813, isTestnet: true },
    ],
    features: ["Bitcoin Bridged", "OP Stack", "BTC DeFi"],
    docs: {
      quickstart: "/docs/bob/quickstart",
      faq: "/docs/bob/faq",
      overview: "/docs/bob/overview",
      endpoints: "/docs/bob/endpoints",
    },
  },
  {
    id: "frax",
    name: "Frax",
    slug: "frax",
    category: "layer-2",
    type: "evm",
    color: "#000000",
    description: "Frax Finance L2",
    networks: [
      { id: "mainnet", name: "Mainnet", chainId: 252, isTestnet: false },
      { id: "holesky", name: "Holesky", chainId: 2522, isTestnet: true },
    ],
    features: ["Hybrid Rollup", "frxETH", "Frax Ecosystem"],
    docs: {
      quickstart: "/docs/frax/quickstart",
      faq: "/docs/frax/faq",
      overview: "/docs/frax/overview",
      endpoints: "/docs/frax/endpoints",
    },
  },
  {
    id: "degen",
    name: "Degen",
    slug: "degen",
    category: "layer-2",
    type: "evm",
    color: "#A36EFD",
    description: "Farcaster community L3",
    networks: [
      { id: "mainnet", name: "Mainnet", chainId: 666666666, isTestnet: false },
    ],
    features: ["Arbitrum Orbit", "Farcaster Native", "DEGEN Token"],
    docs: {
      quickstart: "/docs/degen/quickstart",
      faq: "/docs/degen/faq",
      overview: "/docs/degen/overview",
      endpoints: "/docs/degen/endpoints",
    },
  },
  {
    id: "megaeth",
    name: "MegaETH",
    slug: "megaeth",
    category: "layer-2",
    type: "evm",
    color: "#FF4500",
    description: "Real-time blockchain",
    networks: [
      { id: "testnet", name: "Testnet", isTestnet: true },
    ],
    features: ["Sub-ms Latency", "100k TPS", "Real-time"],
    docs: {
      quickstart: "/docs/megaeth/quickstart",
      faq: "/docs/megaeth/faq",
      overview: "/docs/megaeth/overview",
      endpoints: "/docs/megaeth/endpoints",
    },
  },

  // Lux Network (Native)
  {
    id: "lux",
    name: "Lux Network",
    slug: "lux",
    category: "alt-l1",
    type: "evm",
    color: "#00D4FF",
    description: "Multi-consensus blockchain with post-quantum security",
    networks: [
      { id: "mainnet", name: "Mainnet", chainId: 96369, isTestnet: false },
      { id: "testnet", name: "Testnet", chainId: 96370, isTestnet: true },
    ],
    features: ["Post-Quantum", "Multi-consensus", "High Performance", "Native Support"],
    docs: {
      quickstart: "/docs/lux/quickstart",
      faq: "/docs/lux/faq",
      overview: "/docs/lux/overview",
      endpoints: "/docs/lux/endpoints",
    },
  },
]

export const CHAIN_CATEGORIES = {
  "ethereum-l1": {
    name: "Ethereum & EVM Layer 1s",
    description: "Native EVM-compatible Layer 1 blockchains",
  },
  "layer-2": {
    name: "Layer 2 Scaling Solutions",
    description: "Rollups, sidechains, and other scaling solutions",
  },
  "alt-l1": {
    name: "Alternative Layer 1s",
    description: "Non-Ethereum Layer 1 blockchains",
  },
  bitcoin: {
    name: "Bitcoin",
    description: "Bitcoin and Bitcoin-adjacent networks",
  },
  other: {
    name: "Other Protocols",
    description: "Messaging, identity, and specialized protocols",
  },
}

export function getChainById(id: string): Chain | undefined {
  return CHAINS.find((c) => c.id === id)
}

export function getChainBySlug(slug: string): Chain | undefined {
  return CHAINS.find((c) => c.slug === slug)
}

export function getChainsByCategory(category: ChainCategory): Chain[] {
  return CHAINS.filter((c) => c.category === category && !c.deprecated)
}

export function getActiveChains(): Chain[] {
  return CHAINS.filter((c) => !c.deprecated)
}

export function searchChains(query: string): Chain[] {
  const q = query.toLowerCase()
  return CHAINS.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.slug.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q)
  )
}
