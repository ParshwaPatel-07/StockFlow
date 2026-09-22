import sys
import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Set up logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("stockflow.init_db")

# 1. Parse target DATABASE_URL from command line argument or environment variable
target_url = None
for arg in sys.argv[1:]:
    if arg.startswith("postgres://") or arg.startswith("postgresql://"):
        target_url = arg
        os.environ["DATABASE_URL"] = arg
        break

if not target_url:
    target_url = os.environ.get("DATABASE_URL", "postgresql://localhost:5432/stockflow")

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Normalize URL for SQLAlchemy PostgreSQL dialect
if target_url.startswith("postgres://"):
    target_url = target_url.replace("postgres://", "postgresql://", 1)

# Create engine and SessionLocal specifically bound to target_url
engine = create_engine(
    target_url,
    pool_pre_ping=True,
    pool_recycle=300
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

from app.models import Product, Warehouse, Inventory, Order, OrderItem

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCHEMA_SQL_PATH = os.path.join(ROOT_DIR, "database", "schema.sql")
SEED_SQL_PATH = os.path.join(ROOT_DIR, "database", "seed.sql")

def execute_sql_file(file_path: str):
    """
    Executes an SQL script using a fresh connection,
    explicitly commits upon completion, and rolls back on failure.
    """
    filename = os.path.basename(file_path)
    print(f"[StockFlow] Executing SQL script: {filename}...")
    with open(file_path, "r", encoding="utf-8") as f:
        sql_content = f.read()

    # Obtain a fresh raw connection from the engine
    raw_conn = engine.raw_connection()
    try:
        cursor = raw_conn.cursor()
        cursor.execute(sql_content)
        raw_conn.commit()  # Explicitly commit DDL / DML transaction
        cursor.close()
        print(f"[StockFlow] Successfully executed and committed {filename}.")
    except Exception as e:
        raw_conn.rollback()
        print(f"[StockFlow] Error executing {filename}: {e}")
        raise
    finally:
        raw_conn.close()

def check_database_populated() -> bool:
    """
    Checks if the database is already fully populated.
    If tables do not exist (UndefinedTable), rolls back immediately
    and closes the session cleanly.
    """
    db = SessionLocal()
    try:
        prod_count = db.query(Product).count()
        wh_count = db.query(Warehouse).count()
        inv_count = db.query(Inventory).count()
        order_count = db.query(Order).count()
        order_item_count = db.query(OrderItem).count()

        print(f"[StockFlow] Current PostgreSQL counts:")
        print(f"    - Products:    {prod_count}")
        print(f"    - Warehouses:  {wh_count}")
        print(f"    - Inventory:   {inv_count}")
        print(f"    - Orders:      {order_count}")
        print(f"    - OrderItems:  {order_item_count}")

        if prod_count >= 20 and wh_count >= 4 and inv_count > 0 and order_count > 0:
            return True
        return False
    except Exception as e:
        # Requirement 1: Rollback transaction immediately after catching UndefinedTable / exception
        db.rollback()
        print(f"[StockFlow] Tables need initialization / missing: {e}")
        return False
    finally:
        # Close the session to return connection to the pool in a clean state
        db.close()

def verify_database_state():
    """
    Requirement 5: Verification queries use a completely fresh connection/session.
    """
    print("\n[StockFlow] Verifying database state with fresh connection...")
    db = SessionLocal()
    try:
        prod_count = db.query(Product).count()
        wh_count = db.query(Warehouse).count()
        inv_count = db.query(Inventory).count()
        order_count = db.query(Order).count()
        order_item_count = db.query(OrderItem).count()

        print(f"[StockFlow] Verified PostgreSQL table counts:")
        print(f"    - Products:    {prod_count}")
        print(f"    - Warehouses:  {wh_count}")
        print(f"    - Inventory:   {inv_count}")
        print(f"    - Orders:      {order_count}")
        print(f"    - OrderItems:  {order_item_count}")

        return {
            "products": prod_count,
            "warehouses": wh_count,
            "inventory": inv_count,
            "orders": order_count,
            "order_items": order_item_count,
        }
    except Exception as e:
        db.rollback()
        print(f"[StockFlow] Verification query error: {e}")
        raise
    finally:
        db.close()

def seed_database():
    print(f"[StockFlow] Connecting to PostgreSQL database: '{engine.url.database}' at {engine.url.host or 'localhost'}:{engine.url.port or 5432}...")
    
    force_reset = "--force" in sys.argv or "--reset" in sys.argv

    if not force_reset:
        if check_database_populated():
            print("[StockFlow] PostgreSQL database already fully populated. Skipping seed. (Use --reset to re-seed)")
            return
    else:
        print("[StockFlow] Forced reset flag detected. Re-creating schema and reseeding database...")

    # Requirement 2 & 3: schema.sql executed using fresh connection/transaction & explicitly committed
    execute_sql_file(SCHEMA_SQL_PATH)

    # Requirement 4: seed.sql executed using clean connection/transaction & explicitly committed
    execute_sql_file(SEED_SQL_PATH)

    # Requirement 5: Final verification queries use another clean connection/session
    verify_database_state()

if __name__ == "__main__":
    seed_database()
