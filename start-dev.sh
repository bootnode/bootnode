#!/bin/bash
# Bootnode Platform - One-Command Local Development Setup
# This script starts all services required for local development

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[BOOTNODE]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    warn "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if required ports are available
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        warn "Port $1 is already in use. Please free it and try again."
        if [ "$1" = "3001" ]; then
            info "To kill existing Next.js process: pkill -f 'next dev'"
        fi
        exit 1
    fi
}

log "🚀 Starting Bootnode Platform for Local Development"
log "================================================="

# Check required ports
info "Checking port availability..."
# check_port 3001  # Web interface - might be running already
check_port 8100  # API - Docker will handle
check_port 5434  # PostgreSQL - Docker will handle
check_port 6383  # Redis - Docker will handle

# Start backend infrastructure with Docker Compose
log "🐳 Starting backend infrastructure (PostgreSQL, Redis, ClickHouse, API)..."
cd "$(dirname "$0")"
docker compose up -d

# Wait for services to be ready
log "⏳ Waiting for services to be ready..."
sleep 10

# Check if API is healthy
api_ready=false
for i in {1..30}; do
    if curl -s http://localhost:8100/health > /dev/null; then
        api_ready=true
        break
    fi
    sleep 2
    echo -n "."
done

if [ "$api_ready" = false ]; then
    warn "❌ API failed to start within 60 seconds"
    docker logs nodes-api --tail 20
    exit 1
fi

log "✅ Backend services are ready!"

# Check if web development server is already running
if curl -s http://localhost:3001 > /dev/null 2>&1; then
    log "✅ Web interface already running at http://localhost:3001"
else
    # Start web development server
    log "🌐 Starting web development server..."
    cd web
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        log "📦 Installing web dependencies..."
        npm install
    fi
    
    # Start in background
    nohup npm run dev > /tmp/bootnode-web.log 2>&1 &
    web_pid=$!
    echo $web_pid > /tmp/bootnode-web.pid
    
    # Wait for web server to be ready
    log "⏳ Waiting for web server to be ready..."
    web_ready=false
    for i in {1..30}; do
        if curl -s http://localhost:3001 > /dev/null; then
            web_ready=true
            break
        fi
        sleep 2
        echo -n "."
    done
    
    if [ "$web_ready" = false ]; then
        warn "❌ Web server failed to start within 60 seconds"
        tail /tmp/bootnode-web.log
        exit 1
    fi
    
    log "✅ Web development server started!"
    cd ..
fi

# Show status
log "🎉 Bootnode Platform is now running!"
log "================================================="
log "📊 Service URLs:"
log "   🌐 Web Dashboard:     http://localhost:3001"
log "   🔌 API:               http://localhost:8100"
log "   📖 API Documentation: http://localhost:8100/docs"
log "   📚 ReDoc:             http://localhost:8100/redoc"
log ""
log "🗄️  Database Connections:"
log "   📊 PostgreSQL:        localhost:5434"
log "   🔴 Redis:             localhost:6383"
log "   📈 ClickHouse:        localhost:8125"
log ""
log "🔍 Key Features Available:"
log "   ✅ Multi-chain RPC (Ethereum, Polygon, Arbitrum, etc.)"
log "   ✅ Token & NFT APIs"
log "   ✅ Smart Wallets (ERC-4337)"
log "   ✅ Webhooks & Events"
log "   ✅ Gas Management"
log "   ✅ Analytics Dashboard"
log "   ✅ API Key Management"
log ""
log "📋 Next Steps:"
log "   1. Visit http://localhost:3001/dashboard"
log "   2. Create an API key"
log "   3. Test RPC endpoints with your key"
log "   4. Explore the documentation at http://localhost:8100/docs"
log ""
log "🛑 To stop all services:"
log "   docker compose down"
log "   kill \$(cat /tmp/bootnode-web.pid 2>/dev/null) 2>/dev/null || true"
log ""
log "🎯 For production deployment, see FINAL-PRODUCTION-SUMMARY.md"
log "================================================="

# Create a simple stop script
cat > stop.sh << 'EOF'
#!/bin/bash
echo "🛑 Stopping Bootnode Platform..."
docker compose down
if [ -f /tmp/bootnode-web.pid ]; then
    kill $(cat /tmp/bootnode-web.pid) 2>/dev/null || true
    rm -f /tmp/bootnode-web.pid
fi
rm -f /tmp/bootnode-web.log
echo "✅ All services stopped"
EOF

chmod +x stop.sh

log "💾 Created stop.sh script for easy shutdown"

# Run a quick health check
log "🔍 Running quick health check..."
if ./test-e2e.sh 2>/dev/null | grep -q "✅ API Health Check"; then
    log "✅ Health check passed - Platform is ready for development!"
else
    warn "⚠️  Health check had issues, but basic services are running"
fi

log "🚀 Happy coding! The Bootnode platform is ready for development."