#!/bin/bash
# Bootnode - Easy Start Script
# Starts everything needed for local development

set -e

echo "🚀 Starting Bootnode Development Stack..."

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Create .env files if they don't exist
if [ ! -f ".env.development" ]; then
    echo "❌ .env.development not found. Please copy from .env.development.example"
    exit 1
fi

if [ ! -f "api/.env" ]; then
    echo "📋 Copying API environment file..."
    cp api/.env.example api/.env
fi

if [ ! -f "web/.env.local" ]; then
    echo "📋 Copying web environment file..."
    echo "NEXT_PUBLIC_API_URL=http://localhost:8100" > web/.env.local
    echo "NEXT_PUBLIC_API_KEY=bn_dev_test_key_12345" >> web/.env.local
fi

echo "🐳 Starting infrastructure services..."
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if API is healthy
for i in {1..30}; do
    if curl -f http://localhost:8100/health >/dev/null 2>&1; then
        echo "✅ API is healthy"
        break
    fi
    echo "⏳ Waiting for API to be ready... ($i/30)"
    sleep 2
done

# Start web development server in background
if [ "$1" != "--api-only" ]; then
    echo "🌐 Starting web development server..."
    cd web
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing web dependencies..."
        npm install
    fi
    npm run dev &
    WEB_PID=$!
    cd ..
    
    echo "✅ Web server started (PID: $WEB_PID)"
fi

echo ""
echo "🎉 Bootnode is ready!"
echo ""
echo "📍 Services:"
echo "   • API: http://localhost:8100"
echo "   • Web: http://localhost:3001"
echo "   • Docs: http://localhost:8100/docs"
echo ""
echo "📊 Infrastructure:"
echo "   • PostgreSQL: localhost:5434"
echo "   • Redis: localhost:6383"
echo "   • ClickHouse: localhost:8125"
echo ""
echo "🛠  Commands:"
echo "   • View logs: docker-compose logs -f"
echo "   • Stop all: docker-compose down"
echo "   • Restart: ./start.sh"
echo ""

# Keep script running if web server was started
if [ "$1" != "--api-only" ]; then
    echo "💡 Press Ctrl+C to stop all services"
    
    # Function to cleanup when script exits
    cleanup() {
        echo ""
        echo "🛑 Stopping services..."
        if [ ! -z "$WEB_PID" ]; then
            kill $WEB_PID 2>/dev/null || true
        fi
        docker-compose down
        echo "✅ All services stopped"
    }
    
    trap cleanup EXIT
    
    # Wait for interrupt
    wait $WEB_PID
fi