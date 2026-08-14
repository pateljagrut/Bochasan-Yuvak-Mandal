"""
Pydantic Data Models & Schemas.

Defines request structures, response payloads, and data validation rules
for Yuvak registration, login, attendance marking, content posts, and admin management.
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date, datetime

# ==========================================
# Authentication & User Registration Schemas
# ==========================================

class YuvakRegisterRequest(BaseModel):
    """
    Schema for Yuvak Registration request.
    Collects Full Name, Mobile Number, Date of Birth, and Location.
    """
    full_name: str = Field(..., example="Rohan Patel", description="Full name of the Yuvak")
    mobile_no: str = Field(..., example="9876543210", description="10-digit mobile number")
    dob: str = Field(..., example="2002-05-15", description="Date of birth (YYYY-MM-DD)")
    location: str = Field(..., example="Bochasan", description="Mandal or city location")
    password: Optional[str] = Field(None, description="Optional custom password. Defaults to mobile number.")

class YuvakRegisterResponse(BaseModel):
    """
    Schema returned after successful Yuvak registration.
    Includes the auto-generated unique Yuvak ID.
    """
    success: bool
    message: str
    yuvak_id: str = Field(..., example="ROH3210", description="Generated ID: Upper(First 3 letters) + Last 4 mobile digits")
    full_name: str
    mobile_no: str
    location: str
    role: str = "yuvak"

class LoginRequest(BaseModel):
    """
    Schema for Smart Login.
    Accepts Yuvak ID, Mobile Number, or Admin Username along with password.
    """
    identifier: str = Field(..., example="ROH3210", description="Yuvak ID, Mobile Number, or Admin Username")
    password: str = Field(..., example="9876543210", description="User password")

class LoginResponse(BaseModel):
    """
    Schema returned on successful login containing session token and user details.
    """
    success: bool
    message: str
    access_token: str
    token_type: str = "bearer"
    role: str = Field(..., example="yuvak", description="Role: 'yuvak' or 'admin'")
    user: dict

class CreateKaryakarRequest(BaseModel):
    """
    Schema for Admin-protected endpoint to create a new Karyakar (Admin) profile.
    """
    username: str = Field(..., example="karyakar_rohan", description="Unique admin username")
    password: str = Field(..., example="SecurePass123", description="Admin password")
    full_name: str = Field(..., example="Rohan Patel (Karyakar)", description="Admin full name")
    dob: Optional[str] = Field(None, example="1995-04-15", description="Admin date of birth (YYYY-MM-DD)")
    mobile_no: str = Field(..., example="9876543210", description="10-digit mobile number")
    location: str = Field(..., example="Bochasan", description="Admin center location")

# ==========================================
# Profile & Attendance Schemas
# ==========================================

class YuvakProfileUpdate(BaseModel):
    """
    Schema allowing Karyakars to update a Yuvak's profile details.
    """
    full_name: Optional[str] = None
    mobile_no: Optional[str] = None
    dob: Optional[str] = None
    location: Optional[str] = None
    status: Optional[str] = Field(None, example="active", description="Status: 'active' or 'inactive'")

class AttendanceMarkRequest(BaseModel):
    """
    Schema for Karyakars to mark sabha attendance for a specific date.
    """
    sabha_date: str = Field(..., example="2026-08-02", description="Sabha date in YYYY-MM-DD format")
    sabha_title: Optional[str] = Field("Ravivariya Yuvak Sabha", description="Title or theme of the Sabha")
    present_yuvak_ids: List[str] = Field(..., description="List of Yuvak IDs present in this Sabha")

class ContentPostRequest(BaseModel):
    """
    Schema for uploading Sabha announcements, Niyama feeds, or inspirational thoughts.
    """
    title: str = Field(..., example="Weekly Sabha Theme: Satsang Diksha")
    content: str = Field(..., example="Join us this Sunday at 6:00 PM for an engaging session...")
    category: str = Field("announcement", example="announcement", description="Category: 'announcement', 'niyama', or 'schedule'")
    author: Optional[str] = Field("Mandal Karyakar Team", description="Author or publishing entity")

class EventPhotoPostRequest(BaseModel):
    """
    Schema for uploading Utsav & Prasang Event Photos.
    """
    title: str = Field(..., example="Hindola Utsav 2026")
    event_date: str = Field(..., example="2026-08-04")
    category: str = Field("Utsav", example="Utsav", description="Category: 'Utsav', 'Sabha', 'Cultural', 'Prasang'")
    image_url: str = Field(..., example="https://images.unsplash.com/photo-1609766857041-ed402ea8069a")
    author: Optional[str] = Field("Bochasan Media Team")
