"""
Pydantic Data Models & Schemas.

Defines request structures, response payloads, and data validation rules
for Yuvak registration, login, attendance marking, content posts, and admin management.
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

# ==========================================
# Authentication & User Registration Schemas
# ==========================================

class YuvakRegisterRequest(BaseModel):
    """
    Schema for Yuvak Registration request.
    Collects Full Name, Mobile Number, Date of Birth, and Location.
    """
    full_name: str = Field(description="Full name of the Yuvak", examples=["Rohan Patel"])
    mobile_no: str = Field(description="10-digit mobile number", examples=["9876543210"])
    dob: str = Field(description="Date of birth (YYYY-MM-DD)", examples=["2002-05-15"])
    location: str = Field(description="Mandal or city location", examples=["Bochasan"])
    password: Optional[str] = Field(default=None, description="Optional custom password. Defaults to mobile number.")

class YuvakRegisterResponse(BaseModel):
    """
    Schema returned after successful Yuvak registration.
    Includes the auto-generated unique Yuvak ID.
    """
    success: bool
    message: str
    yuvak_id: str = Field(description="Generated ID: Upper(First 3 letters) + DOB (DDMM)", examples=["DHE2712"])
    full_name: str
    mobile_no: str
    location: str
    role: str = "yuvak"

class LoginRequest(BaseModel):
    """
    Schema for Smart Login.
    Accepts Yuvak ID, Mobile Number, or Admin Username along with password.
    """
    identifier: str = Field(description="Yuvak ID, Mobile Number, or Admin Username", examples=["DHE2712"])
    password: str = Field(description="User password", examples=["9876543210"])

class LoginResponse(BaseModel):
    """
    Schema returned on successful login containing session token and user details.
    """
    success: bool
    message: str
    access_token: str
    token_type: str = "bearer"
    role: str = Field(description="Role: 'yuvak' or 'admin'", examples=["yuvak"])
    user: dict

class CreateKaryakarRequest(BaseModel):
    """
    Schema for Admin-protected endpoint to create a new Karyakar (Admin) profile.
    """
    username: str = Field(description="Unique admin username", examples=["karyakar_rohan"])
    password: str = Field(description="Admin password", examples=["SecurePass123"])
    full_name: str = Field(description="Admin full name", examples=["Rohan Patel (Karyakar)"])
    dob: Optional[str] = Field(default=None, description="Admin date of birth (YYYY-MM-DD)", examples=["1995-04-15"])
    mobile_no: str = Field(description="10-digit mobile number", examples=["9876543210"])
    location: str = Field(description="Admin center location", examples=["Bochasan"])

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
    status: Optional[str] = Field(default=None, description="Status: 'active' or 'inactive'", examples=["active"])

class AttendanceMarkRequest(BaseModel):
    """
    Schema for Karyakars to mark sabha attendance for a specific date.
    """
    sabha_date: str = Field(description="Sabha date in YYYY-MM-DD format", examples=["2026-08-02"])
    sabha_title: Optional[str] = Field(default="Saturday Yuvak Sabha", description="Title or theme of the Sabha")
    present_yuvak_ids: List[str] = Field(default_factory=list, description="List of Yuvak IDs present in this Sabha")

class ContentPostRequest(BaseModel):
    """
    Schema for uploading Sabha announcements, Niyama feeds, or inspirational thoughts.
    """
    title: str = Field(description="Title of the announcement or theme", examples=["Weekly Sabha Theme: Satsang Diksha"])
    content: str = Field(description="Body content of the post", examples=["Join us this Saturday at 8:30 PM for an engaging session..."])
    category: str = Field(default="announcement", description="Category: 'announcement', 'niyama', or 'schedule'", examples=["announcement"])
    author: Optional[str] = Field(default="Mandal Karyakar Team", description="Author or publishing entity")

class ContentUpdateRequest(BaseModel):
    """
    Schema for editing Sabha announcements or Niyama feeds.
    """
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    author: Optional[str] = None

class EventPhotoPostRequest(BaseModel):
    """
    Schema for uploading Utsav & Prasang Event Photos.
    """
    title: str = Field(description="Event photo title", examples=["Hindola Utsav 2026"])
    event_date: str = Field(description="Event date in YYYY-MM-DD format", examples=["2026-08-04"])
    category: str = Field(default="Utsav", description="Category: 'Utsav', 'Sabha', 'Cultural', 'Prasang'", examples=["Utsav"])
    image_url: str = Field(description="Image URL", examples=["https://images.unsplash.com/photo-1609766857041-ed402ea8069a"])
    author: Optional[str] = Field(default="Bochasan Media Team")

class EventPhotoUpdateRequest(BaseModel):
    """
    Schema for updating Utsav & Prasang Event Photos.
    """
    title: Optional[str] = None
    event_date: Optional[str] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    author: Optional[str] = None

# ==========================================
# Hero Photo Slideshow Schemas
# ==========================================

class SlideshowSlide(BaseModel):
    """
    Schema for a single slide in the BAPS Hero Photo Slideshow.
    """
    id: str = Field(default="", description="Unique slide ID", examples=["slide_1"])
    image: str = Field(default="/slides/slide1_mandir.jpg", description="Image URL or public path", examples=["/slides/slide1_mandir.jpg"])
    badge: Optional[str] = Field(default="Bochasan Mandal", description="Category badge", examples=["Bochasan Tirthdham"])
    badge_color: Optional[str] = Field(default="#ff7a18", description="Badge accent color", examples=["#ff7a18"])
    title: Optional[str] = Field(default="Bochasan Swaminarayan Akshar Mandir", description="Slide heading title", examples=["Bochasan Swaminarayan Akshar Mandir"])
    subtitle: Optional[str] = Field(default="The Sacred Foundation of Akshar Purushottam Satsang", description="Slide description", examples=["The Sacred Foundation of Akshar Purushottam Satsang"])
    cta_text: Optional[str] = Field(default="Explore Portal", description="Button call to action text", examples=["Explore Mandal Portal"])
    action_tab: Optional[str] = Field(default="attendance", description="Target workspace tab", examples=["attendance"])
    order: Optional[int] = Field(default=1, description="Sort display order")
    is_active: Optional[bool] = Field(default=True, description="Whether slide is displayed")
    fit_mode: Optional[str] = Field(default="auto", description="Image fit: auto, cover, contain")
    object_position: Optional[str] = Field(default="center center", description="Focal positioning: center center, top center, bottom center")

class SlideshowUpdateRequest(BaseModel):
    """
    Schema for full batch update of slideshow slides.
    """
    slides: List[SlideshowSlide]

class UpcomingSabhaScheduleRequest(BaseModel):
    """
    Schema for configuring Upcoming Saturday Sabha schedule & details.
    """
    title: Optional[str] = Field(default="Upcoming Saturday Sabha", examples=["Upcoming Saturday Sabha"])
    date_str: Optional[str] = Field(default=None, examples=["Saturday, Aug 22, 2026"])
    timing: Optional[str] = Field(default="8:30 PM IST", examples=["8:30 PM IST"])
    venue: Optional[str] = Field(default="Mahant Hall 1st floor", examples=["Mahant Hall 1st floor"])
    description: Optional[str] = Field(
        default="Weekly spiritual session, youth leadership development, Satsang Chintan and Mahaprasad.",
        examples=["Weekly spiritual session, youth leadership development, Satsang Chintan and Mahaprasad."]
    )
    target_attendance: Optional[str] = Field(default="100% Attendance", examples=["100% Attendance"])
    status_badge: Optional[str] = Field(default="● Saturday Scheduled", examples=["● Saturday Scheduled"])

# ==========================================
# SMS Notification Models
# ==========================================

class SendSmsRequest(BaseModel):
    """
    Schema for sending SMS broadcasts or targeted messages.
    """
    message: str = Field(description="SMS message content to broadcast", examples=["Jai Swaminarayan! Reminder for Saturday Sabha at 8:30 PM."])
    recipient_mode: str = Field(default="all", description="Mode: 'all', 'selected', or 'custom'", examples=["all"])
    yuvak_ids: Optional[List[str]] = Field(default_factory=list, description="Specific Yuvak IDs to send to when recipient_mode='selected'")
    custom_numbers: Optional[List[str]] = Field(default_factory=list, description="Manual phone numbers when recipient_mode='custom'")
    template_type: Optional[str] = Field(default="custom", description="Template category: 'sabha_reminder', 'utsav', 'absence', 'custom'")

class SmsLogEntry(BaseModel):
    """
    Schema for SMS broadcast delivery records.
    """
    id: str
    sent_by: str
    sent_at: str
    message: str
    template_type: str
    recipient_count: int
    recipients: List[str]
    provider: str
    status: str
    delivery_report: Optional[Dict[str, Any]] = None

