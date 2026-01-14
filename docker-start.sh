#!/bin/bash

# =============================================
# NINJA Research System - Docker Start Script
# =============================================
# Builds and runs the full stack using Docker Compose

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}🥷 NINJA Research System - Docker Deployment${NC}"
echo "=============================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

# Check for .env file
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  No .env file found!${NC}"
    echo ""
    if [ -f "docker.env.example" ]; then
        echo -e "${BLUE}Creating .env from docker.env.example...${NC}"
        cp docker.env.example .env
        echo -e "${GREEN}✅ Created .env file. Please edit it with your API keys.${NC}"
        echo ""
        echo -e "${YELLOW}Please edit .env file and run this script again.${NC}"
        exit 1
    else
        echo -e "${RED}❌ No docker.env.example found. Please create .env manually.${NC}"
        exit 1
    fi
fi

echo -e "${BLUE}📋 Checking Docker...${NC}"
docker --version
echo ""

# Parse arguments
BUILD_FLAG=""
DETACH_FLAG=""

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --build|-b) BUILD_FLAG="--build" ;;
        --detach|-d) DETACH_FLAG="-d" ;;
        --force|-f) BUILD_FLAG="--build --force-recreate" ;;
        --help|-h)
            echo "Usage: ./docker-start.sh [options]"
            echo ""
            echo "Options:"
            echo "  -b, --build    Rebuild images before starting"
            echo "  -d, --detach   Run containers in background"
            echo "  -f, --force    Force rebuild and recreate containers"
            echo "  -h, --help     Show this help message"
            echo ""
            exit 0
            ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

echo -e "${BLUE}🚀 Starting NINJA System with Docker Compose...${NC}"
echo ""

# Use docker compose (v2) if available, otherwise fall back to docker-compose (v1)
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

# Start the services
$COMPOSE_CMD up $BUILD_FLAG $DETACH_FLAG

if [ -n "$DETACH_FLAG" ]; then
    echo ""
    echo -e "${GREEN}✅ NINJA System started in background!${NC}"
    echo ""
    echo -e "🌐 Frontend: ${BLUE}http://localhost:3000${NC}"
    echo -e "🔧 Backend:  ${BLUE}http://localhost:8000${NC}"
    echo -e "📚 API Docs: ${BLUE}http://localhost:8000/docs${NC}"
    echo ""
    echo "Commands:"
    echo "  View logs:     $COMPOSE_CMD logs -f"
    echo "  Stop:          $COMPOSE_CMD down"
    echo "  Restart:       $COMPOSE_CMD restart"
    echo ""
fi
