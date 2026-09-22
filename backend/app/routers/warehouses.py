from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import Warehouse, Inventory, Product
from app.schemas import WarehouseCreate, WarehouseUpdate, WarehouseOut
from app.websocket_manager import manager

router = APIRouter(prefix="/warehouses", tags=["Warehouses"])

@router.get("", response_model=List[WarehouseOut])
def get_warehouses(db: Session = Depends(get_db)):
    results = db.query(
        Warehouse,
        func.coalesce(func.sum(Inventory.quantity), 0).label("current_stock")
    ).outerjoin(Inventory, Warehouse.id == Inventory.warehouse_id).group_by(Warehouse.id).order_by(Warehouse.id.asc()).all()

    out = []
    for wh, current_stock in results:
        stock_val = int(current_stock)
        util_rate = round((stock_val / wh.capacity) * 100, 2) if wh.capacity > 0 else 0.0
        out.append({
            "id": wh.id,
            "name": wh.name,
            "code": wh.code,
            "location": wh.location,
            "capacity": wh.capacity,
            "created_at": wh.created_at,
            "current_stock": stock_val,
            "utilization_rate": util_rate
        })
    return out

@router.get("/{warehouse_id}", response_model=WarehouseOut)
def get_warehouse(warehouse_id: int, db: Session = Depends(get_db)):
    wh = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not wh:
        raise HTTPException(status_code=404, detail="Warehouse not found")

    current_stock = db.query(func.coalesce(func.sum(Inventory.quantity), 0))\
        .filter(Inventory.warehouse_id == warehouse_id).scalar() or 0
    stock_val = int(current_stock)
    util_rate = round((stock_val / wh.capacity) * 100, 2) if wh.capacity > 0 else 0.0

    return {
        "id": wh.id,
        "name": wh.name,
        "code": wh.code,
        "location": wh.location,
        "capacity": wh.capacity,
        "created_at": wh.created_at,
        "current_stock": stock_val,
        "utilization_rate": util_rate
    }

@router.post("", response_model=WarehouseOut, status_code=status.HTTP_201_CREATED)
async def create_warehouse(wh_in: WarehouseCreate, db: Session = Depends(get_db)):
    existing = db.query(Warehouse).filter(Warehouse.code == wh_in.code).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Warehouse code '{wh_in.code}' already exists")

    wh = Warehouse(
        name=wh_in.name,
        code=wh_in.code,
        location=wh_in.location,
        capacity=wh_in.capacity
    )
    db.add(wh)
    db.commit()
    db.refresh(wh)

    # Populate inventory for this new warehouse across all existing products
    products = db.query(Product).all()
    for p in products:
        inv = Inventory(
            product_id=p.id,
            warehouse_id=wh.id,
            quantity=0,
            reorder_point=p.reorder_threshold
        )
        db.add(inv)
    db.commit()

    wh_data = {
        "id": wh.id,
        "name": wh.name,
        "code": wh.code,
        "location": wh.location,
        "capacity": wh.capacity,
        "created_at": wh.created_at.isoformat() if wh.created_at else None,
        "current_stock": 0,
        "utilization_rate": 0.0
    }

    await manager.broadcast("WAREHOUSE_CREATED", wh_data)

    return wh_data

@router.put("/{warehouse_id}", response_model=WarehouseOut)
async def update_warehouse(warehouse_id: int, wh_in: WarehouseUpdate, db: Session = Depends(get_db)):
    wh = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not wh:
        raise HTTPException(status_code=404, detail="Warehouse not found")

    if wh_in.code and wh_in.code != wh.code:
        existing = db.query(Warehouse).filter(Warehouse.code == wh_in.code).first()
        if existing:
            raise HTTPException(status_code=400, detail="Warehouse code already in use")
        wh.code = wh_in.code

    if wh_in.name is not None:
        wh.name = wh_in.name
    if wh_in.location is not None:
        wh.location = wh_in.location
    if wh_in.capacity is not None:
        wh.capacity = wh_in.capacity

    db.commit()
    db.refresh(wh)

    current_stock = db.query(func.coalesce(func.sum(Inventory.quantity), 0))\
        .filter(Inventory.warehouse_id == warehouse_id).scalar() or 0
    stock_val = int(current_stock)
    util_rate = round((stock_val / wh.capacity) * 100, 2) if wh.capacity > 0 else 0.0

    wh_data = {
        "id": wh.id,
        "name": wh.name,
        "code": wh.code,
        "location": wh.location,
        "capacity": wh.capacity,
        "created_at": wh.created_at.isoformat() if wh.created_at else None,
        "current_stock": stock_val,
        "utilization_rate": util_rate
    }

    await manager.broadcast("WAREHOUSE_UPDATED", wh_data)

    return wh_data
