from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import Product, Warehouse, Inventory, Order
from app.schemas import DashboardStatsOut

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/dashboard", response_model=DashboardStatsOut)
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_products = db.query(func.count(Product.id)).scalar() or 0
    total_inventory = db.query(func.coalesce(func.sum(Inventory.quantity), 0)).scalar() or 0

    # Low stock: quantity > 0 and quantity <= reorder_point
    low_stock = db.query(func.count(Inventory.id)).filter(
        Inventory.quantity > 0,
        Inventory.quantity <= Inventory.reorder_point
    ).scalar() or 0

    # Out of stock: quantity == 0
    out_of_stock = db.query(func.count(Inventory.id)).filter(
        Inventory.quantity == 0
    ).scalar() or 0

    # Orders today
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    todays_orders = db.query(
        func.count(Order.id).label("order_count"),
        func.coalesce(func.sum(Order.total_amount), 0).label("revenue")
    ).filter(
        Order.order_date >= today_start,
        Order.status != "CANCELLED"
    ).first()

    order_count = todays_orders.order_count if todays_orders else 0
    revenue = float(todays_orders.revenue) if todays_orders else 0.0

    active_warehouses = db.query(func.count(Warehouse.id)).scalar() or 0

    return {
        "total_products": total_products,
        "total_inventory_units": int(total_inventory),
        "low_stock_count": low_stock,
        "out_of_stock_count": out_of_stock,
        "todays_orders_count": order_count,
        "todays_revenue": round(revenue, 2),
        "active_warehouses_count": active_warehouses
    }

@router.get("/warehouse-breakdown")
def get_warehouse_breakdown(db: Session = Depends(get_db)):
    warehouses = db.query(Warehouse).all()
    breakdown = []

    for wh in warehouses:
        total_units = db.query(func.coalesce(func.sum(Inventory.quantity), 0))\
            .filter(Inventory.warehouse_id == wh.id).scalar() or 0
        
        low_stock_in_wh = db.query(func.count(Inventory.id)).filter(
            Inventory.warehouse_id == wh.id,
            Inventory.quantity > 0,
            Inventory.quantity <= Inventory.reorder_point
        ).scalar() or 0

        out_of_stock_in_wh = db.query(func.count(Inventory.id)).filter(
            Inventory.warehouse_id == wh.id,
            Inventory.quantity == 0
        ).scalar() or 0

        stock_val = int(total_units)
        pct = round((stock_val / wh.capacity) * 100, 1) if wh.capacity > 0 else 0.0

        breakdown.append({
            "warehouse_id": wh.id,
            "name": wh.name,
            "code": wh.code,
            "location": wh.location,
            "capacity": wh.capacity,
            "current_stock": stock_val,
            "utilization_percentage": min(pct, 100.0),
            "low_stock_items": low_stock_in_wh,
            "out_of_stock_items": out_of_stock_in_wh
        })

    return breakdown
