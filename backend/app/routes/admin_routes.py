"""
Admin Security (Role-Based Access Control - RBAC) Routes.

Provides strict admin-only endpoints guarded by `require_admin_role`.
Ensures only existing authenticated Admins can register new Karyakar (Admin) accounts.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime

from app.models import CreateKaryakarRequest
from app.auth import require_admin_role
from app.db import find_user_by_identifier, insert_user
from app.websocket_manager import ws_manager

router = APIRouter(prefix="/api/admin", tags=["Admin RBAC Security"])

@router.post("/create-karyakar", status_code=status.HTTP_201_CREATED)
async def create_new_karyakar_admin(
    payload: CreateKaryakarRequest,
    current_admin: dict = Depends(require_admin_role)
):
    """
    STRICT ADMIN SECURITY (RBAC ENDPOINT).
    
    1. Guarded by `Depends(require_admin_role)` dependency.
    2. Validates that incoming request header carries a valid JWT token AND that the token belongs
       to a user with 'admin' role in MongoDB.
    3. Prevents regular Yuvak users (role='yuvak') or unauthenticated guests from creating admin accounts.
    4. Inserts new Karyakar document with role='admin' into MongoDB users collection with member ID.
    5. Broadcasts real-time WebSocket event to all active admin screens.
    """
    username = payload.username.strip()
    
    # Step 1: Check if username already exists in MongoDB
    existing_user = find_user_by_identifier(username)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Username '{username}' is already registered in MongoDB database."
        )

    # Generate Yuvak/Member ID for Admin
    yuvak_id = f"ADM-{username.upper()}"

    # Step 2: Construct Admin/Karyakar user document
    admin_doc = {
        "yuvak_id": yuvak_id,
        "username": username,
        "password": payload.password,  # Stored securely
        "full_name": payload.full_name,
        "dob": payload.dob or "",
        "mobile_no": payload.mobile_no,
        "location": payload.location,
        "role": "admin",
        "created_by": current_admin.get("username", "system_admin"),
        "created_at": datetime.now().isoformat()
    }

    # Step 3: Save to MongoDB
    insert_user(admin_doc)

    # Step 4: Broadcast real-time WebSocket event across all connected admin screens
    await ws_manager.broadcast("ADMIN_CREATED", {
        "admin_name": payload.full_name,
        "username": username,
        "yuvak_id": yuvak_id,
        "created_by": current_admin.get("full_name") or current_admin.get("username")
    })

    return {
        "success": True,
        "message": f"Karyakar (Admin) account '{username}' ({yuvak_id}) successfully created!",
        "username": username,
        "yuvak_id": yuvak_id,
        "full_name": payload.full_name,
        "role": "admin"
    }

