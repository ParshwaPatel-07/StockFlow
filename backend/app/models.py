from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Numeric, Text, DateTime, ForeignKey, 
    CheckConstraint, UniqueConstraint, Index
)
from sqlalchemy.orm import relationship
from app.database import Base

def utcnow():
    return datetime.now(timezone.utc)

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    sku = Column(String(64), unique=True, nullable=False, index=True)
    category = Column(String(100), nullable=False, index=True)
    price = Column(Numeric(10, 2), nullable=False)
    description = Column(Text, nullable=True)
    reorder_threshold = Column(Integer, nullable=False, default=10)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    __table_args__ = (
        CheckConstraint("price >= 0", name="chk_product_price_non_neg"),
        CheckConstraint("reorder_threshold >= 0", name="chk_product_threshold_non_neg"),
    )

    # Relationships
    inventory_items = relationship("Inventory", back_populates="product", cascade="all, delete-orphan")
    order_items = relationship("OrderItem", back_populates="product")


class Warehouse(Base):
    __tablename__ = "warehouses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    code = Column(String(32), unique=True, nullable=False)
    location = Column(String(255), nullable=False)
    capacity = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    __table_args__ = (
        CheckConstraint("capacity > 0", name="chk_warehouse_capacity_pos"),
    )

    # Relationships
    inventory_items = relationship("Inventory", back_populates="warehouse", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="warehouse")


class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id", ondelete="RESTRICT"), nullable=False, index=True)
    quantity = Column(Integer, nullable=False, default=0)
    reorder_point = Column(Integer, nullable=False, default=15)
    last_updated = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    __table_args__ = (
        UniqueConstraint("product_id", "warehouse_id", name="uq_product_warehouse"),
        CheckConstraint("quantity >= 0", name="chk_inventory_qty_non_neg"),
        CheckConstraint("reorder_point >= 0", name="chk_inventory_reorder_non_neg"),
    )

    # Relationships
    product = relationship("Product", back_populates="inventory_items")
    warehouse = relationship("Warehouse", back_populates="inventory_items")


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(64), unique=True, nullable=False, index=True)
    customer_name = Column(String(150), nullable=False)
    customer_email = Column(String(255), nullable=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id", ondelete="RESTRICT"), nullable=False, index=True)
    total_amount = Column(Numeric(10, 2), nullable=False, default=0.00)
    status = Column(String(32), nullable=False, default="COMPLETED")
    order_date = Column(DateTime(timezone=True), default=utcnow, index=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    __table_args__ = (
        CheckConstraint("total_amount >= 0", name="chk_order_total_non_neg"),
        CheckConstraint("status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED')", name="chk_order_status"),
    )

    # Relationships
    warehouse = relationship("Warehouse", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="RESTRICT"), nullable=False, index=True)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    subtotal = Column(Numeric(10, 2), nullable=False)

    __table_args__ = (
        CheckConstraint("quantity > 0", name="chk_order_item_qty_pos"),
        CheckConstraint("unit_price >= 0", name="chk_order_item_price_non_neg"),
        CheckConstraint("subtotal >= 0", name="chk_order_item_subtotal_non_neg"),
    )

    # Relationships
    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")
