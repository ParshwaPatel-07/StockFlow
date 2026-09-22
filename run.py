#!/usr/bin/env python3
import os
import sys
import subprocess
import signal
import time
import shutil

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
SCRIPTS_DIR = os.path.join(ROOT_DIR, "scripts")
VENV_PYTHON = os.path.join(ROOT_DIR, "backend", "venv", "bin", "python")
FRONTEND_DIR = os.path.join(ROOT_DIR, "frontend")

# Ensure PostgreSQL binaries and node wrapper are in PATH
PG_BIN_DIRS = [
    "/opt/homebrew/opt/postgresql@16/bin",
    "/opt/homebrew/bin",
    "/usr/local/opt/postgresql@16/bin",
    "/usr/local/bin"
]
extra_paths = [SCRIPTS_DIR] + [p for p in PG_BIN_DIRS if os.path.exists(p)]
os.environ["PATH"] = ":".join(extra_paths) + ":" + os.environ.get("PATH", "")
os.environ["DATABASE_URL"] = os.environ.get("DATABASE_URL", "postgresql://localhost:5432/stockflow")

def ensure_postgres_running():
    # Check if postgres is listening on port 5432
    try:
        import socket
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(1.0)
        res = s.connect_ex(('127.0.0.1', 5432))
        s.close()
        if res == 0:
            print("[StockFlow] PostgreSQL service is active on port 5432.")
            return
    except Exception:
        pass

    print("[StockFlow] Starting PostgreSQL service...")
    pg_data = "/opt/homebrew/var/postgresql@16"
    pg_ctl = shutil.which("pg_ctl") or "/opt/homebrew/opt/postgresql@16/bin/pg_ctl"
    if os.path.exists(pg_data) and os.path.exists(pg_ctl):
        subprocess.run([pg_ctl, "-D", pg_data, "-l", os.path.join(pg_data, "server.log"), "start"])
        time.sleep(2)
    else:
        print("[StockFlow] Warning: Could not auto-start PostgreSQL. Please ensure PostgreSQL is running.")

def ensure_database_exists():
    createdb = shutil.which("createdb") or "/opt/homebrew/opt/postgresql@16/bin/createdb"
    if os.path.exists(createdb):
        subprocess.run([createdb, "stockflow"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def init_db():
    ensure_postgres_running()
    ensure_database_exists()
    print("[StockFlow] Initializing PostgreSQL schema and seed data...")
    res = subprocess.run([VENV_PYTHON, os.path.join(ROOT_DIR, "backend", "init_db.py")])
    if res.returncode != 0:
        print("[StockFlow] Database init failed.")
        sys.exit(1)

def main():
    init_db()

    print("\n" + "="*70)
    print(" 🚀 Launching StockFlow — Real-Time Inventory Management System")
    print("    Backend API:       http://localhost:8000")
    print("    API Documentation: http://localhost:8000/docs")
    print("    Frontend UI:       http://localhost:5173")
    print("    WebSocket Stream:  ws://localhost:8000/ws")
    print("    Database:          PostgreSQL (stockflow)")
    print("="*70 + "\n")

    # Start FastAPI Backend
    backend_proc = subprocess.Popen(
        [VENV_PYTHON, "-m", "uvicorn", "app.main:app", "--app-dir", "app", "--host", "0.0.0.0", "--port", "8000", "--reload"],
        cwd=os.path.join(ROOT_DIR, "backend"),
        env=os.environ
    )

    # Start Vite Frontend
    frontend_proc = subprocess.Popen(
        ["./node_modules/.bin/vite", "--host", "0.0.0.0", "--port", "5173"],
        cwd=FRONTEND_DIR,
        env=os.environ
    )

    def signal_handler(sig, frame):
        print("\n[StockFlow] Shutting down services...")
        backend_proc.terminate()
        frontend_proc.terminate()
        backend_proc.wait()
        frontend_proc.wait()
        print("[StockFlow] Goodbye!")
        sys.exit(0)

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        signal_handler(None, None)

if __name__ == "__main__":
    main()
