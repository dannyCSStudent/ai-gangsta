#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status
set -e

# Navigate to script directory (project root)
cd "$(dirname "$0")"

# Set up Python virtual environment if it doesn't exist
if [ ! -d ".venv" ]; then
  echo "🔧 Creating virtual environment..."
  python3 -m venv .venv
fi

# Activate the virtual environment
source .venv/bin/activate

# Install dependencies if uvicorn is missing
if ! python -c "import uvicorn" &> /dev/null; then
  echo "📦 Installing Python dependencies..."
  pip install -r requirements.txt || pip install fastapi uvicorn groq
fi

# Run FastAPI
echo "🚀 Starting FastAPI..."
uvicorn app.main:app --reload --port ${FASTAPI_PORT:-3002}


