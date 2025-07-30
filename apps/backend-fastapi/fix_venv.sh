#!/usr/bin/env bash

set -e

echo "🔧 Checking Python environment for backend-fastapi..."

# Desired Python version
PYTHON_BIN=$(command -v python3.11 || command -v python3.10 || command -v python3)

# 1. Remove venv if missing pip
if [ -d ".venv" ]; then
    if ! .venv/bin/python -m pip --version >/dev/null 2>&1; then
        echo "⚠️  Existing venv is broken. Removing..."
        rm -rf .venv
    else
        echo "✅ Virtual env exists and pip works."
    fi
fi

# 2. Create venv if missing
if [ ! -d ".venv" ]; then
    echo "📦 Creating new virtual environment..."
    $PYTHON_BIN -m venv .venv
fi

# 3. Activate venv
echo "✅ Activating venv..."
source .venv/bin/activate

# 4. Upgrade pip & tools
python -m ensurepip --upgrade
python -m pip install --upgrade pip setuptools wheel

# 5. Install requirements if available
if [ -f "requirements.txt" ]; then
    echo "📦 Installing requirements..."
    pip install -r requirements.txt
else
    echo "⚠️  No requirements.txt found. Skipping."
fi

echo "✅ Backend environment repaired."
echo "You can now run: ./dev.sh"
