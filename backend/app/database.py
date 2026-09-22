import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

logger = logging.getLogger("stockflow.database")

# Normalize URL for SQLAlchemy PostgreSQL dialect
db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

try:
    engine = create_engine(
        db_url,
        pool_pre_ping=True,
        pool_recycle=300
    )
    # Test connection on startup
    with engine.connect() as conn:
        logger.info(f"Connected to PostgreSQL database: {engine.url.database} on {engine.url.host or 'localhost'}")
except Exception as e:
    logger.error(f"FATAL: Unable to connect to PostgreSQL ({db_url}): {e}")
    raise RuntimeError(f"Database connection error: {e}. Please ensure PostgreSQL is running.")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
