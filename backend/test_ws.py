import asyncio
import json
import pytest
from fastapi.testclient import TestClient
from app.main import app

def test_websocket_broadcast():
    client = TestClient(app)
    with client.websocket_connect("/ws") as websocket:
        # Handshake message
        handshake = websocket.receive_json()
        assert handshake["event"] == "CONNECTED"

        # Trigger inventory adjustment
        res = client.post("/api/inventory/adjust", json={
            "product_id": 1,
            "warehouse_id": 1,
            "adjustment": 2,
            "reason": "WebSocket Live Test"
        })
        assert res.status_code == 200

        # Receive real-time broadcast message on websocket
        message = websocket.receive_json()
        assert message["event"] == "INVENTORY_UPDATED"
        assert message["data"]["product_id"] == 1
        assert message["data"]["change"] == 2
        assert message["data"]["action"] == "add"
        print(f"\n[WS Test] Broadcast received successfully: {message['event']} -> {message['data']['product_name']} (new qty: {message['data']['new_quantity']})")

if __name__ == "__main__":
    test_websocket_broadcast()
