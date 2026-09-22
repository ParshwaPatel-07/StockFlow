import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models import Product, Warehouse, Inventory, Order

client = TestClient(app)

def test_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"

def test_analytics_dashboard():
    res = client.get("/api/analytics/dashboard")
    assert res.status_code == 200
    data = res.json()
    assert data["total_products"] >= 20
    assert data["active_warehouses_count"] == 4
    assert data["total_inventory_units"] > 0

def test_inventory_list():
    res = client.get("/api/inventory")
    assert res.status_code == 200
    items = res.json()
    assert len(items) > 0
    # verify item schema
    first = items[0]
    assert "product_name" in first
    assert "warehouse_name" in first
    assert "status" in first

def test_stock_adjustment():
    # Test stock addition
    res = client.post("/api/inventory/adjust", json={
        "product_id": 1,
        "warehouse_id": 1,
        "adjustment": 5,
        "reason": "Test restock"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["data"]["action"] == "add"

def test_order_creation_transaction_success():
    # Order 1 unit of product 1 from warehouse 1
    res = client.post("/api/orders", json={
        "customer_name": "Test Client Inc",
        "customer_email": "test@client.com",
        "warehouse_id": 1,
        "items": [
            {"product_id": 1, "quantity": 1}
        ]
    })
    assert res.status_code == 201
    order = res.json()
    assert order["customer_name"] == "Test Client Inc"
    assert order["status"] == "COMPLETED"
    assert len(order["items"]) == 1

def test_order_creation_insufficient_stock_rollback():
    # Attempt to order an impossible quantity (e.g. 99999 units)
    res = client.post("/api/orders", json={
        "customer_name": "Greedy Buyer",
        "customer_email": "fail@greedy.com",
        "warehouse_id": 1,
        "items": [
            {"product_id": 1, "quantity": 999999}
        ]
    })
    assert res.status_code == 400
    assert "Insufficient inventory" in res.json()["detail"]
