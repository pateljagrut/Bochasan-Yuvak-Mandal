"""
FastAPI Main Application Entry Point.

Configures application routes, CORS security, database initialization,
and server startup lifecycle events.
"""

import asyncio
import json
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware

from app.db import init_db
from app.routes.auth_routes import router as auth_router
from app.routes.yuvak_routes import router as yuvak_router
from app.routes.karyakar_routes import router as karyakar_router
from app.routes.admin_routes import router as admin_router
from app.routes.content_routes import router as content_router
from app.websocket_manager import ws_manager

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan event handler executed upon server startup and shutdown.
    Triggers MongoDB initialization and seeding before accepting HTTP traffic.
    """
    print("[INIT] Initializing Bochasan Yuvak Mandal Backend Server...")
    init_db()
    yield
    print("[SHUTDOWN] Shutting down backend server.")

# Initialize FastAPI instance with application metadata
app = FastAPI(
    title="Bochasan Yuvak Mandal Attendance Management System API",
    description="Backend service powering Smart Login, Auto Yuvak ID Generation, Role-Based Access Control, and Attendance tracking.",
    version="1.0.0",
    lifespan=lifespan
)

# Configure Cross-Origin Resource Sharing (CORS) for Netlify React Frontend
origins = [
    "https://starlit-sprite-8c8bb0.netlify.app",
    "https://starlit-sprite-8c8bb0.netlify.app/",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:8000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.netlify\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API route modules
app.include_router(auth_router)
app.include_router(yuvak_router)
app.include_router(karyakar_router)
app.include_router(admin_router)
app.include_router(content_router)

@app.websocket("/api/ws/admin")
async def admin_websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for connected Admin (Karyakar) clients.
    Broadcasts real-time events when any admin edits members, updates attendance, or creates admin accounts.
    """
    await ws_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)

@app.get("/api/admin/events")
async def admin_sse_endpoint():
    """
    Server-Sent Events (SSE) HTTP Streaming Endpoint for Admin real-time cross-sync.
    Works natively over HTTP on all Python environments without requiring external WebSocket packages.
    """
    q = ws_manager.add_sse_queue()

    async def event_generator():
        try:
            yield f"data: {json.dumps({'event': 'CONNECTED', 'data': {'status': 'connected'}})}\n\n"
            while True:
                try:
                    msg = await asyncio.wait_for(q.get(), timeout=15.0)
                    yield f"data: {json.dumps(msg)}\n\n"
                except asyncio.TimeoutError:
                    yield f": keep-alive\n\n"
        except asyncio.CancelledError:
            ws_manager.remove_sse_queue(q)
        finally:
            ws_manager.remove_sse_queue(q)

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@app.get("/api/events")
def get_events_direct():
    """Endpoint returning events list for axios.get('/api/events')."""
    from app.db import get_all_event_photos
    photos = get_all_event_photos()
    return {"success": True, "count": len(photos), "events": photos}

@app.get("/api/health")
def health_check():
    """Health check endpoint to verify backend operational status."""
    return {
        "status": "online",
        "service": "Bochasan Yuvak Mandal Attendance Backend",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

