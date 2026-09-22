from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Inventory, Product, Warehouse
from app.schemas import InventoryDetailedOut, InventoryAdjust, InventoryTransfer
from app.websocket_manager import manager

router = APIRouter(prefix="/inventory", tags=["Inventory"])

def compute_status(quantity: int, reorder_point: int) -> str:
    if quantity <= 0:
        return "Out of Stock"
    elif quantity <= reorder_point:
        return "Low Stock"
    return "In Stock"

@router.get("", response_model=List[InventoryDetailedOut])
def get_inventory(
    warehouse_id: Optional[int] = None,
    category: Optional[str] = None,
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Inventory, Product, Warehouse)\
        .join(Product, Inventory.product_id == Product.id)\
        .join(Warehouse, Inventory.warehouse_id == Warehouse.id)

    if warehouse_id:
        query = query.filter(Inventory.warehouse_id == warehouse_id)
    if category:
        query = query.filter(Product.category.ilike(f"%{category}%"))
    if search:
        query = query.filter(
            (Product.name.ilike(f"%{search}%")) | (Product.sku.ilike(f"%{search}%"))
        )

    rows = query.order_by(Product.name.asc(), Warehouse.id.asc()).all()

    items = []
    for inv, prod, wh in rows:
        st = compute_status(inv.quantity, inv.reorder_point)
        if status_filter and status_filter.lower() != "all" and st.lower() != status_filter.lower():
            continue

        items.append({
            "id": inv.id,
            "product_id": prod.id,
            "warehouse_id": wh.id,
            "product_name": prod.name,
            "sku": prod.sku,
            "category": prod.category,
            "price": float(prod.price),
            "warehouse_name": wh.name,
            "warehouse_code": wh.code,
            "warehouse_location": wh.location,
            "quantity": inv.quantity,
            "reorder_point": inv.reorder_point,
            "status": st,
            "last_updated": inv.last_updated
        })

    return items

@router.post("/adjust")
async def adjust_stock(data: InventoryAdjust, db: Session = Depends(get_db)):
    """
    Adjusts inventory stock for a product in a warehouse.
    adjustment > 0: Add stock
    adjustment < 0: Remove stock
    Enforces atomic transaction and broadcasts INVENTORY_UPDATED.
    """
    if data.adjustment == 0:
        raise HTTPException(status_code=400, detail="Adjustment amount cannot be zero")

    try:
        # Fetch inventory row with lock if possible
        inv = db.query(Inventory).filter(
            Inventory.product_id == data.product_id,
            Inventory.warehouse_id == data.warehouse_id
        ).with_for_update().first()

        # If not present, create it if adjustment is positive
        if not inv:
            if data.adjustment < 0:
                raise HTTPException(status_code=400, detail="No existing stock to remove from")
            prod = db.query(Product).filter(Product.id == data.product_id).first()
            if not prod:
                raise HTTPException(status_code=404, detail="Product not found")
            wh = db.query(Warehouse).filter(Warehouse.id == data.warehouse_id).first()
            if not wh:
                raise HTTPException(status_code=404, detail="Warehouse not found")

            inv = Inventory(
                product_id=data.product_id,
                warehouse_id=data.warehouse_id,
                quantity=0,
                reorder_point=prod.reorder_threshold
            )
            db.add(inv)
            db.flush()

        old_quantity = inv.quantity
        new_quantity = old_quantity + data.adjustment

        if new_quantity < 0:
            raise HTTPException(
                status_code=400, 
                detail=f"Insufficient stock. Available: {old_quantity}, requested reduction: {abs(data.adjustment)}"
            )

        inv.quantity = new_quantity
        inv.last_updated = datetime.now(timezone.utc)
        db.commit()
        db.refresh(inv)

        product = db.query(Product).filter(Product.id == inv.product_id).first()
        warehouse = db.query(Warehouse).filter(Warehouse.id == inv.warehouse_id).first()

        event_payload = {
            "inventory_id": inv.id,
            "product_id": inv.product_id,
            "product_name": product.name,
            "sku": product.sku,
            "warehouse_id": inv.warehouse_id,
            "warehouse_name": warehouse.name,
            "old_quantity": old_quantity,
            "new_quantity": new_quantity,
            "change": data.adjustment,
            "action": "add" if data.adjustment > 0 else "remove",
            "status": compute_status(new_quantity, inv.reorder_point),
            "reason": data.reason
        }

        # Broadcast real-time event to all connected browsers!
        await manager.broadcast("INVENTORY_UPDATED", event_payload)

        return {
            "success": True,
            "message": f"Successfully updated stock: {old_quantity} -> {new_quantity}",
            "data": event_payload
        }
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error during stock adjustment: {str(e)}")

@router.post("/transfer")
async def transfer_stock(data: InventoryTransfer, db: Session = Depends(get_db)):
    """
    Transfers stock between warehouses using an atomic DBMS transaction:
    BEGIN
      -> check source warehouse stock >= quantity
      -> decrease source warehouse stock
      -> increase destination warehouse stock
    COMMIT
    (ROLLBACK on any failure)
    """
    if data.source_warehouse_id == data.destination_warehouse_id:
        raise HTTPException(status_code=400, detail="Source and destination warehouse must be different")

    if data.quantity <= 0:
        raise HTTPException(status_code=400, detail="Transfer quantity must be greater than 0")

    try:
        # Atomic lock on source inventory
        source_inv = db.query(Inventory).filter(
            Inventory.product_id == data.product_id,
            Inventory.warehouse_id == data.source_warehouse_id
        ).with_for_update().first()

        if not source_inv or source_inv.quantity < data.quantity:
            avail = source_inv.quantity if source_inv else 0
            raise HTTPException(
                status_code=400, 
                detail=f"Insufficient stock at source warehouse. Available: {avail}, requested: {data.quantity}"
            )

        # Atomic lock / fetch on destination inventory
        dest_inv = db.query(Inventory).filter(
            Inventory.product_id == data.product_id,
            Inventory.warehouse_id == data.destination_warehouse_id
        ).with_for_update().first()

        if not dest_inv:
            prod = db.query(Product).filter(Product.id == data.product_id).first()
            dest_inv = Inventory(
                product_id=data.product_id,
                warehouse_id=data.destination_warehouse_id,
                quantity=0,
                reorder_point=prod.reorder_threshold if prod else 15
            )
            db.add(dest_inv)
            db.flush()

        source_old = source_inv.quantity
        dest_old = dest_inv.quantity

        source_inv.quantity -= data.quantity
        source_inv.last_updated = datetime.now(timezone.utc)

        dest_inv.quantity += data.quantity
        dest_inv.last_updated = datetime.now(timezone.utc)

        # Commit atomic transfer
        db.commit()

        product = db.query(Product).filter(Product.id == data.product_id).first()
        src_wh = db.query(Warehouse).filter(Warehouse.id == data.source_warehouse_id).first()
        dest_wh = db.query(Warehouse).filter(Warehouse.id == data.destination_warehouse_id).first()

        broadcast_payload = {
            "product_id": data.product_id,
            "product_name": product.name,
            "sku": product.sku,
            "quantity": data.quantity,
            "source_warehouse": {
                "id": src_wh.id,
                "name": src_wh.name,
                "old_quantity": source_old,
                "new_quantity": source_inv.quantity,
                "status": compute_status(source_inv.quantity, source_inv.reorder_point)
            },
            "destination_warehouse": {
                "id": dest_wh.id,
                "name": dest_wh.name,
                "old_quantity": dest_old,
                "new_quantity": dest_inv.quantity,
                "status": compute_status(dest_inv.quantity, dest_inv.reorder_point)
            },
            "notes": data.notes
        }

        # Broadcast STOCK_TRANSFERRED event
        await manager.broadcast("STOCK_TRANSFERRED", broadcast_payload)

        return {
            "success": True,
            "message": f"Transferred {data.quantity} units from {src_wh.name} to {dest_wh.name}",
            "data": broadcast_payload
        }
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Transaction rolled back due to error: {str(e)}")
