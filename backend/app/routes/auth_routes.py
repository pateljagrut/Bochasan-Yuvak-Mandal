"""
Authentication & Registration Route Handlers.

Handles Yuvak registration with automatic Yuvak ID generation logic
and Unified Smart Login query routing based on MongoDB user roles.
"""

from fastapi import APIRouter, HTTPException, status
from datetime import datetime

from app.models import YuvakRegisterRequest, YuvakRegisterResponse, LoginRequest, LoginResponse
from app.db import find_user_by_identifier, insert_user
from app.auth import verify_password, create_access_token
from app.websocket_manager import ws_manager

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

def generate_yuvak_id(full_name: str, mobile_no: str) -> str:
    """
    Auto-Generates Unique Yuvak ID based on business rules:
    Formula: First 3 letters of Full Name (UPPERCASE) + Last 4 digits of Mobile Number.
    
    Example:
      Input:  Full Name = "Rohan Patel", Mobile = "9876543210"
      Step 1: First 3 letters -> "ROH"
      Step 2: Last 4 digits -> "3210"
      Result: "ROH3210"
    """
    # Clean non-alphabet characters and take first 3 letters uppercase
    name_clean = "".join(filter(str.isalpha, full_name)).upper()
    prefix = name_clean[:3] if len(name_clean) >= 3 else (name_clean + "YUV")[:3]
    
    # Extract last 4 digits of mobile number
    mobile_clean = "".join(filter(str.isdigit, mobile_no))
    suffix = mobile_clean[-4:] if len(mobile_clean) >= 4 else "0000"
    
    generated_id = f"{prefix}{suffix}"
    return generated_id

@router.post("/register", response_model=YuvakRegisterResponse, status_code=status.HTTP_201_CREATED)
def register_yuvak(payload: YuvakRegisterRequest):
    """
    Registers a new Yuvak profile into MongoDB and generates a unique Yuvak ID.
    
    1. Validates input parameters (Mobile format, Name).
    2. Calculates Yuvak ID (e.g. ROH3210 for Rohan + 9876543210).
    3. Checks MongoDB for duplicate mobile numbers or IDs.
    4. Inserts new user document with role='yuvak'.
    5. Returns Success payload for frontend Success Modal presentation.
    """
    # Step 1: Generate unique Yuvak ID
    yuvak_id = generate_yuvak_id(payload.full_name, payload.mobile_no)
    
    # Step 2: Check for existing user in MongoDB database
    existing_user_by_mobile = find_user_by_identifier(payload.mobile_no)
    if existing_user_by_mobile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Mobile number {payload.mobile_no} is already registered. Please login with Yuvak ID {existing_user_by_mobile.get('yuvak_id')}."
        )

    existing_user_by_id = find_user_by_identifier(yuvak_id)
    if existing_user_by_id:
        # Append a random digit if collisions occur (edge case handling)
        yuvak_id = f"{yuvak_id[:6]}1"

    # Step 3: Default password to mobile number if custom password not specified
    password_to_store = payload.password or payload.mobile_no

    # Step 4: Construct user MongoDB document
    user_doc = {
        "yuvak_id": yuvak_id,
        "full_name": payload.full_name,
        "mobile_no": payload.mobile_no,
        "dob": payload.dob,
        "location": payload.location,
        "password": password_to_store,
        "role": "yuvak",
        "created_at": datetime.now().isoformat()
    }

    # Step 5: Insert document into MongoDB database
    insert_user(user_doc)

    # Step 5b: Broadcast real-time event to active Admin screens
    ws_manager.broadcast_sync("MEMBER_ADDED", {
        "yuvak_id": yuvak_id,
        "full_name": payload.full_name,
        "location": payload.location
    })

    # Step 6: Return success response payload
    return YuvakRegisterResponse(
        success=True,
        message="Yuvak registration successful!",
        yuvak_id=yuvak_id,
        full_name=payload.full_name,
        mobile_no=payload.mobile_no,
        location=payload.location,
        role="yuvak"
    )

@router.post("/login", response_model=LoginResponse)
def smart_login(payload: LoginRequest):
    """
    Unified Smart Login Endpoint.
    
    1. Accepts Yuvak ID, Mobile Number, or Admin Username.
    2. Queries MongoDB database for user role ('yuvak' or 'admin').
    3. Validates credentials and returns JWT session token.
    4. Frontend uses the returned role to dynamically route to Yuvak or Karyakar Dashboard.
    """
    identifier = payload.identifier.strip()
    password = payload.password.strip()

    # Query MongoDB database for user record matching identifier
    user = find_user_by_identifier(identifier)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials: User not found in database."
        )

    # Validate password match
    stored_password = user.get("password")
    if not verify_password(password, stored_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials: Incorrect password."
        )

    # Determine user role from MongoDB document
    user_role = user.get("role", "yuvak")
    user_sub = user.get("username") if user_role == "admin" else user.get("yuvak_id", identifier)

    # Create signed JWT access token containing subject identifier and role
    token_payload = {
        "sub": user_sub,
        "role": user_role,
        "name": user.get("full_name", "User")
    }
    access_token = create_access_token(token_payload)

    # Clean sensitive password field from returned user dict
    user_data = user.copy()
    user_data.pop("password", None)
    if "_id" in user_data:
        user_data["_id"] = str(user_data["_id"])

    return LoginResponse(
        success=True,
        message=f"Login successful! Welcome {user.get('full_name')}.",
        access_token=access_token,
        token_type="bearer",
        role=user_role,
        user=user_data
    )
