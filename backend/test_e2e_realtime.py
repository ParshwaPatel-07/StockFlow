import asyncio
import json
import httpx
import websockets

async def run_simulation():
    api_url = "http://127.0.0.1:8000/api"
    ws_url = "ws://127.0.0.1:8000/ws"

    print(">>> 1. Checking backend health...")
    async with httpx.AsyncClient() as client:
        res = await client.get(f"{api_url}/health")
        assert res.status_code == 200, f"Health check failed: {res.text}"
        print(f"    Backend status: {res.json()}")

    print(">>> 2. Connecting Client A and Client B via WebSockets...")
    async with websockets.connect(ws_url) as ws_a, websockets.connect(ws_url) as ws_b:
        # Receive welcome messages
        handshake_a = json.loads(await ws_a.recv())
        handshake_b = json.loads(await ws_b.recv())
        print(f"    Client A Handshake: {handshake_a['event']}")
        print(f"    Client B Handshake: {handshake_b['event']}")

        print(">>> 3. Client A adds 20 units of Product 1 to Warehouse 1...")
        async with httpx.AsyncClient() as client:
            adjust_res = await client.post(f"{api_url}/inventory/adjust", json={
                "product_id": 1,
                "warehouse_id": 1,
                "adjustment": 20,
                "reason": "College Presentation Restock"
            })
            assert adjust_res.status_code == 200, f"Adjust stock failed: {adjust_res.text}"
            print(f"    Stock adjusted. Response: {adjust_res.json()['message']}")

        # Verify Client B receives broadcast immediately
        event_b = json.loads(await asyncio.wait_for(ws_b.recv(), timeout=2.0))
        print(f"    Client B received broadcast: {event_b['event']}")
        print(f"    Details: {event_b['data']['product_name']} stock changed: {event_b['data']['old_quantity']} -> {event_b['data']['new_quantity']}")
        assert event_b["event"] == "INVENTORY_UPDATED"
        assert event_b["data"]["change"] == 20
        assert event_b["data"]["action"] == "add"

        # Client A also receives the broadcast
        event_a = json.loads(await asyncio.wait_for(ws_a.recv(), timeout=2.0))
        assert event_a["event"] == "INVENTORY_UPDATED"

        print(">>> 4. Client B creates a new order for Product 1 (5 units)...")
        async with httpx.AsyncClient() as client:
            order_res = await client.post(f"{api_url}/orders", json={
                "customer_name": "Presentation Evaluator",
                "customer_email": "evaluator@university.edu",
                "warehouse_id": 1,
                "items": [{"product_id": 1, "quantity": 5}]
            })
            assert order_res.status_code == 201, f"Create order failed: {order_res.text}"
            order_data = order_res.json()
            print(f"    Order created: {order_data['order_number']} for ${order_data['total_amount']}")

        # Verify Client A receives ORDER_CREATED and INVENTORY_UPDATED
        order_event_a = json.loads(await asyncio.wait_for(ws_a.recv(), timeout=2.0))
        print(f"    Client A received event: {order_event_a['event']} (Order: {order_event_a['data']['order_number']})")
        assert order_event_a["event"] == "ORDER_CREATED"

        inv_event_a = json.loads(await asyncio.wait_for(ws_a.recv(), timeout=2.0))
        print(f"    Client A received event: {inv_event_a['event']} (Stock deduction: {inv_event_a['data']['change']})")
        assert inv_event_a["event"] == "INVENTORY_UPDATED"
        assert inv_event_a["data"]["change"] == -5

    print("\n✅ SUCCESS: Full real-time 2-client presentation scenario verified end-to-end!")

if __name__ == "__main__":
    asyncio.run(run_simulation())
