#!/bin/bash
echo "🛑 Stopping Bootnode Platform..."
docker compose down
if [ -f /tmp/bootnode-web.pid ]; then
    kill $(cat /tmp/bootnode-web.pid) 2>/dev/null || true
    rm -f /tmp/bootnode-web.pid
fi
rm -f /tmp/bootnode-web.log
echo "✅ All services stopped"
