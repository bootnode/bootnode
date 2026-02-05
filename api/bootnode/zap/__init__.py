"""ZAP - Native Cap'n Proto RPC Server for Bootnode.

This module implements native ZAP (Zero-Copy App Proto) support,
allowing agents to connect directly via `zap://bootnode:9999`.

No gateway required - this IS the ZAP server.
"""

from bootnode.zap.server import ZapServer, start_zap_server, stop_zap_server

__all__ = ["ZapServer", "start_zap_server", "stop_zap_server"]
