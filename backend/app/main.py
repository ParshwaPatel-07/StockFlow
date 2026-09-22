import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.config import settings
from app.database import engine, Base, get_db
from app.models import Product, Warehouse, Inventory, Order
from app.websocket_manager import manager
from app.routers import products, warehouses, inventory, orders, analytics

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("stockflow.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting StockFlow API server with PostgreSQL...")
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    yield
    logger.info("Shutting down StockFlow API server...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Real-Time Inventory Management System - College DBMS Project",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware (restrict to allowed origins from settings, no wildcards)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount REST API Routers
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(inventory.router, prefix=settings.API_V1_STR)
app.include_router(orders.router, prefix=settings.API_V1_STR)
app.include_router(products.router, prefix=settings.API_V1_STR)
app.include_router(warehouses.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "project": "StockFlow — Real-Time Inventory Management System",
        "status": "online",
        "database": f"PostgreSQL ({engine.url.database})",
        "docs_url": "/docs",
        "websocket_url": "/ws"
    }

@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    return {
        "status": "healthy",
        "database_engine": engine.name,
        "database_name": engine.url.database,
        "database_host": engine.url.host or "localhost",
        "products_count": db.query(Product).count(),
        "warehouses_count": db.query(Warehouse).count(),
        "inventory_count": db.query(Inventory).count(),
        "orders_count": db.query(Order).count(),
        "websocket_active_clients": len(manager.active_connections)
    }

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            text = await websocket.receive_text()
            if text == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.debug(f"WebSocket client loop terminated: {e}")
        manager.disconnect(websocket)

if __name__ == "__main__":
    import os
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)

