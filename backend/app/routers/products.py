from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import Product, Inventory, Warehouse
from app.schemas import ProductCreate, ProductUpdate, ProductOut
from app.websocket_manager import manager

router = APIRouter(prefix="/products", tags=["Products"])

@router.get("", response_model=List[ProductOut])
def get_products(
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(
        Product,
        func.coalesce(func.sum(Inventory.quantity), 0).label("total_stock")
    ).outerjoin(Inventory, Product.id == Inventory.product_id).group_by(Product.id)

    if category:
        query = query.filter(Product.category.ilike(f"%{category}%"))
    if search:
        query = query.filter(
            (Product.name.ilike(f"%{search}%")) | (Product.sku.ilike(f"%{search}%"))
        )

    results = query.order_by(Product.id.asc()).all()
    
    out = []
    for product, total_stock in results:
        p_dict = {
            "id": product.id,
            "name": product.name,
            "sku": product.sku,
            "category": product.category,
            "price": float(product.price),
            "description": product.description,
            "reorder_threshold": product.reorder_threshold,
            "created_at": product.created_at,
            "updated_at": product.updated_at,
            "total_stock": int(total_stock)
        }
        out.append(p_dict)
    return out

@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail=f"Product with ID {product_id} not found")
    
    total_stock = db.query(func.coalesce(func.sum(Inventory.quantity), 0))\
        .filter(Inventory.product_id == product_id).scalar() or 0
        
    return {
        "id": product.id,
        "name": product.name,
        "sku": product.sku,
        "category": product.category,
        "price": float(product.price),
        "description": product.description,
        "reorder_threshold": product.reorder_threshold,
        "created_at": product.created_at,
        "updated_at": product.updated_at,
        "total_stock": int(total_stock)
    }

@router.post("", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
async def create_product(product_in: ProductCreate, db: Session = Depends(get_db)):
    # Check SKU uniqueness
    existing = db.query(Product).filter(Product.sku == product_in.sku).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Product SKU '{product_in.sku}' already exists")

    product = Product(
        name=product_in.name,
        sku=product_in.sku,
        category=product_in.category,
        price=product_in.price,
        description=product_in.description,
        reorder_threshold=product_in.reorder_threshold
    )
    db.add(product)
    db.commit()
    db.refresh(product)

    # Initialize inventory entries in all existing warehouses with 0 stock
    warehouses = db.query(Warehouse).all()
    for wh in warehouses:
        inv = Inventory(
            product_id=product.id,
            warehouse_id=wh.id,
            quantity=0,
            reorder_point=product.reorder_threshold
        )
        db.add(inv)
    db.commit()

    product_data = {
        "id": product.id,
        "name": product.name,
        "sku": product.sku,
        "category": product.category,
        "price": float(product.price),
        "description": product.description,
        "reorder_threshold": product.reorder_threshold,
        "created_at": product.created_at.isoformat() if product.created_at else None,
        "updated_at": product.updated_at.isoformat() if product.updated_at else None,
        "total_stock": 0
    }

    # Broadcast real-time event
    await manager.broadcast("PRODUCT_CREATED", product_data)

    return product_data

@router.put("/{product_id}", response_model=ProductOut)
async def update_product(product_id: int, product_in: ProductUpdate, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if product_in.sku and product_in.sku != product.sku:
        existing = db.query(Product).filter(Product.sku == product_in.sku).first()
        if existing:
            raise HTTPException(status_code=400, detail="SKU already in use by another product")
        product.sku = product_in.sku

    if product_in.name is not None:
        product.name = product_in.name
    if product_in.category is not None:
        product.category = product_in.category
    if product_in.price is not None:
        product.price = product_in.price
    if product_in.description is not None:
        product.description = product_in.description
    if product_in.reorder_threshold is not None:
        product.reorder_threshold = product_in.reorder_threshold

    db.commit()
    db.refresh(product)

    total_stock = db.query(func.coalesce(func.sum(Inventory.quantity), 0))\
        .filter(Inventory.product_id == product.id).scalar() or 0

    product_data = {
        "id": product.id,
        "name": product.name,
        "sku": product.sku,
        "category": product.category,
        "price": float(product.price),
        "description": product.description,
        "reorder_threshold": product.reorder_threshold,
        "created_at": product.created_at.isoformat() if product.created_at else None,
        "updated_at": product.updated_at.isoformat() if product.updated_at else None,
        "total_stock": int(total_stock)
    }

    await manager.broadcast("PRODUCT_UPDATED", product_data)

    return product_data

@router.delete("/{product_id}")
async def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    db.delete(product)
    db.commit()

    await manager.broadcast("PRODUCT_DELETED", {"product_id": product_id})

    return {"message": f"Product {product_id} successfully deleted"}
