#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

# Create venv if missing
if [ ! -d ".venv" ]; then
  echo "🔧 Creating Python virtual environment..."
  python3 -m venv .venv
fi

# Activate venv
source .venv/bin/activate

# Upgrade pip once if missing
python -m ensurepip --upgrade
pip install --upgrade pip wheel setuptools

# Install requirements if something is missing
# Do NOT auto-freeze here to avoid overwriting requirements.txt
if ! python -c "import uvicorn" &> /dev/null; then
  echo "📦 Installing Python dependencies..."
  pip install -r requirements.txt
fi

# Start backend server
echo "🚀 Starting FastAPI backend on port ${FASTAPI_PORT:-3002}..."
exec uvicorn app.main:app --reload --host 0.0.0.0 --port ${FASTAPI_PORT:-3002}
