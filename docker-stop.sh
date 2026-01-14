#!/bin/bash

# =============================================
# NINJA Research System - Docker Stop Script
# =============================================
# Stops all Docker containers

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

echo ""
echo "🛑 Stopping NINJA System Docker containers..."
echo ""

# Use docker compose (v2) if available, otherwise fall back to docker-compose (v1)
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

$COMPOSE_CMD down

echo ""
echo "✅ NINJA System stopped"
echo ""
