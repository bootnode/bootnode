"""Analytics Engine with ClickHouse - Time-series analytics for blockchain data.

Provides:
- Chain metrics and statistics
- Historical price/volume data
- DeFi protocol analytics
- User activity analytics
- Real-time dashboards
"""

from dataclasses import dataclass
from datetime import datetime, date, timedelta
from typing import Any

import structlog

from bootnode.core.datastore.client import DataStoreClient, get_datastore

logger = structlog.get_logger()


@dataclass
class TimeSeriesPoint:
    """Single point in time series."""
    timestamp: datetime
    value: float
    metadata: dict | None = None


@dataclass
class TimeSeriesData:
    """Time series data response."""
    points: list[TimeSeriesPoint]
    chain: str
    network: str
    metric: str
    interval: str
    took_ms: float


@dataclass
class AggregateMetric:
    """Aggregated metric."""
    name: str
    value: float
    change_24h: float | None = None
    change_7d: float | None = None


class AnalyticsEngine:
    """ClickHouse analytics engine for blockchain metrics."""

    def __init__(self, datastore: DataStoreClient | None = None) -> None:
        self.datastore = datastore or get_datastore()

    # =========================================================================
    # Chain Metrics
    # =========================================================================

    async def get_chain_metrics(
        self,
        chain: str,
        network: str,
    ) -> dict[str, AggregateMetric]:
        """Get current metrics for a chain."""
        start = datetime.now()

        # Query latest metrics from ClickHouse
        query = """
            SELECT
                metric_name,
                metric_value,
                timestamp
            FROM chain_metrics
            WHERE chain = {chain:String}
              AND network = {network:String}
              AND timestamp >= now() - INTERVAL 1 DAY
            ORDER BY timestamp DESC
            LIMIT 100
        """

        try:
            result = await self.datastore.query(
                query,
                params={"chain": chain, "network": network},
            )

            metrics = {}
            for row in result:
                name = row["metric_name"]
                if name not in metrics:
                    metrics[name] = AggregateMetric(
                        name=name,
                        value=row["metric_value"],
                    )

            return metrics
        except Exception as e:
            logger.warning("Failed to get chain metrics", error=str(e))
            return {}

    async def get_block_time_history(
        self,
        chain: str,
        network: str,
        days: int = 7,
        interval: str = "1h",
    ) -> TimeSeriesData:
        """Get historical block time data."""
        start = datetime.now()

        # Interval to ClickHouse format
        ch_interval = {
            "1m": "toStartOfMinute",
            "5m": "toStartOfFiveMinutes",
            "15m": "toStartOfFifteenMinutes",
            "1h": "toStartOfHour",
            "1d": "toStartOfDay",
        }.get(interval, "toStartOfHour")

        query = f"""
            SELECT
                {ch_interval}(timestamp) as ts,
                avg(block_time) as avg_block_time
            FROM blocks
            WHERE chain = {{chain:String}}
              AND network = {{network:String}}
              AND timestamp >= now() - INTERVAL {{days:Int32}} DAY
            GROUP BY ts
            ORDER BY ts
        """

        try:
            result = await self.datastore.query(
                query,
                params={"chain": chain, "network": network, "days": days},
            )

            points = [
                TimeSeriesPoint(
                    timestamp=row["ts"],
                    value=row["avg_block_time"],
                )
                for row in result
            ]

            return TimeSeriesData(
                points=points,
                chain=chain,
                network=network,
                metric="block_time",
                interval=interval,
                took_ms=(datetime.now() - start).total_seconds() * 1000,
            )
        except Exception as e:
            logger.warning("Failed to get block time history", error=str(e))
            return TimeSeriesData(
                points=[],
                chain=chain,
                network=network,
                metric="block_time",
                interval=interval,
                took_ms=(datetime.now() - start).total_seconds() * 1000,
            )

    async def get_transaction_volume(
        self,
        chain: str,
        network: str,
        days: int = 30,
        interval: str = "1d",
    ) -> TimeSeriesData:
        """Get historical transaction volume."""
        start = datetime.now()

        ch_interval = {
            "1h": "toStartOfHour",
            "1d": "toStartOfDay",
            "1w": "toStartOfWeek",
        }.get(interval, "toStartOfDay")

        query = f"""
            SELECT
                {ch_interval}(timestamp) as ts,
                count() as tx_count,
                sum(value) as total_value,
                sum(gas_used * gas_price) as total_fees
            FROM transactions
            WHERE chain = {{chain:String}}
              AND network = {{network:String}}
              AND timestamp >= now() - INTERVAL {{days:Int32}} DAY
            GROUP BY ts
            ORDER BY ts
        """

        try:
            result = await self.datastore.query(
                query,
                params={"chain": chain, "network": network, "days": days},
            )

            points = [
                TimeSeriesPoint(
                    timestamp=row["ts"],
                    value=row["tx_count"],
                    metadata={
                        "total_value": row["total_value"],
                        "total_fees": row["total_fees"],
                    },
                )
                for row in result
            ]

            return TimeSeriesData(
                points=points,
                chain=chain,
                network=network,
                metric="transaction_volume",
                interval=interval,
                took_ms=(datetime.now() - start).total_seconds() * 1000,
            )
        except Exception as e:
            logger.warning("Failed to get tx volume", error=str(e))
            return TimeSeriesData(
                points=[],
                chain=chain,
                network=network,
                metric="transaction_volume",
                interval=interval,
                took_ms=(datetime.now() - start).total_seconds() * 1000,
            )

    async def get_gas_price_history(
        self,
        chain: str,
        network: str,
        hours: int = 24,
    ) -> TimeSeriesData:
        """Get gas price history."""
        start = datetime.now()

        query = """
            SELECT
                toStartOfFiveMinutes(timestamp) as ts,
                avg(gas_price) as avg_gas,
                min(gas_price) as min_gas,
                max(gas_price) as max_gas,
                quantile(0.5)(gas_price) as median_gas
            FROM transactions
            WHERE chain = {chain:String}
              AND network = {network:String}
              AND timestamp >= now() - INTERVAL {hours:Int32} HOUR
            GROUP BY ts
            ORDER BY ts
        """

        try:
            result = await self.datastore.query(
                query,
                params={"chain": chain, "network": network, "hours": hours},
            )

            points = [
                TimeSeriesPoint(
                    timestamp=row["ts"],
                    value=row["avg_gas"],
                    metadata={
                        "min": row["min_gas"],
                        "max": row["max_gas"],
                        "median": row["median_gas"],
                    },
                )
                for row in result
            ]

            return TimeSeriesData(
                points=points,
                chain=chain,
                network=network,
                metric="gas_price",
                interval="5m",
                took_ms=(datetime.now() - start).total_seconds() * 1000,
            )
        except Exception as e:
            logger.warning("Failed to get gas price history", error=str(e))
            return TimeSeriesData(
                points=[],
                chain=chain,
                network=network,
                metric="gas_price",
                interval="5m",
                took_ms=(datetime.now() - start).total_seconds() * 1000,
            )

    # =========================================================================
    # Token Analytics
    # =========================================================================

    async def get_token_transfers(
        self,
        chain: str,
        network: str,
        token_address: str,
        days: int = 7,
    ) -> TimeSeriesData:
        """Get token transfer volume over time."""
        start = datetime.now()

        query = """
            SELECT
                toStartOfHour(timestamp) as ts,
                count() as transfer_count,
                countDistinct(from_address) as unique_senders,
                countDistinct(to_address) as unique_receivers,
                sum(value) as total_value
            FROM token_transfers
            WHERE chain = {chain:String}
              AND network = {network:String}
              AND token_address = {token:String}
              AND timestamp >= now() - INTERVAL {days:Int32} DAY
            GROUP BY ts
            ORDER BY ts
        """

        try:
            result = await self.datastore.query(
                query,
                params={
                    "chain": chain,
                    "network": network,
                    "token": token_address.lower(),
                    "days": days,
                },
            )

            points = [
                TimeSeriesPoint(
                    timestamp=row["ts"],
                    value=row["transfer_count"],
                    metadata={
                        "unique_senders": row["unique_senders"],
                        "unique_receivers": row["unique_receivers"],
                        "total_value": row["total_value"],
                    },
                )
                for row in result
            ]

            return TimeSeriesData(
                points=points,
                chain=chain,
                network=network,
                metric=f"token_transfers:{token_address}",
                interval="1h",
                took_ms=(datetime.now() - start).total_seconds() * 1000,
            )
        except Exception as e:
            logger.warning("Failed to get token transfers", error=str(e))
            return TimeSeriesData(
                points=[],
                chain=chain,
                network=network,
                metric=f"token_transfers:{token_address}",
                interval="1h",
                took_ms=(datetime.now() - start).total_seconds() * 1000,
            )

    async def get_top_tokens(
        self,
        chain: str,
        network: str,
        metric: str = "transfers",
        limit: int = 50,
    ) -> list[dict]:
        """Get top tokens by specified metric."""
        order_by = {
            "transfers": "transfer_count",
            "holders": "holder_count",
            "volume": "total_volume",
        }.get(metric, "transfer_count")

        query = f"""
            SELECT
                token_address,
                token_name,
                token_symbol,
                count() as transfer_count,
                countDistinct(from_address) + countDistinct(to_address) as holder_count,
                sum(value) as total_volume
            FROM token_transfers
            WHERE chain = {{chain:String}}
              AND network = {{network:String}}
              AND timestamp >= now() - INTERVAL 7 DAY
            GROUP BY token_address, token_name, token_symbol
            ORDER BY {order_by} DESC
            LIMIT {{limit:Int32}}
        """

        try:
            result = await self.datastore.query(
                query,
                params={"chain": chain, "network": network, "limit": limit},
            )
            return list(result)
        except Exception as e:
            logger.warning("Failed to get top tokens", error=str(e))
            return []

    # =========================================================================
    # DeFi Analytics
    # =========================================================================

    async def get_defi_tvl(
        self,
        chain: str,
        network: str,
        protocol: str | None = None,
        days: int = 30,
    ) -> TimeSeriesData:
        """Get DeFi TVL (Total Value Locked) over time."""
        start = datetime.now()

        protocol_filter = "AND protocol = {protocol:String}" if protocol else ""

        query = f"""
            SELECT
                toStartOfDay(timestamp) as ts,
                sum(tvl_usd) as total_tvl
            FROM defi_tvl
            WHERE chain = {{chain:String}}
              AND network = {{network:String}}
              {protocol_filter}
              AND timestamp >= now() - INTERVAL {{days:Int32}} DAY
            GROUP BY ts
            ORDER BY ts
        """

        params: dict[str, Any] = {
            "chain": chain,
            "network": network,
            "days": days,
        }
        if protocol:
            params["protocol"] = protocol

        try:
            result = await self.datastore.query(query, params=params)

            points = [
                TimeSeriesPoint(
                    timestamp=row["ts"],
                    value=row["total_tvl"],
                )
                for row in result
            ]

            return TimeSeriesData(
                points=points,
                chain=chain,
                network=network,
                metric="defi_tvl",
                interval="1d",
                took_ms=(datetime.now() - start).total_seconds() * 1000,
            )
        except Exception as e:
            logger.warning("Failed to get DeFi TVL", error=str(e))
            return TimeSeriesData(
                points=[],
                chain=chain,
                network=network,
                metric="defi_tvl",
                interval="1d",
                took_ms=(datetime.now() - start).total_seconds() * 1000,
            )

    # =========================================================================
    # Cross-Chain Analytics
    # =========================================================================

    async def get_cross_chain_summary(self) -> dict[str, Any]:
        """Get summary metrics across all chains."""
        query = """
            SELECT
                chain,
                network,
                count() as tx_count_24h,
                countDistinct(from_address) as unique_addresses_24h,
                sum(gas_used * gas_price) as total_fees_24h
            FROM transactions
            WHERE timestamp >= now() - INTERVAL 1 DAY
            GROUP BY chain, network
            ORDER BY tx_count_24h DESC
        """

        try:
            result = await self.datastore.query(query)
            return {
                "chains": list(result),
                "generated_at": datetime.now().isoformat(),
            }
        except Exception as e:
            logger.warning("Failed to get cross-chain summary", error=str(e))
            return {"chains": [], "generated_at": datetime.now().isoformat()}

    async def get_bridge_activity(
        self,
        days: int = 7,
    ) -> list[dict]:
        """Get cross-chain bridge activity."""
        query = """
            SELECT
                source_chain,
                dest_chain,
                count() as transfer_count,
                sum(amount_usd) as total_volume_usd,
                countDistinct(sender) as unique_users
            FROM bridge_transfers
            WHERE timestamp >= now() - INTERVAL {days:Int32} DAY
            GROUP BY source_chain, dest_chain
            ORDER BY total_volume_usd DESC
            LIMIT 100
        """

        try:
            result = await self.datastore.query(query, params={"days": days})
            return list(result)
        except Exception as e:
            logger.warning("Failed to get bridge activity", error=str(e))
            return []


# Global instance
_analytics_engine: AnalyticsEngine | None = None


def get_analytics_engine() -> AnalyticsEngine:
    """Get analytics engine singleton."""
    global _analytics_engine
    if _analytics_engine is None:
        _analytics_engine = AnalyticsEngine()
    return _analytics_engine
