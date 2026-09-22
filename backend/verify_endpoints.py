from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

print("="*60)
print("1. VERIFYING /api/health")
print("="*60)
health = client.get("/api/health").json()
for k, v in health.items():
    print(f"  {k}: {v}")
assert health["database_engine"] == "postgresql"
assert health["products_count"] >= 20
assert health["warehouses_count"] >= 4

print("\n" + "="*60)
print("2. VERIFYING /api/analytics/dashboard")
print("="*60)
analytics = client.get("/api/analytics/dashboard").json()
for k, v in analytics.items():
    print(f"  {k}: {v}")
assert analytics["total_products"] >= 20
assert analytics["total_inventory_units"] > 0
assert analytics["active_warehouses_count"] >= 4

print("\n" + "="*60)
print("3. VERIFYING /api/products")
print("="*60)
products = client.get("/api/products").json()
print(f"Total Products: {len(products)}")
assert len(products) >= 20
for p in products[:5]:
    print(f"  - [{p['sku']}] {p['name']} (${p['price']}) - Stock: {p['total_stock']}")

print("\n" + "="*60)
print("4. VERIFYING /api/warehouses")
print("="*60)
warehouses = client.get("/api/warehouses").json()
print(f"Total Warehouses: {len(warehouses)}")
assert len(warehouses) >= 4
for w in warehouses:
    print(f"  - [{w['code']}] {w['name']} ({w['location']}): {w['current_stock']}/{w['capacity']} ({w['utilization_rate']}%)")

print("\n" + "="*60)
print("5. VERIFYING /api/inventory")
print("="*60)
inventory = client.get("/api/inventory").json()
print(f"Total Inventory records: {len(inventory)}")
assert len(inventory) >= 80
in_stock = len([i for i in inventory if i['status'] == 'In Stock'])
low_stock = len([i for i in inventory if i['status'] == 'Low Stock'])
out_of_stock = len([i for i in inventory if i['status'] == 'Out of Stock'])
print(f"  In Stock: {in_stock}, Low Stock: {low_stock}, Out of Stock: {out_of_stock}")

print("\n" + "="*60)
print("6. VERIFYING /api/orders")
print("="*60)
orders = client.get("/api/orders").json()
print(f"Total Orders: {len(orders)}")
assert len(orders) >= 7
for o in orders[:4]:
    print(f"  - [{o['order_number']}] {o['customer_name']} | ${o['total_amount']:.2f} | Status: {o['status']} | Items: {o['items_count']}")

print("\n" + "="*60)
print("✅ ALL ENDPOINTS VERIFIED ON POSTGRESQL WITH FULL SEED DATA!")
print("="*60)
