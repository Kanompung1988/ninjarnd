#!/bin/bash

# NINJA Research System - Stop Script
# Stops backend and frontend processes

echo "🛑 Stopping NINJA System..."
echo ""

# Kill backend process
echo "🔴 Stopping Backend..."
pkill -f "python3 backend_api.py" 2>/dev/null || true
pkill -f "python backend_api.py" 2>/dev/null || true
pkill -f "uvicorn backend_api" 2>/dev/null || true

# Wait a moment
sleep 1

# Kill frontend process
echo "🔴 Stopping Frontend..."
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "node" 2>/dev/null || true

sleep 1

echo ""
echo "✅ NINJA System stopped"
echo ""
