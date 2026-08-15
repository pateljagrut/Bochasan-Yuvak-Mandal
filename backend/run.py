"""
Standalone Backend Server Runner.

Executes Uvicorn ASGI server to host the FastAPI application on http://127.0.0.1:8000.
"""

import uvicorn
import os
import sys

# Ensure backend root is in PYTHONPATH
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    print(f"Starting Bochasan Yuvak Mandal Attendance API Server on {host}:{port}...")
    uvicorn.run("app.main:app", host=host, port=port, reload=True)

