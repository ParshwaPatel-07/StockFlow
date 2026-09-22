import os
import sys

# Ensure backend directory is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))

from fastapi.testclient import TestClient
from app.main import app
from app.database import engine, SessionLocal
from sqlalchemy import text

client = TestClient(app)

def run_verification():
    print("=== Step 1: Health Check ===")
    health_resp = client.get("/api/health")
    assert health_resp.status_code == 200, f"Health check failed: {health_resp.text}"
    print("Health response:", health_resp.json())

    # Direct DB query for initial state
    print("\n=== Step 2: Fetch Initial Inventory State from PostgreSQL ===")
    with SessionLocal() as db:
        initial_rows = db.execute(text("SELECT product_id, warehouse_id, quantity FROM inventory ORDER BY product_id, warehouse_id")).fetchall()
        initial_map = {(row[0], row[1]): row[2] for row in initial_rows}
        
        products = db.execute(text("SELECT id, name, sku FROM products WHERE id IN (1, 2, 3, 4) ORDER BY id")).fetchall()
        prod_names = {p[0]: p[1] for p in products}
        print("Test targets:")
        for pid, name in prod_names.items():
            print(f"  Product {pid}: {name}")

    # Test targets:
    # Product 1: UltraPro Mechanical Keyboard (CONTROL - must NOT change!)
    # Product 2: ErgoFlow Wireless Mouse (Target A: +10)
    # Product 3: ProVision 27" 4K Monitor (Target B: +20)
    # Product 4: StudioSound ANC Headphones (Target C: -5)
    prod_a_id, wh_a_id = 2, 1
    prod_b_id, wh_b_id = 3, 2
    prod_c_id, wh_c_id = 4, 3
    ctrl_id = 1

    init_a = initial_map[(prod_a_id, wh_a_id)]
    init_b = initial_map[(prod_b_id, wh_b_id)]
    init_c = initial_map[(prod_c_id, wh_c_id)]
    init_ctrl_rows = {wh: qty for (pid, wh), qty in initial_map.items() if pid == ctrl_id}

    print(f"\nBaseline:")
    print(f"  Product 1 (Control - UltraPro Keyboard) across all warehouses: {init_ctrl_rows}")
    print(f"  Product A (ID {prod_a_id} '{prod_names[prod_a_id]}', WH {wh_a_id}): {init_a}")
    print(f"  Product B (ID {prod_b_id} '{prod_names[prod_b_id]}', WH {wh_b_id}): {init_b}")
    print(f"  Product C (ID {prod_c_id} '{prod_names[prod_c_id]}', WH {wh_c_id}): {init_c}")

    # Test 1: Add +10 to Product A
    print(f"\n=== Step 3: API Request 1 - Add +10 to Product A (ID {prod_a_id}) ===")
    payload_a = {
        "product_id": prod_a_id,
        "warehouse_id": wh_a_id,
        "adjustment": 10,
        "reason": "Test verification +10 Product A"
    }
    resp_a = client.post("/api/inventory/adjust", json=payload_a)
    assert resp_a.status_code == 200, f"Adjust A failed: {resp_a.text}"
    res_a_json = resp_a.json()
    print("Response A:", res_a_json)
    data_a = res_a_json["data"]
    assert data_a["product_id"] == prod_a_id, f"Expected product_id {prod_a_id}, got {data_a['product_id']}"
    assert data_a["warehouse_id"] == wh_a_id, f"Expected warehouse_id {wh_a_id}, got {data_a['warehouse_id']}"
    assert data_a["new_quantity"] == init_a + 10, f"Expected qty {init_a + 10}, got {data_a['new_quantity']}"

    # Test 2: Add +20 to Product B
    print(f"\n=== Step 4: API Request 2 - Add +20 to Product B (ID {prod_b_id}) ===")
    payload_b = {
        "product_id": prod_b_id,
        "warehouse_id": wh_b_id,
        "adjustment": 20,
        "reason": "Test verification +20 Product B"
    }
    resp_b = client.post("/api/inventory/adjust", json=payload_b)
    assert resp_b.status_code == 200, f"Adjust B failed: {resp_b.text}"
    res_b_json = resp_b.json()
    print("Response B:", res_b_json)
    data_b = res_b_json["data"]
    assert data_b["product_id"] == prod_b_id, f"Expected product_id {prod_b_id}, got {data_b['product_id']}"
    assert data_b["warehouse_id"] == wh_b_id, f"Expected warehouse_id {wh_b_id}, got {data_b['warehouse_id']}"
    assert data_b["new_quantity"] == init_b + 20, f"Expected qty {init_b + 20}, got {data_b['new_quantity']}"

    # Test 3: Deduct -5 from Product C
    print(f"\n=== Step 5: API Request 3 - Deduct -5 from Product C (ID {prod_c_id}) ===")
    payload_c = {
        "product_id": prod_c_id,
        "warehouse_id": wh_c_id,
        "adjustment": -5,
        "reason": "Test verification -5 Product C"
    }
    resp_c = client.post("/api/inventory/adjust", json=payload_c)
    assert resp_c.status_code == 200, f"Adjust C failed: {resp_c.text}"
    res_c_json = resp_c.json()
    print("Response C:", res_c_json)
    data_c = res_c_json["data"]
    assert data_c["product_id"] == prod_c_id, f"Expected product_id {prod_c_id}, got {data_c['product_id']}"
    assert data_c["warehouse_id"] == wh_c_id, f"Expected warehouse_id {wh_c_id}, got {data_c['warehouse_id']}"
    assert data_c["new_quantity"] == init_c - 5, f"Expected qty {init_c - 5}, got {data_c['new_quantity']}"

    # Step 6: Verify directly in PostgreSQL for ALL rows in inventory
    print("\n=== Step 6: Direct PostgreSQL Database Verification ===")
    with SessionLocal() as db:
        final_rows = db.execute(text("SELECT product_id, warehouse_id, quantity FROM inventory ORDER BY product_id, warehouse_id")).fetchall()
        final_map = {(row[0], row[1]): row[2] for row in final_rows}

    # Verify Product A
    actual_a = final_map[(prod_a_id, wh_a_id)]
    print(f"Product A (ID {prod_a_id} '{prod_names[prod_a_id]}', WH {wh_a_id}): Initial = {init_a}, Final = {actual_a} (Expected: {init_a + 10})")
    assert actual_a == init_a + 10, f"Product A mismatch in DB! Expected {init_a + 10}, got {actual_a}"

    # Verify Product B
    actual_b = final_map[(prod_b_id, wh_b_id)]
    print(f"Product B (ID {prod_b_id} '{prod_names[prod_b_id]}', WH {wh_b_id}): Initial = {init_b}, Final = {actual_b} (Expected: {init_b + 20})")
    assert actual_b == init_b + 20, f"Product B mismatch in DB! Expected {init_b + 20}, got {actual_b}"

    # Verify Product C
    actual_c = final_map[(prod_c_id, wh_c_id)]
    print(f"Product C (ID {prod_c_id} '{prod_names[prod_c_id]}', WH {wh_c_id}): Initial = {init_c}, Final = {actual_c} (Expected: {init_c - 5})")
    assert actual_c == init_c - 5, f"Product C mismatch in DB! Expected {init_c - 5}, got {actual_c}"

    # Verify Product 1 (UltraPro Keyboard) did NOT change
    print(f"\nVerifying Product 1 (UltraPro Mechanical Keyboard) across all warehouses:")
    for (pid, wid), qty in final_map.items():
        if pid == ctrl_id:
            orig = initial_map[(pid, wid)]
            print(f"  WH {wid}: Baseline = {orig}, Final = {qty} -> UNCHANGED ✓")
            assert qty == orig, f"Product 1 was modified in WH {wid}! Expected {orig}, got {qty}"

    # Verify every other inventory item did NOT change
    unchanged_count = 0
    for key, final_qty in final_map.items():
        if key not in [(prod_a_id, wh_a_id), (prod_b_id, wh_b_id), (prod_c_id, wh_c_id)]:
            orig_qty = initial_map[key]
            assert final_qty == orig_qty, f"Unexpected change in inventory item {key}! Was {orig_qty}, now {final_qty}"
            unchanged_count += 1

    print(f"\n==========================================")
    print(f"ALL TESTS PASSED PERFECTLY!")
    print(f"- Product A (+10) updated correctly.")
    print(f"- Product B (+20) updated correctly.")
    print(f"- Product C (-5) updated correctly.")
    print(f"- Product 1 ('UltraPro Mechanical Keyboard') remained 100% UNCHANGED.")
    print(f"- All remaining {unchanged_count} inventory records across PostgreSQL remained strictly unchanged.")
    print(f"==========================================")

if __name__ == "__main__":
    run_verification()
