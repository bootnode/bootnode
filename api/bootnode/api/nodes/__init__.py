"""
Node management API endpoints
Handles blockchain node deployment, monitoring, and management via Docker/K8s
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import List, Dict, Optional
import secrets
from pydantic import BaseModel
from datetime import datetime
import docker
import os
import asyncio
import uuid

router = APIRouter()

# Node images by chain - execution and consensus clients
CHAIN_IMAGES = {
    # ============ ETHEREUM & L2s ============
    "ethereum": {
        "execution": {
            "geth": "ethereum/client-go:stable",
            "nethermind": "nethermind/nethermind:latest",
            "besu": "hyperledger/besu:latest",
            "erigon": "thorax/erigon:stable",
        },
        "consensus": {
            "prysm": "gcr.io/prysmaticlabs/prysm/beacon-chain:stable",
            "lighthouse": "sigp/lighthouse:latest",
            "lodestar": "chainsafe/lodestar:latest",
            "teku": "consensys/teku:latest",
        },
        "validator": {
            "prysm": "gcr.io/prysmaticlabs/prysm/validator:stable",
            "lighthouse": "sigp/lighthouse:latest",
        },
        "mev": {
            "mev-boost": "flashbots/mev-boost:latest",
        },
    },
    "arbitrum": {
        "execution": {"nitro": "offchainlabs/nitro-node:latest"},
    },
    "optimism": {
        "execution": {"op-geth": "us-docker.pkg.dev/oplabs-tools-artifacts/images/op-geth:latest"},
        "consensus": {"op-node": "us-docker.pkg.dev/oplabs-tools-artifacts/images/op-node:latest"},
    },
    "base": {
        "execution": {"op-geth": "us-docker.pkg.dev/oplabs-tools-artifacts/images/op-geth:latest"},
        "consensus": {"op-node": "us-docker.pkg.dev/oplabs-tools-artifacts/images/op-node:latest"},
    },
    "polygon": {
        "execution": {"bor": "maticnetwork/bor:latest"},
        "consensus": {"heimdall": "maticnetwork/heimdall:latest"},
    },
    "zksync": {
        "execution": {"zksync-node": "matterlabs/external-node:latest"},
    },
    "linea": {
        "execution": {"linea-node": "consensys/linea-node:latest"},
    },
    "scroll": {
        "execution": {"scroll": "scrolltech/l2geth:latest"},
    },
    "mantle": {
        "execution": {"mantle": "mantlenetworkio/mpc-node:latest"},
    },
    "blast": {
        "execution": {"blast": "blastio/blast-geth:latest"},
    },
    # ============ HANZO ECOSYSTEM (Lux-based) ============
    "lux": {
        "execution": {"luxd": "luxfi/luxd:latest"},
    },
    "zoo": {
        "execution": {"luxd": "luxfi/luxd:latest"},  # Zoo subnet on Lux
    },
    "pars": {
        "execution": {"luxd": "luxfi/luxd:latest"},  # Pars subnet on Lux
    },
    "hanzo": {
        "execution": {"luxd": "luxfi/luxd:latest"},  # Hanzo subnet on Lux
    },
    # ============ MAJOR L1s ============
    "bitcoin": {
        "execution": {"bitcoind": "kylemanna/bitcoind:latest"},
    },
    "solana": {
        "execution": {"solana": "solanalabs/solana:stable"},
    },
    "avalanche": {
        "execution": {"avalanchego": "avaplatform/avalanchego:latest"},
    },
    "bsc": {
        "execution": {"geth": "ghcr.io/bnb-chain/bsc:latest"},
    },
    "xrpl": {
        "execution": {"rippled": "xrplf/rippled:latest"},
    },
    "cardano": {
        "execution": {"cardano-node": "inputoutput/cardano-node:latest"},
    },
    "polkadot": {
        "execution": {"polkadot": "parity/polkadot:latest"},
    },
    "cosmos": {
        "execution": {"gaiad": "cosmosnetwork/gaiad:latest"},
    },
    "near": {
        "execution": {"nearcore": "nearprotocol/nearcore:latest"},
    },
    "fantom": {
        "execution": {"opera": "fantomfoundation/opera:latest"},
    },
    "cronos": {
        "execution": {"cronosd": "crypto-org-chain/cronos:latest"},
    },
    "gnosis": {
        "execution": {"nethermind": "nethermind/nethermind:gnosis"},
    },
    "celo": {
        "execution": {"celo": "us.gcr.io/celo-org/geth:latest"},
    },
    "moonbeam": {
        "execution": {"moonbeam": "purestake/moonbeam:latest"},
    },
    "sei": {
        "execution": {"seid": "sei-protocol/sei-chain:latest"},
    },
    "sui": {
        "execution": {"sui-node": "mysten/sui-node:latest"},
    },
    "aptos": {
        "execution": {"aptos-node": "aptoslabs/validator:latest"},
    },
    "ton": {
        "execution": {"ton-node": "tonlabs/ton-node:latest"},
    },
    "tron": {
        "execution": {"java-tron": "tronprotocol/java-tron:latest"},
    },
    "filecoin": {
        "execution": {"lotus": "filecoin/lotus:latest"},
    },
    "hedera": {
        "execution": {"hedera": "hashgraph/full-stack-testing/ubi8-init-java17:latest"},
    },
    # ============ MORE STAKING CHAINS ============
    "bittensor": {
        "execution": {"subtensor": "opentensor/subtensor:latest"},
    },
    "tezos": {
        "execution": {"tezos-node": "tezos/tezos:latest"},
    },
    "algorand": {
        "execution": {"algod": "algorand/stable:latest"},
    },
    "injective": {
        "execution": {"injectived": "injectivelabs/injective-core:latest"},
    },
    "iota": {
        "execution": {"hornet": "iotaledger/hornet:latest"},
    },
    "stacks": {
        "execution": {"stacks-node": "blockstack/stacks-core:latest"},
    },
    "celestia": {
        "execution": {"celestia-node": "celestiaorg/celestia-node:latest"},
    },
    "aleo": {
        "execution": {"snarkos": "aleohq/snarkos:latest"},
    },
    "fetch": {
        "execution": {"fetchd": "fetchai/fetchd:latest"},
    },
    "livepeer": {
        "execution": {"livepeer": "livepeer/go-livepeer:latest"},
    },
    "multiversx": {
        "execution": {"elrond-node": "multiversx/chain-go:latest"},
    },
    "starknet": {
        "execution": {"pathfinder": "eqlabs/pathfinder:latest"},
    },
    "akash": {
        "execution": {"akash": "ovrclk/akash:latest"},
    },
    "zetachain": {
        "execution": {"zetachain": "zetachain/zetacore:latest"},
    },
    "axelar": {
        "execution": {"axelard": "axelarnet/axelar-core:latest"},
    },
    "dydx": {
        "execution": {"dydxd": "dydxprotocol/dydx-core:latest"},
    },
    "casper": {
        "execution": {"casper-node": "casper-network/casper-node:latest"},
    },
    "avail": {
        "execution": {"avail-node": "availproject/avail:latest"},
    },
    "band": {
        "execution": {"bandd": "bandprotocol/band-chain:latest"},
    },
    "secret": {
        "execution": {"secretd": "enigmampc/secret-network:latest"},
    },
    "skale": {
        "execution": {"skaled": "skalenetwork/skaled:latest"},
    },
    "waves": {
        "execution": {"waves-node": "wavesplatform/wavesnode:latest"},
    },
    "osmosis": {
        "execution": {"osmosisd": "osmolabs/osmosis:latest"},
    },
    "radix": {
        "execution": {"radixdlt-node": "radixdlt/radixdlt-core:latest"},
    },
    "harmony": {
        "execution": {"harmony": "harmonyone/harmony:latest"},
    },
    "kava": {
        "execution": {"kava": "kava-labs/kava:latest"},
    },
}

# Default ports by chain
CHAIN_PORTS = {
    "ethereum": {"rpc": 8545, "ws": 8546, "p2p": 30303},
    "arbitrum": {"rpc": 8547, "ws": 8548, "p2p": 30303},
    "optimism": {"rpc": 8545, "ws": 8546, "p2p": 30303},
    "base": {"rpc": 8545, "ws": 8546, "p2p": 30303},
    "polygon": {"rpc": 8545, "ws": 8546, "p2p": 30303},
    "zksync": {"rpc": 3050, "ws": 3051},
    "linea": {"rpc": 8545, "ws": 8546},
    "scroll": {"rpc": 8545, "ws": 8546},
    "mantle": {"rpc": 8545, "ws": 8546},
    "blast": {"rpc": 8545, "ws": 8546},
    # Hanzo ecosystem
    "lux": {"rpc": 9650, "ws": 9650, "p2p": 9651},
    "zoo": {"rpc": 9650, "ws": 9650, "p2p": 9651},
    "pars": {"rpc": 9650, "ws": 9650, "p2p": 9651},
    "hanzo": {"rpc": 9650, "ws": 9650, "p2p": 9651},
    # Major L1s
    "bitcoin": {"rpc": 8332, "p2p": 8333},
    "solana": {"rpc": 8899, "ws": 8900, "p2p": 8001},
    "avalanche": {"rpc": 9650, "ws": 9650, "p2p": 9651},
    "bsc": {"rpc": 8545, "ws": 8546, "p2p": 30303},
    "xrpl": {"rpc": 5005, "ws": 6006, "p2p": 51235},
    "cardano": {"rpc": 12798, "p2p": 3001},
    "polkadot": {"rpc": 9933, "ws": 9944, "p2p": 30333},
    "cosmos": {"rpc": 26657, "p2p": 26656},
    "near": {"rpc": 3030, "p2p": 24567},
    "fantom": {"rpc": 8545, "ws": 8546, "p2p": 30303},
    "cronos": {"rpc": 8545, "ws": 8546, "p2p": 26656},
    "gnosis": {"rpc": 8545, "ws": 8546, "p2p": 30303},
    "celo": {"rpc": 8545, "ws": 8546, "p2p": 30303},
    "moonbeam": {"rpc": 9933, "ws": 9944, "p2p": 30333},
    "sei": {"rpc": 26657, "p2p": 26656},
    "sui": {"rpc": 9000, "p2p": 8084},
    "aptos": {"rpc": 8080, "p2p": 6180},
    "ton": {"rpc": 8080, "p2p": 30310},
    "tron": {"rpc": 8090, "p2p": 50051},
    "filecoin": {"rpc": 1234, "p2p": 1347},
    "hedera": {"rpc": 50211, "p2p": 50111},
    # More staking chains
    "bittensor": {"rpc": 9944, "ws": 9945, "p2p": 30333},
    "tezos": {"rpc": 8732, "p2p": 9732},
    "algorand": {"rpc": 8080, "p2p": 4001},
    "injective": {"rpc": 26657, "p2p": 26656},
    "iota": {"rpc": 14265, "p2p": 15600},
    "stacks": {"rpc": 20443, "p2p": 20444},
    "celestia": {"rpc": 26657, "p2p": 26656},
    "aleo": {"rpc": 3033, "p2p": 4133},
    "fetch": {"rpc": 26657, "p2p": 26656},
    "livepeer": {"rpc": 8935, "p2p": 8935},
    "multiversx": {"rpc": 8080, "p2p": 37373},
    "starknet": {"rpc": 9545, "p2p": 9944},
    "akash": {"rpc": 26657, "p2p": 26656},
    "zetachain": {"rpc": 26657, "p2p": 26656},
    "axelar": {"rpc": 26657, "p2p": 26656},
    "dydx": {"rpc": 26657, "p2p": 26656},
    "casper": {"rpc": 7777, "p2p": 35000},
    "avail": {"rpc": 9944, "ws": 9945, "p2p": 30333},
    "band": {"rpc": 26657, "p2p": 26656},
    "secret": {"rpc": 26657, "p2p": 26656},
    "skale": {"rpc": 8545, "p2p": 30303},
    "waves": {"rpc": 6869, "p2p": 6863},
    "osmosis": {"rpc": 26657, "p2p": 26656},
    "radix": {"rpc": 8080, "p2p": 30000},
    "harmony": {"rpc": 9500, "ws": 9800, "p2p": 9000},
    "kava": {"rpc": 26657, "p2p": 26656},
}

# Staking rewards data - APY and market data for top chains
STAKING_DATA = {
    "ethereum": {"apy": 3.13, "staking_mc": 85.58e9, "staking_ratio": 30.46},
    "solana": {"apy": 6.15, "staking_mc": 44.01e9, "staking_ratio": 68.65},
    "bsc": {"apy": 5.01, "staking_mc": 19.35e9, "staking_ratio": 18.45},
    "tron": {"apy": 3.25, "staking_mc": 12.47e9, "staking_ratio": 46.48},
    "sui": {"apy": 1.75, "staking_mc": 8.41e9, "staking_ratio": 74.45},
    "cardano": {"apy": 2.28, "staking_mc": 6.41e9, "staking_ratio": 58.13},
    "avalanche": {"apy": 7.0, "staking_mc": 2.28e9, "staking_ratio": 48.38},
    "hedera": {"apy": 2.5, "staking_mc": 1.47e9, "staking_ratio": 31.87},
    "bittensor": {"apy": 14.73, "staking_mc": 1.44e9, "staking_ratio": 76.22},
    "polkadot": {"apy": 11.68, "staking_mc": 1.34e9, "staking_ratio": 52.59},
    "cronos": {"apy": 1.79, "staking_mc": 1.11e9, "staking_ratio": 13.44},
    "aptos": {"apy": 7.0, "staking_mc": 1.1e9, "staking_ratio": 96.73},
    "near": {"apy": 4.47, "staking_mc": 716.72e6, "staking_ratio": 47.2},
    "cosmos": {"apy": 20.21, "staking_mc": 584.65e6, "staking_ratio": 61.02},
    "polygon": {"apy": 3.68, "staking_mc": 396.21e6, "staking_ratio": 35.48},
    "sei": {"apy": 7.39, "staking_mc": 320.15e6, "staking_ratio": 36.36},
    "tezos": {"apy": 8.51, "staking_mc": 301.91e6, "staking_ratio": 58.8},
    "ton": {"apy": 3.99, "staking_mc": 223.09e6, "staking_ratio": 6.78},
    "injective": {"apy": 6.57, "staking_mc": 202.23e6, "staking_ratio": 55.71},
    "iota": {"apy": 11.55, "staking_mc": 178.2e6, "staking_ratio": 50.53},
    "stacks": {"apy": 9.7, "staking_mc": 0, "staking_ratio": 29.58},
    "celestia": {"apy": 6.45, "staking_mc": 152.84e6, "staking_ratio": 35.49},
    "aleo": {"apy": 10.97, "staking_mc": 130.78e6, "staking_ratio": 68.96},
    "fetch": {"apy": 5.46, "staking_mc": 109.93e6, "staking_ratio": 22.12},
    "livepeer": {"apy": 51.05, "staking_mc": 68.82e6, "staking_ratio": 53.58},
    "multiversx": {"apy": 8.61, "staking_mc": 67.31e6, "staking_ratio": 48.65},
    "starknet": {"apy": 8.83, "staking_mc": 64.68e6, "staking_ratio": 21.86},
    "akash": {"apy": 10.74, "staking_mc": 40.23e6, "staking_ratio": 37.8},
    "zetachain": {"apy": 6.98, "staking_mc": 35.1e6, "staking_ratio": 27.52},
    "axelar": {"apy": 10.49, "staking_mc": 30.62e6, "staking_ratio": 36.31},
    "dydx": {"apy": 2.74, "staking_mc": 28.5e6, "staking_ratio": 22.48},
    "casper": {"apy": 16.74, "staking_mc": 25.71e6, "staking_ratio": 49.47},
    "avail": {"apy": 10.22, "staking_mc": 23.9e6, "staking_ratio": 42.92},
    "band": {"apy": 18.45, "staking_mc": 22.93e6, "staking_ratio": 52.92},
    "secret": {"apy": 24.0, "staking_mc": 16.24e6, "staking_ratio": 42.11},
    "skale": {"apy": 10.0, "staking_mc": 14.83e6, "staking_ratio": 32.37},
    "waves": {"apy": 5.09, "staking_mc": 11.57e6, "staking_ratio": 17.44},
    "filecoin": {"apy": 12.24, "staking_mc": 11.38e6, "staking_ratio": 1.29},
    "osmosis": {"apy": 1.95, "staking_mc": 11.25e6, "staking_ratio": 34.94},
    "radix": {"apy": 6.77, "staking_mc": 10.76e6, "staking_ratio": 33.2},
    "harmony": {"apy": 12.1, "staking_mc": 8.91e6, "staking_ratio": 20.15},
    "kava": {"apy": 9.88, "staking_mc": 6.52e6, "staking_ratio": 9.34},
    "moonbeam": {"apy": 56.94, "staking_mc": 4.4e6, "staking_ratio": 22.13},
    "gnosis": {"apy": 0.83, "staking_mc": 0, "staking_ratio": 6.06},
    "lux": {"apy": 8.5, "staking_mc": 0, "staking_ratio": 45.0},
    "zoo": {"apy": 12.0, "staking_mc": 0, "staking_ratio": 35.0},
    "pars": {"apy": 10.0, "staking_mc": 0, "staking_ratio": 40.0},
    "hanzo": {"apy": 15.0, "staking_mc": 0, "staking_ratio": 30.0},
}

# In-memory store (use Redis/DB in production)
_nodes: Dict[str, dict] = {}

# Port allocation - start from base port and increment
_port_counter: Optional[Dict[str, int]] = None

def allocate_ports() -> Dict[str, int]:
    """Allocate unique ports for a new node, scanning existing containers first"""
    global _port_counter

    if _port_counter is None:
        # Initialize by scanning existing bootnode containers
        _port_counter = {"rpc": 8545, "ws": 8546}
        client = get_docker_client()
        if client:
            try:
                containers = client.containers.list(
                    all=True,
                    filters={"label": "bootnode.managed=true"}
                )
                for c in containers:
                    # Check what ports are bound
                    ports = c.attrs.get("NetworkSettings", {}).get("Ports", {}) or {}
                    for port_key, bindings in ports.items():
                        if bindings:
                            for binding in bindings:
                                host_port = int(binding.get("HostPort", 0))
                                if host_port >= _port_counter["rpc"]:
                                    _port_counter["rpc"] = host_port + 10
                                    _port_counter["ws"] = host_port + 11
            except Exception:
                pass

    ports = {"rpc": _port_counter["rpc"], "ws": _port_counter["ws"]}
    _port_counter["rpc"] += 10  # Leave room for ws ports
    _port_counter["ws"] += 10
    return ports


def get_docker_client():
    """Get Docker client, supporting various environments"""
    try:
        # Try default socket
        return docker.from_env()
    except docker.errors.DockerException:
        # Try common socket paths
        for socket in [
            "unix:///var/run/docker.sock",
            "unix:///Users/Shared/colima/default/docker.sock",
            f"unix://{os.path.expanduser('~')}/.colima/default/docker.sock",
            f"unix://{os.path.expanduser('~')}/.docker/run/docker.sock",
        ]:
            try:
                return docker.DockerClient(base_url=socket)
            except:
                continue
    return None


# Preset configurations for simple mode
NODE_PRESETS = {
    "rpc": {
        "description": "RPC endpoint only - fast, minimal resources",
        "execution_client": "geth",
        "consensus_client": None,  # No consensus = just RPC proxy mode
        "sync_mode": "light",
        "enable_mev": False,
        "enable_validator": False,
    },
    "full": {
        "description": "Full node - syncs and validates all blocks",
        "execution_client": "geth",
        "consensus_client": "lighthouse",
        "sync_mode": "snap",
        "enable_mev": False,
        "enable_validator": False,
    },
    "staking": {
        "description": "Staking node - full node + validator ready",
        "execution_client": "geth",
        "consensus_client": "lighthouse",
        "sync_mode": "snap",
        "enable_mev": True,
        "enable_validator": True,
    },
    "archive": {
        "description": "Archive node - full history, maximum storage",
        "execution_client": "erigon",
        "consensus_client": "lighthouse",
        "sync_mode": "archive",
        "enable_mev": False,
        "enable_validator": False,
    },
}


class NodeCreate(BaseModel):
    name: str
    chain: str  # ethereum, bitcoin, solana, etc.
    network: str = "mainnet"  # mainnet, testnet, etc.
    provider: str = "docker"  # docker, kubernetes, cloud

    # Simple mode - just pick a preset
    mode: str = "advanced"  # "simple" or "advanced"
    preset: Optional[str] = None  # rpc, full, staking, archive (for simple mode)

    # Advanced mode - full control
    execution_client: str = "geth"  # geth, nethermind, besu, erigon
    consensus_client: Optional[str] = "lighthouse"  # prysm, lighthouse, lodestar, teku, None
    sync_mode: str = "snap"  # snap (fast), full, archive
    enable_mev: bool = False  # Enable MEV-boost
    mev_relays: Optional[List[str]] = None  # MEV relay URLs
    enable_validator: bool = False
    validator_keys_path: Optional[str] = None
    fee_recipient: Optional[str] = None  # ETH address for staking rewards


class NodeResponse(BaseModel):
    id: str
    name: str
    chain: str
    network: str
    provider: str
    status: str  # starting, running, stopped, error, pulling
    endpoint: Optional[str] = None
    ws_endpoint: Optional[str] = None
    beacon_api: Optional[str] = None  # Beacon node API
    container_id: Optional[str] = None
    consensus_container_id: Optional[str] = None
    containers: Optional[List[str]] = None  # All container IDs
    execution_client: Optional[str] = None
    consensus_client: Optional[str] = None
    mev_enabled: bool = False
    created_at: str
    last_health_check: Optional[str] = None
    metrics: Dict = {}
    error: Optional[str] = None


class NodeStats(BaseModel):
    total_nodes: int
    running_nodes: int
    chains: Dict[str, int]
    providers: Dict[str, int]


async def start_node_container(node_id: str, node: dict):
    """Background task to start Docker containers for a full node (execution + consensus)"""
    client = get_docker_client()
    if not client:
        _nodes[node_id]["status"] = "error"
        _nodes[node_id]["error"] = "Docker not available"
        return

    chain = node["chain"]
    network = node["network"]
    execution_client = node.get("execution_client", "geth")
    consensus_client = node.get("consensus_client", "lighthouse")
    enable_mev = node.get("enable_mev", False)

    # Get dynamic ports for this node
    allocated = allocate_ports()
    _nodes[node_id]["allocated_ports"] = allocated
    # Calculate port offsets - each node gets a block of ports
    port_offset = (allocated["rpc"] - 8545)
    ports = {
        "rpc": allocated["rpc"],
        "ws": allocated["ws"],
        "engine": 8551 + port_offset,
        "p2p": 30303 + port_offset,
        "beacon_api": 5052 + port_offset,
        "beacon_p2p": 19000 + port_offset,  # Use 19000+ to avoid conflicts with 9000
    }

    # Generate JWT secret for Engine API authentication
    jwt_secret = secrets.token_hex(32)
    jwt_path = f"/tmp/bootnode-jwt-{node_id[:8]}"

    # Create network for node containers to communicate
    network_name = f"bootnode-{node_id[:8]}"
    try:
        node_network = client.networks.create(network_name, driver="bridge")
    except:
        node_network = client.networks.get(network_name)

    containers_created = []

    try:
        chain_images = CHAIN_IMAGES.get(chain, {})

        # ============ ETHEREUM FULL NODE ============
        if chain == "ethereum":
            exec_images = chain_images.get("execution", {})
            cons_images = chain_images.get("consensus", {})

            exec_image = exec_images.get(execution_client, exec_images.get("geth"))
            cons_image = cons_images.get(consensus_client) if consensus_client else None

            if not exec_image:
                raise ValueError(f"No execution image for {execution_client}")

            # Pull images
            _nodes[node_id]["status"] = "pulling"
            for img in [exec_image, cons_image]:
                if img:
                    try:
                        client.images.get(img)
                    except docker.errors.ImageNotFound:
                        client.images.pull(img)

            # Container names
            exec_name = f"bootnode-{chain}-{network}-exec-{node_id[:8]}"
            cons_name = f"bootnode-{chain}-{network}-cons-{node_id[:8]}"

            # Remove old containers
            for name in [exec_name, cons_name]:
                try:
                    old = client.containers.get(name)
                    old.remove(force=True)
                except:
                    pass

            # Create JWT secret file in a volume
            jwt_volume = client.volumes.create(name=f"bootnode-jwt-{node_id[:8]}")

            # ---- EXECUTION CLIENT (Geth) ----
            # Use entrypoint to create JWT file from env var
            exec_entrypoint = f'''sh -c "echo '{jwt_secret}' > /tmp/jwt.hex && exec geth \
                --http --http.addr=0.0.0.0 --http.port=8545 \
                --http.api=eth,net,web3,txpool,engine,admin \
                --http.vhosts=* --http.corsdomain=* \
                --ws --ws.addr=0.0.0.0 --ws.port=8546 \
                --ws.api=eth,net,web3,txpool --ws.origins=* \
                --syncmode=snap \
                --authrpc.addr=0.0.0.0 --authrpc.port=8551 --authrpc.vhosts=* \
                --authrpc.jwtsecret=/tmp/jwt.hex \
                {'--' + network if network != 'mainnet' else ''}"'''

            # Start execution client
            exec_container = client.containers.run(
                exec_image,
                entrypoint=["sh", "-c", f"echo '{jwt_secret}' > /tmp/jwt.hex && exec geth "
                    "--http --http.addr=0.0.0.0 --http.port=8545 "
                    "--http.api=eth,net,web3,txpool,engine,admin "
                    "--http.vhosts=* --http.corsdomain=* "
                    "--ws --ws.addr=0.0.0.0 --ws.port=8546 "
                    "--ws.api=eth,net,web3,txpool --ws.origins=* "
                    "--syncmode=snap "
                    "--authrpc.addr=0.0.0.0 --authrpc.port=8551 --authrpc.vhosts=* "
                    "--authrpc.jwtsecret=/tmp/jwt.hex "
                    + (f"--{network}" if network != "mainnet" else "")
                ],
                name=exec_name,
                detach=True,
                ports={
                    "8545/tcp": ports["rpc"],
                    "8546/tcp": ports["ws"],
                    "8551/tcp": ports["engine"],
                    "30303/tcp": ports["p2p"],
                    "30303/udp": ports["p2p"],
                },
                volumes={
                    f"bootnode-data-{node_id[:8]}": {"bind": "/root/.ethereum", "mode": "rw"},
                },
                network=network_name,
                restart_policy={"Name": "unless-stopped"},
                labels={
                    "bootnode.managed": "true",
                    "bootnode.chain": chain,
                    "bootnode.network": network,
                    "bootnode.node_id": node_id,
                    "bootnode.role": "execution",
                    "bootnode.execution_client": execution_client,
                },
            )
            containers_created.append(exec_container)

            # ---- CONSENSUS CLIENT (Lighthouse/Prysm) ----
            if cons_image and consensus_client:
                # Wait for execution client to be ready
                await asyncio.sleep(5)

                checkpoint_sync_url = None
                if network == "mainnet":
                    checkpoint_sync_url = "https://mainnet.checkpoint.sigp.io"
                elif network == "sepolia":
                    checkpoint_sync_url = "https://sepolia.checkpoint.sigp.io"
                elif network == "holesky":
                    checkpoint_sync_url = "https://holesky.checkpoint.sigp.io"

                engine_port = 8551 + (ports["rpc"] - 8545)

                # Build consensus client entrypoint with JWT from env
                cons_entrypoint = None

                if consensus_client == "lighthouse":
                    # Use checkpoint sync for fast startup (minutes instead of days)
                    # Public checkpoint sync endpoints
                    checkpoint_urls = {
                        "mainnet": "https://beaconstate.ethstaker.cc",
                        "sepolia": "https://beaconstate-sepolia.chainsafe.io",
                        "holesky": "https://beaconstate-holesky.chainsafe.io",
                    }
                    checkpoint_url = checkpoint_urls.get(network, "")
                    checkpoint_arg = f"--checkpoint-sync-url={checkpoint_url}" if checkpoint_url else "--allow-insecure-genesis-sync"

                    cons_entrypoint = [
                        "sh", "-c",
                        f"echo '{jwt_secret}' > /tmp/jwt.hex && exec lighthouse bn "
                        f"--network={network} "
                        f"--execution-endpoint=http://{exec_name}:8551 "
                        "--execution-jwt=/tmp/jwt.hex "
                        "--http --http-address=0.0.0.0 --http-port=5052 "
                        "--http-allow-origin=* "
                        f"{checkpoint_arg} "
                    ]

                elif consensus_client == "prysm":
                    checkpoint_args = ""
                    if checkpoint_sync_url:
                        checkpoint_args = f"--checkpoint-sync-url={checkpoint_sync_url} --genesis-beacon-api-url={checkpoint_sync_url}"
                    cons_entrypoint = [
                        "sh", "-c",
                        f"echo '{jwt_secret}' > /tmp/jwt.hex && exec /app/cmd/beacon-chain/beacon-chain "
                        f"--{network} "
                        f"--execution-endpoint=http://{exec_name}:8551 "
                        "--jwt-secret=/tmp/jwt.hex "
                        "--grpc-gateway-host=0.0.0.0 --grpc-gateway-port=5052 "
                        "--accept-terms-of-use "
                        f"{checkpoint_args}"
                    ]

                if cons_entrypoint:
                    cons_container = client.containers.run(
                        cons_image,
                        entrypoint=cons_entrypoint,
                        name=cons_name,
                        detach=True,
                        ports={
                            "5052/tcp": ports["beacon_api"],
                            "9000/tcp": ports["beacon_p2p"],
                            "9000/udp": ports["beacon_p2p"],
                        },
                        volumes={
                            f"bootnode-beacon-{node_id[:8]}": {"bind": "/root/.lighthouse", "mode": "rw"},
                        },
                        network=network_name,
                        restart_policy={"Name": "unless-stopped"},
                        labels={
                            "bootnode.managed": "true",
                            "bootnode.chain": chain,
                            "bootnode.network": network,
                            "bootnode.node_id": node_id,
                            "bootnode.role": "consensus",
                            "bootnode.consensus_client": consensus_client,
                        },
                    )
                    containers_created.append(cons_container)

                    _nodes[node_id]["consensus_container_id"] = cons_container.id[:12]
                    _nodes[node_id]["beacon_api"] = f"http://localhost:{ports['beacon_api']}"
                    _nodes[node_id]["consensus_client"] = consensus_client

            # ---- VALIDATOR CLIENT (for staking) ----
            if node.get("enable_validator") and consensus_client:
                validator_images = chain_images.get("validator", {})
                validator_image = validator_images.get(consensus_client)
                validator_name = f"bootnode-{chain}-{network}-validator-{node_id[:8]}"

                if validator_image:
                    try:
                        client.images.get(validator_image)
                    except docker.errors.ImageNotFound:
                        client.images.pull(validator_image)

                    # Validator needs keys - mount from configured path or use default
                    keys_path = node.get("validator_keys_path") or f"/tmp/bootnode-keys-{node_id[:8]}"

                    if consensus_client == "lighthouse":
                        validator_entrypoint = [
                            "sh", "-c",
                            f"lighthouse vc "
                            f"--network={network} "
                            f"--beacon-nodes=http://{cons_name}:5052 "
                            "--http --http-address=0.0.0.0 --http-port=5062 "
                            "--unencrypted-http-transport "
                            "--suggested-fee-recipient=0x0000000000000000000000000000000000000000 "
                        ]
                    elif consensus_client == "prysm":
                        validator_entrypoint = [
                            "sh", "-c",
                            f"/app/cmd/validator/validator "
                            f"--{network} "
                            f"--beacon-rpc-provider={cons_name}:4000 "
                            "--grpc-gateway-host=0.0.0.0 --grpc-gateway-port=5062 "
                            "--accept-terms-of-use "
                        ]
                    else:
                        validator_entrypoint = None

                    if validator_entrypoint:
                        validator_container = client.containers.run(
                            validator_image,
                            entrypoint=validator_entrypoint,
                            name=validator_name,
                            detach=True,
                            ports={
                                "5062/tcp": 5062 + (ports["rpc"] - 8545),
                            },
                            volumes={
                                f"bootnode-validator-{node_id[:8]}": {"bind": "/root/.lighthouse/validators", "mode": "rw"},
                            },
                            network=network_name,
                            restart_policy={"Name": "unless-stopped"},
                            labels={
                                "bootnode.managed": "true",
                                "bootnode.chain": chain,
                                "bootnode.network": network,
                                "bootnode.node_id": node_id,
                                "bootnode.role": "validator",
                            },
                        )
                        containers_created.append(validator_container)
                        _nodes[node_id]["validator_container_id"] = validator_container.id[:12]
                        _nodes[node_id]["validator_api"] = f"http://localhost:{5062 + (ports['rpc'] - 8545)}"

            # ---- MEV-BOOST (optional) ----
            if enable_mev and consensus_client:
                mev_images = chain_images.get("mev", {})
                mev_image = mev_images.get("mev-boost")
                if mev_image:
                    mev_name = f"bootnode-{chain}-{network}-mev-{node_id[:8]}"
                    try:
                        client.images.get(mev_image)
                    except docker.errors.ImageNotFound:
                        client.images.pull(mev_image)

                    # Default MEV relays
                    relays = node.get("mev_relays") or [
                        "https://0xac6e77dfe25ecd6110b8e780608cce0dab71fdd5ebea22a16c0205200f2f8e2e3ad3b71d3499c54ad14d6c21b41a37ae@boost-relay.flashbots.net",
                    ]
                    if network == "sepolia":
                        relays = ["https://0x845bd072b7cd566f02faeb0a4033ce9399e42839ced64e8b2adcfc859ed1e8e1a5a293336a49feac6d9a5edb779be53a@boost-relay-sepolia.flashbots.net"]

                    mev_cmd = [
                        "-addr=0.0.0.0:18550",
                        f"-{network}",
                        "-relay-check",
                        "-relays=" + ",".join(relays),
                    ]

                    mev_container = client.containers.run(
                        mev_image,
                        command=mev_cmd,
                        name=mev_name,
                        detach=True,
                        ports={"18550/tcp": 18550 + (allocated["rpc"] - 8545)},
                        network=network_name,
                        restart_policy={"Name": "unless-stopped"},
                        labels={
                            "bootnode.managed": "true",
                            "bootnode.chain": chain,
                            "bootnode.network": network,
                            "bootnode.node_id": node_id,
                            "bootnode.role": "mev-boost",
                        },
                    )
                    containers_created.append(mev_container)
                    _nodes[node_id]["mev_enabled"] = True

            _nodes[node_id]["container_id"] = exec_container.id[:12]
            _nodes[node_id]["containers"] = [c.id[:12] for c in containers_created]

        # ============ LUX ECOSYSTEM (Lux, Zoo, Pars, Hanzo) ============
        elif chain in ["lux", "zoo", "pars", "hanzo"]:
            exec_images = chain_images.get("execution", {})
            image = exec_images.get("luxd", "luxfi/luxd:latest")

            try:
                client.images.get(image)
            except docker.errors.ImageNotFound:
                _nodes[node_id]["status"] = "pulling"
                client.images.pull(image)

            container_name = f"bootnode-{chain}-{network}-{node_id[:8]}"
            try:
                old = client.containers.get(container_name)
                old.remove(force=True)
            except:
                pass

            # Configure luxd based on network
            lux_network_id = "mainnet" if network == "mainnet" else "fuji" if network == "testnet" else "local"

            # For local development, use special config
            if network == "local":
                lux_cmd = [
                    "--network-id=local",
                    "--http-host=0.0.0.0",
                    "--http-port=9650",
                    "--staking-enabled=false",
                    "--db-type=memdb",
                ]
            else:
                lux_cmd = [
                    f"--network-id={lux_network_id}",
                    "--http-host=0.0.0.0",
                    "--http-port=9650",
                    "--public-ip-resolution-service=opendns",
                ]

            # Add subnet-specific flags for Zoo/Pars/Hanzo
            if chain in ["zoo", "pars", "hanzo"]:
                # These would have subnet-specific configs
                lux_cmd.extend([
                    "--track-subnets=",  # Add actual subnet IDs for production
                ])

            container = client.containers.run(
                image,
                command=lux_cmd,
                name=container_name,
                detach=True,
                ports={
                    "9650/tcp": ports["rpc"],
                    "9651/tcp": ports.get("p2p", 9651 + (ports["rpc"] - 9650)),
                },
                volumes={
                    f"bootnode-data-{node_id[:8]}": {"bind": "/root/.luxd", "mode": "rw"},
                },
                network=network_name,
                restart_policy={"Name": "unless-stopped"},
                labels={
                    "bootnode.managed": "true",
                    "bootnode.chain": chain,
                    "bootnode.network": network,
                    "bootnode.node_id": node_id,
                },
            )
            containers_created.append(container)
            _nodes[node_id]["container_id"] = container.id[:12]
            _nodes[node_id]["containers"] = [container.id[:12]]

        # ============ OTHER CHAINS (simple single container) ============
        else:
            exec_images = chain_images.get("execution", chain_images)
            image = list(exec_images.values())[0] if exec_images else None

            if not image:
                raise ValueError(f"No image for {chain}")

            try:
                client.images.get(image)
            except docker.errors.ImageNotFound:
                _nodes[node_id]["status"] = "pulling"
                client.images.pull(image)

            container_name = f"bootnode-{chain}-{network}-{node_id[:8]}"
            try:
                old = client.containers.get(container_name)
                old.remove(force=True)
            except:
                pass

            # Get chain-specific ports
            chain_port_config = CHAIN_PORTS.get(chain, {"rpc": 8545, "ws": 8546})

            container = client.containers.run(
                image,
                name=container_name,
                detach=True,
                ports={
                    f"{chain_port_config['rpc']}/tcp": ports["rpc"],
                    f"{chain_port_config.get('ws', chain_port_config['rpc'])}/tcp": ports["ws"],
                },
                volumes={
                    f"bootnode-data-{node_id[:8]}": {"bind": "/data", "mode": "rw"},
                },
                network=network_name,
                restart_policy={"Name": "unless-stopped"},
                labels={
                    "bootnode.managed": "true",
                    "bootnode.chain": chain,
                    "bootnode.network": network,
                    "bootnode.node_id": node_id,
                },
            )
            containers_created.append(container)
            _nodes[node_id]["container_id"] = container.id[:12]
            _nodes[node_id]["containers"] = [container.id[:12]]

        _nodes[node_id]["status"] = "running"
        _nodes[node_id]["endpoint"] = f"http://localhost:{ports['rpc']}"
        _nodes[node_id]["ws_endpoint"] = f"ws://localhost:{ports['ws']}"

    except Exception as e:
        _nodes[node_id]["status"] = "error"
        _nodes[node_id]["error"] = str(e)
        # Cleanup on error
        for c in containers_created:
            try:
                c.remove(force=True)
            except:
                pass


@router.get("/", response_model=List[NodeResponse])
async def list_nodes():
    """List all managed blockchain nodes"""
    client = get_docker_client()
    nodes = list(_nodes.values())

    # Also check for any bootnode-managed containers not in memory
    if client:
        try:
            containers = client.containers.list(
                all=True,
                filters={"label": "bootnode.managed=true"}
            )
            for c in containers:
                node_id = c.labels.get("bootnode.node_id")
                if node_id and node_id not in _nodes:
                    # Extract RPC and WS ports from container bindings
                    endpoint = None
                    ws_endpoint = None
                    ports = c.attrs.get("NetworkSettings", {}).get("Ports", {}) or {}
                    # Look for 8545/tcp (standard RPC port)
                    rpc_bindings = ports.get("8545/tcp") or []
                    if rpc_bindings:
                        host_port = rpc_bindings[0].get("HostPort")
                        if host_port:
                            endpoint = f"http://localhost:{host_port}"
                    # Look for 8546/tcp (standard WS port)
                    ws_bindings = ports.get("8546/tcp") or []
                    if ws_bindings:
                        ws_port = ws_bindings[0].get("HostPort")
                        if ws_port:
                            ws_endpoint = f"ws://localhost:{ws_port}"

                    _nodes[node_id] = {
                        "id": node_id,
                        "name": c.name,
                        "chain": c.labels.get("bootnode.chain", "unknown"),
                        "network": c.labels.get("bootnode.network", "unknown"),
                        "provider": "docker",
                        "status": c.status,
                        "container_id": c.id[:12],
                        "endpoint": endpoint,
                        "ws_endpoint": ws_endpoint,
                        "created_at": c.attrs.get("Created", datetime.now().isoformat()),
                        "metrics": {},
                    }
                    nodes.append(_nodes[node_id])
        except Exception as e:
            pass  # Docker not available or error

    return nodes


@router.get("/presets")
async def list_presets():
    """List available node presets for simple mode"""
    return {
        "presets": NODE_PRESETS,
        "description": "Use preset='<name>' with mode='simple' for quick deployment"
    }


@router.get("/staking")
async def get_staking_data():
    """Get comprehensive staking rewards and market data from pricing.lux.network"""
    import httpx
    import time

    # Get pricing API URL from environment
    pricing_api_url = os.environ.get("PRICING_API_URL", "https://pricing.lux.network")
    coingecko_api_key = os.environ.get("COINGECKO_API_KEY", "")

    staking_list = []

    async with httpx.AsyncClient(timeout=30) as client:
        try:
            # Try the enhanced markets endpoint from pricing.lux.network
            headers = {"x-cg-demo-api-key": coingecko_api_key} if coingecko_api_key else {}

            markets_res = await client.get(
                f"{pricing_api_url}/v1/markets",
                headers=headers,
            )

            if markets_res.status_code == 200:
                data = markets_res.json()
                assets = data.get("assets", [])

                for asset in assets:
                    chain = asset.get("id", "").replace("-", "_")
                    chain_info = CHAIN_IMAGES.get(chain, {})
                    staking = asset.get("staking") or {}

                    staking_list.append({
                        "chain": chain,
                        "name": asset.get("name", ""),
                        "symbol": asset.get("symbol", ""),
                        "image": asset.get("image", ""),
                        "price": asset.get("price", 0),
                        "price_change_24h": asset.get("price_change_24h", 0),
                        "price_change_7d": asset.get("price_change_7d", 0),
                        "market_cap": asset.get("market_cap", 0),
                        "market_cap_rank": asset.get("market_cap_rank", 0),
                        "volume_24h": asset.get("volume_24h", 0),
                        "circulating_supply": asset.get("circulating_supply", 0),
                        "ath": asset.get("ath", 0),
                        "ath_change_percentage": asset.get("ath_change_percentage", 0),
                        # Staking data
                        "apy": staking.get("apy", 0),
                        "apy_change_7d": staking.get("apy_change_7d", 0),
                        "staking_ratio": staking.get("staking_ratio", 0),
                        "staked_tokens": staking.get("staked_tokens", 0),
                        "staked_tokens_change_7d": staking.get("staked_tokens_change_7d", 0),
                        "tvl": staking.get("tvl", 0),
                        "tvl_change_7d": staking.get("tvl_change_7d", 0),
                        "validator_fee": staking.get("validator_fee", 0),
                        "min_stake": staking.get("min_stake", 0),
                        "unbonding_days": staking.get("unbonding_days", 0),
                        # Score
                        "score": asset.get("score", 0),
                        "score_breakdown": asset.get("score_breakdown", {}),
                        # Bootnode support info
                        "supported": chain in CHAIN_IMAGES,
                        "has_execution_client": "execution" in chain_info,
                        "has_consensus_client": "consensus" in chain_info,
                        "has_validator": "validator" in chain_info,
                        "has_mev": "mev" in chain_info,
                    })

                return {
                    "chains": staking_list,
                    "total_chains": len(staking_list),
                    "high_yield_chains": [c for c in staking_list if c.get("apy", 0) >= 10],
                    "timestamp": int(time.time()),
                    "source": "pricing.lux.network",
                }

        except Exception as e:
            pass  # Fall through to fallback

    # Fallback: Direct CoinGecko query with staking data merge
    COINGECKO_IDS = {
        "ethereum": "ethereum", "solana": "solana", "bsc": "binancecoin",
        "cardano": "cardano", "avalanche": "avalanche-2", "polkadot": "polkadot",
        "polygon": "matic-network", "cosmos": "cosmos", "near": "near",
        "aptos": "aptos", "sui": "sui", "celestia": "celestia",
        "injective": "injective-protocol", "sei": "sei-network",
        "ton": "the-open-network", "hedera": "hedera-hashgraph",
        "tron": "tron", "bittensor": "bittensor", "tezos": "tezos",
        "algorand": "algorand", "filecoin": "filecoin", "fantom": "fantom",
        "cronos": "crypto-com-chain", "moonbeam": "moonbeam", "harmony": "harmony",
        "kava": "kava", "osmosis": "osmosis", "secret": "secret",
        "akash": "akash-network", "starknet": "starknet", "dydx": "dydx-chain",
        "axelar": "axelar", "band": "band-protocol", "livepeer": "livepeer",
        "radix": "radix", "waves": "waves", "casper": "casper-network",
        "multiversx": "elrond-erd-2", "iota": "iota", "stacks": "blockstack",
        "fetch": "fetch-ai", "zetachain": "zetachain", "skale": "skale",
        "bitcoin": "bitcoin", "xrpl": "ripple", "arbitrum": "arbitrum",
        "optimism": "optimism", "gnosis": "gnosis",
    }

    async with httpx.AsyncClient(timeout=30) as client:
        try:
            coin_ids = ",".join(COINGECKO_IDS.values())
            headers = {"x-cg-demo-api-key": coingecko_api_key} if coingecko_api_key else {}

            market_res = await client.get(
                "https://api.coingecko.com/api/v3/coins/markets",
                params={
                    "vs_currency": "usd",
                    "ids": coin_ids,
                    "order": "market_cap_desc",
                    "per_page": 250,
                    "page": 1,
                    "sparkline": False,
                    "price_change_percentage": "7d",
                },
                headers=headers,
            )

            if market_res.status_code == 200:
                for coin in market_res.json():
                    chain = None
                    for c, cg_id in COINGECKO_IDS.items():
                        if cg_id == coin.get("id"):
                            chain = c
                            break

                    if not chain:
                        continue

                    chain_info = CHAIN_IMAGES.get(chain, {})
                    fallback = STAKING_DATA.get(chain, {})
                    staking_ratio = fallback.get("staking_ratio", 30)
                    market_cap = coin.get("market_cap", 0) or 0
                    price = coin.get("current_price", 0) or 0
                    circ_supply = coin.get("circulating_supply", 0) or 0

                    staking_list.append({
                        "chain": chain,
                        "name": coin.get("name", ""),
                        "symbol": coin.get("symbol", "").upper(),
                        "image": coin.get("image", ""),
                        "price": price,
                        "price_change_24h": coin.get("price_change_percentage_24h", 0),
                        "price_change_7d": coin.get("price_change_percentage_7d_in_currency", 0),
                        "market_cap": market_cap,
                        "market_cap_rank": coin.get("market_cap_rank", 0),
                        "volume_24h": coin.get("total_volume", 0),
                        "circulating_supply": circ_supply,
                        "ath": coin.get("ath", 0),
                        "ath_change_percentage": coin.get("ath_change_percentage", 0),
                        # Staking data from fallback
                        "apy": fallback.get("apy", 0),
                        "staking_ratio": staking_ratio,
                        "staked_tokens": circ_supply * (staking_ratio / 100),
                        "tvl": market_cap * (staking_ratio / 100),
                        "validator_fee": fallback.get("validator_fee", 0),
                        # Bootnode support
                        "supported": chain in CHAIN_IMAGES,
                        "has_execution_client": "execution" in chain_info,
                        "has_consensus_client": "consensus" in chain_info,
                        "has_validator": "validator" in chain_info,
                        "has_mev": "mev" in chain_info,
                    })

        except Exception:
            pass

    # Sort by market cap
    staking_list.sort(key=lambda x: x.get("market_cap", 0), reverse=True)

    return {
        "chains": staking_list,
        "total_chains": len(staking_list),
        "high_yield_chains": [c for c in staking_list if c.get("apy", 0) >= 10],
        "timestamp": int(time.time()),
        "source": "coingecko_fallback",
    }


@router.get("/supported-chains")
async def get_supported_chains():
    """Get list of all supported blockchain chains for node deployment"""
    chains = []
    for chain, images in CHAIN_IMAGES.items():
        ports = CHAIN_PORTS.get(chain, {"rpc": 8545})
        staking = STAKING_DATA.get(chain, {})
        chains.append({
            "chain": chain,
            "name": chain.replace("_", " ").title(),
            "execution_clients": list(images.get("execution", {}).keys()),
            "consensus_clients": list(images.get("consensus", {}).keys()) if "consensus" in images else [],
            "has_mev": "mev" in images,
            "has_validator": "validator" in images,
            "ports": ports,
            "staking_apy": staking.get("apy"),
            "staking_market_cap": staking.get("staking_mc"),
        })
    return {"chains": chains, "total": len(chains)}


@router.post("/", response_model=NodeResponse)
async def create_node(node: NodeCreate, background_tasks: BackgroundTasks):
    """Deploy a new blockchain node.

    Simple mode: Set mode='simple' and preset='full|staking|archive|rpc'
    Advanced mode: Set mode='advanced' and configure individual options
    """
    node_id = str(uuid.uuid4())

    # Apply preset if using simple mode
    execution_client = node.execution_client
    consensus_client = node.consensus_client
    sync_mode = node.sync_mode
    enable_mev = node.enable_mev
    enable_validator = node.enable_validator
    fee_recipient = node.fee_recipient

    if node.mode == "simple" and node.preset:
        preset = NODE_PRESETS.get(node.preset)
        if preset:
            execution_client = preset.get("execution_client", "geth")
            consensus_client = preset.get("consensus_client")
            sync_mode = preset.get("sync_mode", "snap")
            enable_mev = preset.get("enable_mev", False)
            enable_validator = preset.get("enable_validator", False)

    new_node = {
        "id": node_id,
        "name": node.name,
        "chain": node.chain.lower(),
        "network": node.network.lower(),
        "provider": node.provider,
        "mode": node.mode,
        "preset": node.preset,
        "execution_client": execution_client,
        "consensus_client": consensus_client,
        "sync_mode": sync_mode,
        "enable_mev": enable_mev,
        "mev_relays": node.mev_relays,
        "enable_validator": enable_validator,
        "fee_recipient": fee_recipient or "0x0000000000000000000000000000000000000000",
        "status": "starting",
        "endpoint": None,
        "ws_endpoint": None,
        "beacon_api": None,
        "validator_api": None,
        "container_id": None,
        "consensus_container_id": None,
        "validator_container_id": None,
        "containers": [],
        "mev_enabled": False,
        "created_at": datetime.now().isoformat(),
        "last_health_check": None,
        "metrics": {},
        "error": None,
    }

    _nodes[node_id] = new_node

    if node.provider == "docker":
        background_tasks.add_task(start_node_container, node_id, new_node)
    elif node.provider == "cloud":
        # Cloud/Kubernetes deployment - simplified for end users
        background_tasks.add_task(start_cloud_node, node_id, new_node)
    else:
        new_node["status"] = "error"
        new_node["error"] = f"Provider '{node.provider}' not yet implemented"

    return new_node


async def start_cloud_node(node_id: str, node: dict):
    """Deploy node to cloud/Kubernetes - abstracted for production use"""
    # This would integrate with:
    # - Kubernetes API for container orchestration
    # - Cloud provider APIs (AWS, GCP, DO) for managed resources
    # - Terraform/Pulumi for infrastructure as code

    # For now, mark as pending cloud deployment
    _nodes[node_id]["status"] = "pending_cloud"
    _nodes[node_id]["error"] = "Cloud deployment requires Kubernetes configuration. Use provider='docker' for local deployment."


# Static routes MUST come before dynamic /{node_id} routes
@router.get("/stats", response_model=NodeStats)
async def get_node_stats():
    """Get overall node statistics"""
    nodes = list(_nodes.values())

    chains: Dict[str, int] = {}
    providers: Dict[str, int] = {}
    running = 0

    for node in nodes:
        chain = node.get("chain", "unknown")
        provider = node.get("provider", "unknown")
        chains[chain] = chains.get(chain, 0) + 1
        providers[provider] = providers.get(provider, 0) + 1
        if node.get("status") == "running":
            running += 1

    return {
        "total_nodes": len(nodes),
        "running_nodes": running,
        "chains": chains,
        "providers": providers,
    }


@router.get("/metrics/all")
async def get_all_node_metrics():
    """Get metrics for all nodes"""
    import httpx
    nodes_metrics = {}

    # First ensure we have discovered all containers
    await list_nodes()

    for node_id, node in _nodes.items():
        metrics = {}
        endpoint = node.get("endpoint")

        if endpoint and node.get("status") == "running":
            internal_endpoint = endpoint.replace("localhost", "host.docker.internal")
            async with httpx.AsyncClient(timeout=5) as http_client:
                try:
                    # Get sync status
                    sync_res = await http_client.post(internal_endpoint, json={
                        "jsonrpc": "2.0", "method": "eth_syncing", "params": [], "id": 1
                    })
                    sync_data = sync_res.json().get("result", {})
                    if sync_data and isinstance(sync_data, dict):
                        current_block = int(sync_data.get("currentBlock", "0x0"), 16)
                        highest_block = int(sync_data.get("highestBlock", "0x0"), 16)
                        metrics["current_block"] = current_block
                        metrics["highest_block"] = highest_block
                        metrics["sync_progress"] = round((current_block / highest_block) * 100, 2) if highest_block > 0 else 0
                        metrics["syncing"] = True
                    else:
                        block_res = await http_client.post(internal_endpoint, json={
                            "jsonrpc": "2.0", "method": "eth_blockNumber", "params": [], "id": 2
                        })
                        block_num = int(block_res.json().get("result", "0x0"), 16)
                        metrics["current_block"] = block_num
                        metrics["sync_progress"] = 100.0
                        metrics["syncing"] = False

                    # Get peer count
                    peers_res = await http_client.post(internal_endpoint, json={
                        "jsonrpc": "2.0", "method": "net_peerCount", "params": [], "id": 3
                    })
                    metrics["peer_count"] = int(peers_res.json().get("result", "0x0"), 16)

                except Exception:
                    pass

        nodes_metrics[node_id] = metrics

    return nodes_metrics


@router.get("/docker/status")
async def docker_status():
    """Check if Docker is available"""
    client = get_docker_client()
    if not client:
        return {"available": False, "error": "Docker not found"}

    try:
        info = client.info()
        return {
            "available": True,
            "version": info.get("ServerVersion"),
            "containers": info.get("Containers"),
            "running": info.get("ContainersRunning"),
            "images": info.get("Images"),
        }
    except Exception as e:
        return {"available": False, "error": str(e)}


@router.get("/{node_id}", response_model=NodeResponse)
async def get_node(node_id: str):
    """Get details of a specific node"""
    if node_id not in _nodes:
        raise HTTPException(status_code=404, detail="Node not found")

    node = _nodes[node_id]
    metrics = {}

    # Update status from Docker if container exists
    if node.get("container_id"):
        client = get_docker_client()
        if client:
            try:
                container = client.containers.get(node["container_id"])
                node["status"] = container.status

                # Get container stats
                stats = container.stats(stream=False)
                cpu_delta = stats["cpu_stats"]["cpu_usage"]["total_usage"] - \
                            stats["precpu_stats"]["cpu_usage"]["total_usage"]
                system_delta = stats["cpu_stats"]["system_cpu_usage"] - \
                               stats["precpu_stats"]["system_cpu_usage"]
                cpu_percent = (cpu_delta / system_delta) * 100 if system_delta > 0 else 0

                memory_usage = stats["memory_stats"].get("usage", 0)
                memory_limit = stats["memory_stats"].get("limit", 1)
                memory_percent = (memory_usage / memory_limit) * 100

                # Network I/O
                networks = stats.get("networks", {})
                total_rx = sum(n.get("rx_bytes", 0) for n in networks.values())
                total_tx = sum(n.get("tx_bytes", 0) for n in networks.values())

                # Disk usage (from container filesystem)
                disk_usage = 0
                try:
                    # Get container size
                    container.reload()
                    size_rw = container.attrs.get("SizeRw", 0) or 0
                    disk_usage = size_rw / (1024**3)  # Convert to GB
                except:
                    pass

                metrics.update({
                    "cpu_usage": round(cpu_percent, 2),
                    "memory_usage": round(memory_usage / (1024**3), 2),  # GB
                    "memory_percent": round(memory_percent, 2),
                    "disk_usage": round(disk_usage, 2),  # GB
                    "network_rx": round(total_rx / (1024**2), 2),  # MB
                    "network_tx": round(total_tx / (1024**2), 2),  # MB
                })
                node["last_health_check"] = datetime.now().isoformat()
            except Exception as e:
                node["error"] = str(e)

    # Query RPC for sync status if endpoint available
    endpoint = node.get("endpoint")
    if endpoint and node.get("status") == "running":
        import httpx
        internal_endpoint = endpoint.replace("localhost", "host.docker.internal")
        async with httpx.AsyncClient(timeout=5) as http_client:
            try:
                # Get sync status
                sync_res = await http_client.post(internal_endpoint, json={
                    "jsonrpc": "2.0", "method": "eth_syncing", "params": [], "id": 1
                })
                sync_data = sync_res.json().get("result", {})
                if sync_data and isinstance(sync_data, dict):
                    current_block = int(sync_data.get("currentBlock", "0x0"), 16)
                    highest_block = int(sync_data.get("highestBlock", "0x0"), 16)
                    metrics.update({
                        "current_block": current_block,
                        "highest_block": highest_block,
                        "sync_progress": round((current_block / highest_block) * 100, 2) if highest_block > 0 else 0,
                        "syncing": True,
                    })
                else:
                    # Not syncing - get block number
                    block_res = await http_client.post(internal_endpoint, json={
                        "jsonrpc": "2.0", "method": "eth_blockNumber", "params": [], "id": 2
                    })
                    block_num = int(block_res.json().get("result", "0x0"), 16)
                    metrics.update({
                        "current_block": block_num,
                        "highest_block": block_num,
                        "sync_progress": 100.0,
                        "syncing": False,
                    })

                # Get peer count
                peers_res = await http_client.post(internal_endpoint, json={
                    "jsonrpc": "2.0", "method": "net_peerCount", "params": [], "id": 3
                })
                peer_count = int(peers_res.json().get("result", "0x0"), 16)
                metrics["peer_count"] = peer_count

                # Get chain ID
                chain_res = await http_client.post(internal_endpoint, json={
                    "jsonrpc": "2.0", "method": "eth_chainId", "params": [], "id": 4
                })
                chain_id = int(chain_res.json().get("result", "0x0"), 16)
                metrics["chain_id"] = chain_id

            except Exception as e:
                metrics["rpc_error"] = str(e)

    node["metrics"] = metrics
    return node


@router.delete("/{node_id}")
async def delete_node(node_id: str):
    """Stop and remove a node and all its containers"""
    if node_id not in _nodes:
        raise HTTPException(status_code=404, detail="Node not found")

    node = _nodes[node_id]
    client = get_docker_client()

    if client:
        # Remove all associated containers
        containers_to_remove = node.get("containers", [])
        if node.get("container_id"):
            containers_to_remove.append(node["container_id"])
        if node.get("consensus_container_id"):
            containers_to_remove.append(node["consensus_container_id"])

        for cid in set(containers_to_remove):
            try:
                container = client.containers.get(cid)
                container.stop(timeout=10)
                container.remove()
            except Exception:
                pass

        # Remove network
        try:
            network = client.networks.get(f"bootnode-{node_id[:8]}")
            network.remove()
        except Exception:
            pass

        # Remove volumes
        for vol_name in [f"bootnode-data-{node_id[:8]}", f"bootnode-beacon-{node_id[:8]}", f"bootnode-jwt-{node_id[:8]}"]:
            try:
                vol = client.volumes.get(vol_name)
                vol.remove()
            except Exception:
                pass

        # Remove JWT file
        try:
            os.remove(f"/tmp/bootnode-jwt-{node_id[:8]}.hex")
        except Exception:
            pass

    del _nodes[node_id]
    return {"status": "deleted", "id": node_id}


@router.post("/{node_id}/start")
async def start_node(node_id: str):
    """Start a stopped node"""
    if node_id not in _nodes:
        raise HTTPException(status_code=404, detail="Node not found")

    node = _nodes[node_id]

    if node.get("container_id"):
        client = get_docker_client()
        if client:
            try:
                container = client.containers.get(node["container_id"])
                container.start()
                node["status"] = "running"
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))

    return node


@router.post("/{node_id}/stop")
async def stop_node(node_id: str):
    """Stop a running node"""
    if node_id not in _nodes:
        raise HTTPException(status_code=404, detail="Node not found")

    node = _nodes[node_id]

    if node.get("container_id"):
        client = get_docker_client()
        if client:
            try:
                container = client.containers.get(node["container_id"])
                container.stop(timeout=10)
                node["status"] = "stopped"
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))

    return node


@router.post("/{node_id}/rpc")
async def proxy_rpc_call(node_id: str, payload: dict):
    """Proxy RPC calls to the specified node"""
    if node_id not in _nodes:
        raise HTTPException(status_code=404, detail="Node not found")

    node = _nodes[node_id]
    endpoint = node.get("endpoint")

    if not endpoint:
        raise HTTPException(status_code=400, detail="Node has no endpoint")

    # For internal API-to-node communication, use host.docker.internal
    # The stored endpoint uses localhost for browser access
    internal_endpoint = endpoint.replace("localhost", "host.docker.internal")

    import httpx
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(internal_endpoint, json=payload, timeout=30)
            return response.json()
        except Exception as e:
            raise HTTPException(status_code=502, detail=str(e))
