"""
Karyakar (Admin) Operational API Routes.

Provides endpoints for Karyakars to manage Yuvak profiles,
mark/update Sabha attendance checkboxes, upload content feeds, and view stats.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime
import uuid

from app.auth import get_current_user, require_admin_role
from app.models import YuvakProfileUpdate, AttendanceMarkRequest, ContentPostRequest
from app.db import (
    get_all_yuvaks, update_yuvak_profile, insert_attendance_record, 
    get_all_attendance_records, insert_content_feed, find_user_by_identifier
)

router = APIRouter(prefix="/api/karyakar", tags=["Karyakar Management"])

@router.get("/yuvaks")
def list_all_yuvaks(current_user: dict = Depends(get_current_user)):
    """
    Retrieves list of all registered Yuvaks from MongoDB.
    Accessible by Karyakars for directory viewing and attendance management.
    """
    yuvaks = get_all_yuvaks()
    # Compute individual attendance percentages for display in Karyakar directory table
    all_sessions = get_all_attendance_records()
    total_sabhas = len(all_sessions)

    enhanced_yuvaks = []
    for y in yuvaks:
        y_copy = y.copy()
        y_copy.pop("password", None)
        yuvak_id = y.get("yuvak_id", "")
        
        attended = sum(1 for s in all_sessions if yuvak_id in s.get("present_yuvak_ids", []))
        y_copy["total_sabhas"] = total_sabhas
        y_copy["attended_sabhas"] = attended
        y_copy["attendance_pct"] = round((attended / total_sabhas * 100), 1) if total_sabhas > 0 else 100.0
        enhanced_yuvaks.append(y_copy)

    return {"success": True, "count": len(enhanced_yuvaks), "yuvaks": enhanced_yuvaks}

@router.put("/yuvak/{yuvak_id}")
def edit_yuvak_profile(yuvak_id: str, payload: YuvakProfileUpdate, current_user: dict = Depends(get_current_user)):
    """
    Updates a Yuvak's profile information (Location, DOB, Mobile, Full Name).
    Must be logged in with admin/karyakar authorization.
    """
    existing = find_user_by_identifier(yuvak_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Yuvak with ID '{yuvak_id}' not found in MongoDB database."
        )

    # Filter out None fields
    update_data = {k: v for k, v in payload.dict().items() if v is not None}
    if not update_data:
        return {"success": True, "message": "No changes requested."}

    success = update_yuvak_profile(yuvak_id, update_data)
    return {
        "success": True, 
        "message": f"Successfully updated profile for Yuvak ID '{yuvak_id}'.",
        "updated_fields": list(update_data.keys())
    }

@router.post("/attendance")
def record_sabha_attendance(payload: AttendanceMarkRequest, current_user: dict = Depends(get_current_user)):
    """
    Records or updates Sabha attendance for a specific date using checkbox grid selections.
    """
    attendance_doc = {
        "sabha_date": payload.sabha_date,
        "sabha_title": payload.sabha_title,
        "present_yuvak_ids": payload.present_yuvak_ids,
        "marked_by": current_user.get("username") or current_user.get("full_name"),
        "created_at": datetime.now().isoformat()
    }
    
    insert_attendance_record(attendance_doc)
    
    return {
        "success": True,
        "message": f"Attendance successfully saved for Sabha on {payload.sabha_date}.",
        "sabha_date": payload.sabha_date,
        "total_present": len(payload.present_yuvak_ids)
    }

@router.get("/attendance-sessions")
def get_attendance_sessions(current_user: dict = Depends(get_current_user)):
    """
    Returns list of recorded Sabha attendance sessions.
    """
    sessions = get_all_attendance_records()
    return {"success": True, "count": len(sessions), "sessions": sessions}

@router.post("/content")
def post_content_feed(payload: ContentPostRequest, current_user: dict = Depends(get_current_user)):
    """
    Uploads news announcements, Niyama feeds, or upcoming Sabha schedules.
    """
    content_doc = {
        "id": f"cnt_{uuid.uuid4().hex[:8]}",
        "title": payload.title,
        "content": payload.content,
        "category": payload.category,
        "author": payload.author or current_user.get("full_name", "Karyakar"),
        "created_at": datetime.now().isoformat()
    }
    
    insert_content_feed(content_doc)
    
    return {
        "success": True,
        "message": "Content published successfully!",
        "content_id": content_doc["id"]
    }
