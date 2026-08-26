"""
FastAPI Main Application Entry Point.
"""

import asyncio
import json
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from app.db import init_db
from app.routes.auth_routes import router as auth_router
from app.routes.yuvak_routes import router as yuvak_router
from app.routes.karyakar_routes import router as karyakar_router
from app.routes.admin_routes import router as admin_router
from app.routes.content_routes import router as content_router
from app.routes.sms_routes import router as sms_router
from app.websocket_manager import ws_manager



# -----------------------------
# Application Lifespan
# -----------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[INIT] Initializing Bochasan Yuvak Mandal Backend Server...")
    init_db()
    yield
    print("[SHUTDOWN] Backend Server Stopped")


# -----------------------------
# FastAPI App
# -----------------------------
app = FastAPI(
    title="Bochasan Yuvak Mandal Attendance Management System API",
    description="Backend service powering Smart Login, Auto Yuvak ID Generation, Role-Based Access Control and Attendance Tracking.",
    version="1.0.0",
    lifespan=lifespan,
)


# -----------------------------
# Root Endpoint
# -----------------------------
@app.get("/")
def root():
    return {
        "success": True,
        "message": "Bochasan Yuvak Mandal Backend is Running 🚀"
    }


# -----------------------------
# Health Check
# -----------------------------
@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "service": "Bochasan Yuvak Mandal Attendance Backend",
        "version": "1.0.0"
    }


# -----------------------------
# CORS
# -----------------------------
origins = [
    "https://bochasan-yuvak-mandal-attendence.netlify.app",
    "https://starlit-sprite-8c8bb0.netlify.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$|^https://.*\.netlify\.app$|^https://.*\.onrender\.com$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------
# Routers
# -----------------------------
app.include_router(auth_router)
app.include_router(yuvak_router)
app.include_router(karyakar_router)
app.include_router(admin_router)
app.include_router(content_router)
app.include_router(sms_router)



# -----------------------------
# Events API
# -----------------------------
@app.get("/api/events")
def get_events_direct():
    from app.db import get_all_event_photos

    photos = get_all_event_photos()

    return {
        "success": True,
        "count": len(photos),
        "events": photos
    }


# -----------------------------
# WebSocket (For All Users: Admins & Yuvaks)
# -----------------------------
@app.websocket("/api/ws")
@app.websocket("/api/ws/admin")
async def realtime_websocket_endpoint(websocket: WebSocket):
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


# -----------------------------
# Server Sent Events (For All Users: Admins & Yuvaks)
# -----------------------------
@app.get("/api/events/stream")
@app.get("/api/admin/events")
async def realtime_sse_endpoint():

    q = ws_manager.add_sse_queue()

    async def event_generator():
        try:
            yield f"data: {json.dumps({'event':'CONNECTED','data':{'status':'connected'}})}\n\n"

            while True:
                try:
                    msg = await asyncio.wait_for(q.get(), timeout=15.0)
                    yield f"data: {json.dumps(msg)}\n\n"

                except asyncio.TimeoutError:
                    yield ": keep-alive\n\n"

        except asyncio.CancelledError:
            ws_manager.remove_sse_queue(q)

        finally:
            ws_manager.remove_sse_queue(q)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
    )


# -----------------------------
# Local Run
# -----------------------------
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
    )