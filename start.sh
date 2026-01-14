#!/bin/bash

# NINJA Research System - Start Script
# Starts both backend (port 8000) and frontend (port 3000)

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

echo "🥷 NINJA Research System - Startup"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check Python
echo -e "${BLUE}📋 Checking Python...${NC}"
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3.11+"
    exit 1
fi
PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
echo -e "${GREEN}✅ Python $PYTHON_VERSION found${NC}"
echo ""

# Check Node.js
echo -e "${BLUE}📋 Checking Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi
NODE_VERSION=$(node --version)
echo -e "${GREEN}✅ Node.js $NODE_VERSION found${NC}"
echo ""

# Install backend dependencies if needed
if [ ! -d "venv" ]; then
    echo -e "${BLUE}📦 Installing Python dependencies...${NC}"
    pip install -r requirements.txt > /dev/null 2>&1
    echo -e "${GREEN}✅ Python dependencies installed${NC}"
    echo ""
fi

# Install frontend dependencies if needed
if [ ! -d "frontend/node_modules" ]; then
    echo -e "${BLUE}📦 Installing Node.js dependencies...${NC}"
    cd frontend
    npm install > /dev/null 2>&1
    cd ..
    echo -e "${GREEN}✅ Node.js dependencies installed${NC}"
    echo ""
fi

# Check .env file
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found${NC}"
    echo "Please create .env file with required API keys"
    echo ""
fi

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}🚀 Starting NINJA System${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "${BLUE}Backend will start on:${NC} http://localhost:8000"
echo -e "${BLUE}Frontend will start on:${NC} http://localhost:3000"
echo ""
echo -e "${YELLOW}⚠️  Backend will run in the foreground.${NC}"
echo -e "${YELLOW}To start frontend in another terminal, run:${NC}"
echo -e "${YELLOW}  cd frontend && npm run dev${NC}"
echo ""
echo -e "${YELLOW}To stop the backend, press Ctrl+C${NC}"
echo ""

# Start backend
python3 backend_api.py
