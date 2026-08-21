"""
Authentication & Authorization Security Module (RBAC & JWT).

Provides password hashing, JWT token encoding/decoding, and
Role-Based Access Control (RBAC) route dependencies.
Exhaustively documented for educational clarity.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt

from app.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from app.db import find_user_by_identifier

# HTTP Bearer scheme for token extraction from Authorization header
security_scheme = HTTPBearer()

def hash_password(plain_password: str) -> str:
    """
    Simulated password hashing helper (or standard string hash).
    In production, bcrypt/argon2 hashing is used.
    """
    return f"hashed_{plain_password}"

def verify_password(plain_password: str, hashed_password: Optional[str]) -> bool:
    """
    Verifies plain text password against stored hash/password string.
    Supports both direct match and hashed match for initial seeded user convenience.
    """
    if not hashed_password:
        return False
    if hashed_password == plain_password:
        return True
    if hashed_password == f"hashed_{plain_password}":
        return True
    return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Generates a signed JWT access token containing claims such as
    user identifier, full name, and assigned role ('yuvak' or 'admin').
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security_scheme)) -> dict:
    """
    FastAPI dependency function to decode JWT token, extract token payload,
    query MongoDB for the matching user record, and inject into protected route handlers.
    
    Raises HTTP 401 Unauthorized if token is invalid or expired.
    """
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate authentication credentials or token expired",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Decode signed JWT payload using system SECRET_KEY
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        identifier = payload.get("sub")
        if not identifier or not isinstance(identifier, str):
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    # Query database for user document
    user = find_user_by_identifier(identifier)
    if user is None:
        raise credentials_exception
        
    return user

def require_admin_role(current_user: dict = Depends(get_current_user)) -> dict:
    """
    Strict Admin Role Security Dependency (RBAC Guard).
    Verifies that the authenticated user possesses an 'admin' role in MongoDB.
    
    Raises HTTP 403 Forbidden if a non-admin (e.g. regular Yuvak) attempts access.
    """
    user_role = current_user.get("role")
    if user_role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Strict Admin Security requires 'admin' role privileges."
        )
    return current_user
