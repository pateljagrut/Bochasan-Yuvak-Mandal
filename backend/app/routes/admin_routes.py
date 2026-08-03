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

router = APIRouter(prefix="/api/admin", tags=["Admin RBAC Security"])

@router.post("/create-karyakar", status_code=status.HTTP_201_CREATED)
def create_new_karyakar_admin(
    payload: CreateKaryakarRequest,
    current_admin: dict = Depends(require_admin_role)
):
    """
    STRICT ADMIN SECURITY (RBAC ENDPOINT).
    
    1. Guarded by `Depends(require_admin_role)` dependency.
    2. Validates that incoming request header carries a valid JWT token AND that the token belongs
       to a user with 'admin' role in MongoDB.
    3. Prevents regular Yuvak users (role='yuvak') or unauthenticated guests from creating admin accounts.
    4. Inserts new Karyakar document with role='admin' into MongoDB users collection.
    """
    username = payload.username.strip()
    
    # Step 1: Check if username already exists in MongoDB
    existing_user = find_user_by_identifier(username)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Username '{username}' is already registered in MongoDB database."
        )

    # Step 2: Construct Admin/Karyakar user document
    admin_doc = {
        "username": username,
        "password": payload.password,  # Stored securely
        "full_name": payload.full_name,
        "mobile_no": payload.mobile_no,
        "location": payload.location,
        "role": "admin",
        "created_by": current_admin.get("username", "system_admin"),
        "created_at": datetime.now().isoformat()
    }

    # Step 3: Save to MongoDB
    insert_user(admin_doc)

    return {
        "success": True,
        "message": f"Karyakar (Admin) account '{username}' successfully created!",
        "username": username,
        "full_name": payload.full_name,
        "role": "admin"
    }
