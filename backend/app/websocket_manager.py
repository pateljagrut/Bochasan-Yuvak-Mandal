"""
WebSocket Connection Manager for Real-Time Cross-Admin Synchronization.

Maintains active WebSocket connections from logged-in Admin clients and 
broadcasts real-time events (member profile updates, attendance changes, 
new admin registration, content posts) across all connected admin screens.
"""

from typing import List, Dict, Any
from fastapi import WebSocket, WebSocketDisconnect
import asyncio
import json
import logging

logger = logging.getLogger("Bochasan_ws")

class AdminConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.sse_queues: List[asyncio.Queue] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"[WS] New Admin client connected. Total active connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"[WS] Admin client disconnected. Remaining connections: {len(self.active_connections)}")

    def add_sse_queue(self) -> asyncio.Queue:
        q = asyncio.Queue()
        self.sse_queues.append(q)
        logger.info(f"[SSE] New Admin SSE stream connected. Total listeners: {len(self.sse_queues)}")
        return q

    def remove_sse_queue(self, q: asyncio.Queue):
        if q in self.sse_queues:
            self.sse_queues.remove(q)
            logger.info(f"[SSE] Admin SSE stream disconnected. Remaining listeners: {len(self.sse_queues)}")

    async def broadcast(self, event_type: str, payload: Dict[str, Any]):
        """
        Asynchronously sends JSON event message to all connected admin WebSockets and SSE streams.
        """
        message = {
            "event": event_type,
            "data": payload
        }
        
        logger.info(f"[BROADCAST] Event: {event_type} to {len(self.active_connections)} WebSockets & {len(self.sse_queues)} SSE streams")
        
        # Broadcast to WebSockets
        disconnected = []
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.warning(f"[WS ERROR] Broadcast failed for client: {e}")
                disconnected.append(connection)

        for conn in disconnected:
            self.disconnect(conn)

        # Broadcast to SSE queues
        for q in list(self.sse_queues):
            try:
                q.put_nowait(message)
            except Exception as e:
                logger.warning(f"[SSE ERROR] Queue put failed: {e}")

    def broadcast_sync(self, event_type: str, payload: Dict[str, Any]):
        """
        Synchronous wrapper to trigger async broadcast from standard FastAPI route handlers.
        """
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                asyncio.create_task(self.broadcast(event_type, payload))
            else:
                loop.run_until_complete(self.broadcast(event_type, payload))
        except Exception as e:
            logger.warning(f"[SYNC BROADCAST] Failed to send broadcast: {e}")

# Global singleton instance of AdminConnectionManager
ws_manager = AdminConnectionManager()

