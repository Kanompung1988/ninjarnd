#!/bin/bash
# Azure App Service startup script for Python FastAPI app

# Create log directory if it doesn't exist
mkdir -p /home/LogFiles

# Navigate to app directory
cd /home/site/wwwroot

# Install/upgrade dependencies
echo "Installing dependencies..."
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt

# Start the FastAPI app with Gunicorn + Uvicorn
echo "Starting FastAPI application with Gunicorn..."
exec gunicorn \
    --bind 0.0.0.0:8000 \
    --workers 2 \
    --worker-class uvicorn.workers.UvicornWorker \
    --access-logfile - \
    --error-logfile - \
    --log-level info \
    backend_api:app
