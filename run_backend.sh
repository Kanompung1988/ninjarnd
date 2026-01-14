#!/bin/bash

# NINJA Research System - Backend Only
# Starts backend server on port 8000

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

echo "🥷 NINJA Backend Server"
echo "======================="
echo ""
echo "🚀 Starting Backend on http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop"
echo ""

python3 backend_api.py
