from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

# ----------------- Product Schemas -----------------
class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    sku: str = Field(..., min_length=1, max_length=64)
    category: str = Field(..., min_length=1, max_length=100)
    price: float = Field(..., ge=0.0)
    description: Optional[str] = None
    reorder_threshold: int = Field(default=10, ge=0)

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = Field(None, ge=0.0)
    description: Optional[str] = None
    reorder_threshold: Optional[int] = Field(None, ge=0)

class ProductOut(ProductBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    total_stock: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)

# ----------------- Warehouse Schemas -----------------
class WarehouseBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    code: str = Field(..., min_length=1, max_length=32)
    location: str = Field(..., min_length=1, max_length=255)
    capacity: int = Field(..., gt=0)

class WarehouseCreate(WarehouseBase):
    pass

class WarehouseUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    location: Optional[str] = None
    capacity: Optional[int] = Field(None, gt=0)

class WarehouseOut(WarehouseBase):
    id: int
    created_at: Optional[datetime] = None
    current_stock: Optional[int] = 0
    utilization_rate: Optional[float] = 0.0

    model_config = ConfigDict(from_attributes=True)

# ----------------- Inventory Schemas -----------------
class InventoryBase(BaseModel):
    product_id: int
    warehouse_id: int
    quantity: int = Field(..., ge=0)
    reorder_point: int = Field(default=15, ge=0)

class InventoryAdjust(BaseModel):
    product_id: int
    warehouse_id: int
    adjustment: int  # can be positive (add) or negative (remove)
    reason: Optional[str] = "Manual adjustment"

class InventoryTransfer(BaseModel):
    product_id: int
    source_warehouse_id: int
    destination_warehouse_id: int
    quantity: int = Field(..., gt=0)
    notes: Optional[str] = None

class InventoryOut(InventoryBase):
    id: int
    last_updated: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class InventoryDetailedOut(BaseModel):
    id: int
    product_id: int
    warehouse_id: int
    product_name: str
    sku: str
    category: str
    price: float
    warehouse_name: str
    warehouse_code: str
    warehouse_location: str
    quantity: int
    reorder_point: int
    status: str  # 'In Stock', 'Low Stock', 'Out of Stock'
    last_updated: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# ----------------- Order Item Schemas -----------------
class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)

class OrderItemOut(BaseModel):
    id: int
    product_id: int
    product_name: str
    sku: str
    quantity: int
    unit_price: float
    subtotal: float

    model_config = ConfigDict(from_attributes=True)

# ----------------- Order Schemas -----------------
class OrderCreate(BaseModel):
    customer_name: str = Field(..., min_length=1)
    customer_email: Optional[str] = None
    warehouse_id: int
    items: List[OrderItemCreate] = Field(..., min_length=1)

class OrderStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(PENDING|PROCESSING|COMPLETED|CANCELLED)$")

class OrderOut(BaseModel):
    id: int
    order_number: str
    customer_name: str
    customer_email: Optional[str] = None
    warehouse_id: int
    warehouse_name: Optional[str] = None
    total_amount: float
    status: str
    order_date: Optional[datetime] = None
    items_count: Optional[int] = 0
    items: List[OrderItemOut] = []

    model_config = ConfigDict(from_attributes=True)

# ----------------- Analytics & Stats -----------------
class DashboardStatsOut(BaseModel):
    total_products: int
    total_inventory_units: int
    low_stock_count: int
    out_of_stock_count: int
    todays_orders_count: int
    todays_revenue: float
    active_warehouses_count: int

# ----------------- WebSocket Real-time Event -----------------
class WSEvent(BaseModel):
    event: str  # e.g., 'INVENTORY_UPDATE', 'ORDER_CREATED', 'STOCK_TRANSFER'
    data: dict
    timestamp: str
