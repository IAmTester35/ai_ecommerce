#!/usr/bin/env bash
set -e

echo "=== AutoMatch AI - Environment Setup Script ==="

# Check Python virtualenv
if [ -f ".venv/bin/activate" ]; then
    echo "[+] Activating Python virtualenv..."
    source .venv/bin/activate
else
    echo "[!] Virtualenv not found. Creating new .venv..."
    python3 -m venv .venv
    source .venv/bin/activate
fi

# Check requirements
if [ -f "backend/requirements.txt" ]; then
    echo "[+] Installing backend dependencies..."
    pip install -r backend/requirements.txt
fi

# Check mobile app
if [ -d "ecommerce-car" ]; then
    echo "[+] Installing mobile app dependencies..."
    cd ecommerce-car
    npm install
    cd ..
fi

echo "=== Setup Completed Successfully ==="
