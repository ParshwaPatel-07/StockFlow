#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

export PATH="$DIR/scripts:$PATH"

if [ ! -d "backend/venv" ]; then
    echo "[StockFlow] Creating Python virtual environment..."
    python3 -m venv backend/venv
    ./backend/venv/bin/pip install --upgrade pip
    ./backend/venv/bin/pip install -r backend/requirements.txt
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "[StockFlow] Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

exec "$DIR/backend/venv/bin/python" "$DIR/run.py"
