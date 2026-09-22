import json
import logging
from datetime import datetime, timezone
from typing import List
from fastapi import WebSocket

logger = logging.getLogger("stockflow.websocket")

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Total clients: {len(self.active_connections)}")
        # Send welcome/handshake event
        await websocket.send_json({
            "event": "CONNECTED",
            "data": {
                "message": "StockFlow Real-Time Engine Connected",
                "active_connections": len(self.active_connections)
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        })

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket client disconnected. Total clients: {len(self.active_connections)}")

    async def broadcast(self, event: str, data: dict):
        """
        Broadcasts an event with payload to all connected clients.
        Dead connections are cleaned up automatically.
        """
        if not self.active_connections:
            logger.debug(f"Broadcast '{event}' suppressed: No active WebSocket clients.")
            return

        payload = {
            "event": event,
            "data": data,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        logger.info(f"Broadcasting event: '{event}' to {len(self.active_connections)} client(s).")
        
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(payload)
            except Exception as e:
                logger.warning(f"Failed to send to client: {e}")
                disconnected.append(connection)

        for dead_conn in disconnected:
            self.disconnect(dead_conn)

manager = ConnectionManager()
