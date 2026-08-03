"""
FastAPI Main Application Entry Point.

Configures application routes, CORS security, database initialization,
and server startup lifecycle events.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.db import init_db
from app.routes.auth_routes import router as auth_router
from app.routes.yuvak_routes import router as yuvak_router
from app.routes.karyakar_routes import router as karyakar_router
from app.routes.admin_routes import router as admin_router
from app.routes.content_routes import router as content_router

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

# Configure Cross-Origin Resource Sharing (CORS) for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows connections from React frontend (http://localhost:5173)
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
