#!/bin/bash

# NINJA Research System - Frontend Only
# Starts Next.js frontend on port 3000

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

echo "🥷 NINJA Frontend Application"
echo "=============================="
echo ""

# Check if node_modules exists
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing dependencies..."
    cd frontend
    npm install
    cd ..
fi

echo "🚀 Starting Frontend on http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop"
echo ""

cd frontend
npm run dev
