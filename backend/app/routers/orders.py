import random
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Order, OrderItem, Inventory, Product, Warehouse
from app.schemas import OrderCreate, OrderOut, OrderStatusUpdate
from app.websocket_manager import manager

router = APIRouter(prefix="/orders", tags=["Orders"])

def generate_order_number() -> str:
    now_str = datetime.now(timezone.utc).strftime("%Y%m%d")
    rand_suffix = random.randint(1000, 9999)
    return f"ORD-{now_str}-{rand_suffix}"

@router.get("", response_model=List[OrderOut])
def get_orders(
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    query = db.query(Order).join(Warehouse, Order.warehouse_id == Warehouse.id)

    if status_filter and status_filter.upper() != "ALL":
        query = query.filter(Order.status == status_filter.upper())
    if search:
        query = query.filter(
            (Order.order_number.ilike(f"%{search}%")) |
            (Order.customer_name.ilike(f"%{search}%"))
        )

    orders = query.order_by(Order.order_date.desc()).limit(limit).all()

    result = []
    for ord_obj in orders:
        items = []
        for it in ord_obj.items:
            items.append({
                "id": it.id,
                "product_id": it.product_id,
                "product_name": it.product.name if it.product else "Unknown",
                "sku": it.product.sku if it.product else "N/A",
                "quantity": it.quantity,
                "unit_price": float(it.unit_price),
                "subtotal": float(it.subtotal)
            })

        result.append({
            "id": ord_obj.id,
            "order_number": ord_obj.order_number,
            "customer_name": ord_obj.customer_name,
            "customer_email": ord_obj.customer_email,
            "warehouse_id": ord_obj.warehouse_id,
            "warehouse_name": ord_obj.warehouse.name if ord_obj.warehouse else "N/A",
            "total_amount": float(ord_obj.total_amount),
            "status": ord_obj.status,
            "order_date": ord_obj.order_date,
            "items_count": len(items),
            "items": items
        })
    return result

@router.get("/{order_id}", response_model=OrderOut)
def get_order(order_id: int, db: Session = Depends(get_db)):
    ord_obj = db.query(Order).filter(Order.id == order_id).first()
    if not ord_obj:
        raise HTTPException(status_code=404, detail="Order not found")

    items = []
    for it in ord_obj.items:
        items.append({
            "id": it.id,
            "product_id": it.product_id,
            "product_name": it.product.name if it.product else "Unknown",
            "sku": it.product.sku if it.product else "N/A",
            "quantity": it.quantity,
            "unit_price": float(it.unit_price),
            "subtotal": float(it.subtotal)
        })

    return {
        "id": ord_obj.id,
        "order_number": ord_obj.order_number,
        "customer_name": ord_obj.customer_name,
        "customer_email": ord_obj.customer_email,
        "warehouse_id": ord_obj.warehouse_id,
        "warehouse_name": ord_obj.warehouse.name if ord_obj.warehouse else "N/A",
        "total_amount": float(ord_obj.total_amount),
        "status": ord_obj.status,
        "order_date": ord_obj.order_date,
        "items_count": len(items),
        "items": items
    }

@router.post("", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
async def create_order(order_in: OrderCreate, db: Session = Depends(get_db)):
    """
    DBMS Transaction Demonstration:
    BEGIN TRANSACTION
      1. Verify warehouse exists
      2. For each order item:
         a. Lock inventory record for product in warehouse
         b. Verify stock is sufficient (quantity >= requested)
         c. Compute item subtotal
      3. Insert Order record
      4. Insert OrderItem records
      5. Deduct stock quantities from Inventory
    COMMIT TRANSACTION
    (ROLLBACK on any error or insufficient stock)
    """
    if not order_in.items:
        raise HTTPException(status_code=400, detail="Order must contain at least one item")

    warehouse = db.query(Warehouse).filter(Warehouse.id == order_in.warehouse_id).first()
    if not warehouse:
        raise HTTPException(status_code=404, detail="Selected warehouse does not exist")

    try:
        total_amount = 0.0
        validated_items = []
        affected_inventory = []

        # 1. Validation & Stock Locking Phase
        for item in order_in.items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            if not product:
                raise HTTPException(status_code=404, detail=f"Product ID {item.product_id} not found")

            inv = db.query(Inventory).filter(
                Inventory.product_id == item.product_id,
                Inventory.warehouse_id == order_in.warehouse_id
            ).with_for_update().first()

            available_qty = inv.quantity if inv else 0
            if available_qty < item.quantity:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient inventory for '{product.name}' in {warehouse.name}. Available: {available_qty}, Requested: {item.quantity}"
                )

            subtotal = float(product.price) * item.quantity
            total_amount += subtotal

            validated_items.append({
                "product": product,
                "inventory": inv,
                "quantity": item.quantity,
                "unit_price": float(product.price),
                "subtotal": subtotal
            })

        # 2. Execution & Insertion Phase
        order = Order(
            order_number=generate_order_number(),
            customer_name=order_in.customer_name,
            customer_email=order_in.customer_email,
            warehouse_id=order_in.warehouse_id,
            total_amount=round(total_amount, 2),
            status="COMPLETED",
            order_date=datetime.now(timezone.utc)
        )
        db.add(order)
        db.flush()  # Populates order.id

        created_items_out = []
        for val in validated_items:
            order_item = OrderItem(
                order_id=order.id,
                product_id=val["product"].id,
                quantity=val["quantity"],
                unit_price=val["unit_price"],
                subtotal=val["subtotal"]
            )
            db.add(order_item)

            # Deduct stock
            inv = val["inventory"]
            old_qty = inv.quantity
            inv.quantity -= val["quantity"]
            inv.last_updated = datetime.now(timezone.utc)

            affected_inventory.append({
                "product_id": val["product"].id,
                "product_name": val["product"].name,
                "sku": val["product"].sku,
                "warehouse_id": order_in.warehouse_id,
                "warehouse_name": warehouse.name,
                "old_quantity": old_qty,
                "new_quantity": inv.quantity,
                "change": -val["quantity"],
                "action": "order_deduction"
            })

            created_items_out.append({
                "id": 0,
                "product_id": val["product"].id,
                "product_name": val["product"].name,
                "sku": val["product"].sku,
                "quantity": val["quantity"],
                "unit_price": val["unit_price"],
                "subtotal": val["subtotal"]
            })

        # Commit atomic transaction
        db.commit()
        db.refresh(order)

        order_out_data = {
            "id": order.id,
            "order_number": order.order_number,
            "customer_name": order.customer_name,
            "customer_email": order.customer_email,
            "warehouse_id": order.warehouse_id,
            "warehouse_name": warehouse.name,
            "total_amount": float(order.total_amount),
            "status": order.status,
            "order_date": order.order_date.isoformat() if order.order_date else None,
            "items_count": len(created_items_out),
            "items": created_items_out
        }

        # 3. Broadcast Real-Time Events to Connected Clients
        # Broadcast ORDER_CREATED
        await manager.broadcast("ORDER_CREATED", order_out_data)

        # Broadcast each inventory deduction so dashboards and tables update immediately
        for inv_update in affected_inventory:
            await manager.broadcast("INVENTORY_UPDATED", inv_update)

        return order_out_data

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Order transaction failed and rolled back: {str(e)}")

@router.patch("/{order_id}/status")
async def update_order_status(order_id: int, status_in: OrderStatusUpdate, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    old_status = order.status
    new_status = status_in.status.upper()

    if old_status == new_status:
        return {"message": "Status unchanged", "status": new_status}

    try:
        # If order was COMPLETED or PROCESSING and is now CANCELLED, return stock to inventory!
        if new_status == "CANCELLED" and old_status in ["COMPLETED", "PROCESSING"]:
            for item in order.items:
                inv = db.query(Inventory).filter(
                    Inventory.product_id == item.product_id,
                    Inventory.warehouse_id == order.warehouse_id
                ).with_for_update().first()

                if inv:
                    old_qty = inv.quantity
                    inv.quantity += item.quantity
                    inv.last_updated = datetime.now(timezone.utc)

                    await manager.broadcast("INVENTORY_UPDATED", {
                        "product_id": item.product_id,
                        "product_name": item.product.name if item.product else "",
                        "sku": item.product.sku if item.product else "",
                        "warehouse_id": order.warehouse_id,
                        "warehouse_name": order.warehouse.name if order.warehouse else "",
                        "old_quantity": old_qty,
                        "new_quantity": inv.quantity,
                        "change": item.quantity,
                        "action": "order_cancellation_restock"
                    })

        order.status = new_status
        db.commit()

        event_payload = {
            "order_id": order.id,
            "order_number": order.order_number,
            "old_status": old_status,
            "new_status": new_status
        }
        await manager.broadcast("ORDER_STATUS_CHANGED", event_payload)

        return {"message": f"Order {order.order_number} status updated to {new_status}", "order": event_payload}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update status: {str(e)}")
