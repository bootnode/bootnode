#!/bin/bash
# Health Check Script - Check all Bootnode services
# Usage: ./health-check.sh

set -e

echo "🏥 Bootnode Health Check"
echo "======================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check service
check_service() {
    local name="$1"
    local url="$2"
    local expected="$3"
    
    echo -n "Checking $name... "
    
    if curl -f -s "$url" | grep -q "$expected" 2>/dev/null; then
        echo -e "${GREEN}✅ OK${NC}"
        return 0
    else
        echo -e "${RED}❌ FAILED${NC}"
        return 1
    fi
}

# Function to check port
check_port() {
    local name="$1"
    local host="$2"
    local port="$3"
    
    echo -n "Checking $name port... "
    
    if nc -z "$host" "$port" 2>/dev/null; then
        echo -e "${GREEN}✅ OK${NC}"
        return 0
    else
        echo -e "${RED}❌ FAILED${NC}"
        return 1
    fi
}

# Track failures
FAILURES=0

echo "📡 API Services"
echo "---------------"

# API Health
if ! check_service "Bootnode API" "http://localhost:8100/health" "healthy"; then
    FAILURES=$((FAILURES + 1))
fi

# API Chains
if ! check_service "Chains API" "http://localhost:8100/v1/chains" "ethereum"; then
    FAILURES=$((FAILURES + 1))
fi

# Frontend
if ! check_service "Web Frontend" "http://localhost:3001" "Bootnode"; then
    FAILURES=$((FAILURES + 1))
fi

echo ""
echo "🗄️  Infrastructure"
echo "------------------"

# PostgreSQL
if ! check_port "PostgreSQL" "localhost" "5434"; then
    FAILURES=$((FAILURES + 1))
fi

# Redis
if ! check_port "Redis" "localhost" "6383"; then
    FAILURES=$((FAILURES + 1))
fi

# ClickHouse
if ! check_port "ClickHouse" "localhost" "8125"; then
    FAILURES=$((FAILURES + 1))
fi

echo ""
echo "🐳 Docker Containers"
echo "-------------------"

# Check Docker containers
if command -v docker >/dev/null 2>&1; then
    docker ps --format "table {{.Names}}\t{{.Status}}" | grep nodes-
else
    echo -e "${YELLOW}⚠️  Docker not available${NC}"
fi

echo ""
echo "📊 Summary"
echo "----------"

if [ $FAILURES -eq 0 ]; then
    echo -e "${GREEN}🎉 All services are healthy!${NC}"
    echo ""
    echo "📍 Service URLs:"
    echo "   • API: http://localhost:8100"
    echo "   • Web: http://localhost:3001"
    echo "   • Docs: http://localhost:8100/docs"
    echo ""
    echo "🧪 Quick Tests:"
    echo "   curl http://localhost:8100/health"
    echo "   curl http://localhost:8100/v1/chains"
    exit 0
else
    echo -e "${RED}❌ $FAILURES service(s) failed health check${NC}"
    echo ""
    echo "🔧 Troubleshooting:"
    echo "   1. Check if Docker is running: docker ps"
    echo "   2. Restart services: docker-compose restart"
    echo "   3. Check logs: docker-compose logs -f"
    echo "   4. Verify environment: cat api/.env"
    exit 1
fi