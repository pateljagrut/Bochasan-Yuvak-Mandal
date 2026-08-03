"""
Yuvak User Profile & Attendance API Routes.

Provides endpoints for Yuvaks to fetch their static profile details
and view their personal circular attendance metrics.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from app.auth import get_current_user
from app.db import get_all_attendance_records, get_all_content_feeds

router = APIRouter(prefix="/api/yuvak", tags=["Yuvak Profile & Attendance"])

@router.get("/profile")
def get_yuvak_profile(current_user: dict = Depends(get_current_user)):
    """
    Returns static profile details for the currently logged-in Yuvak user.
    """
    if current_user.get("role") != "yuvak":
        # If admin accesses this endpoint, return admin user profile object
        pass
        
    profile_data = {
        "yuvak_id": current_user.get("yuvak_id", "N/A"),
        "full_name": current_user.get("full_name", "Yuvak Member"),
        "mobile_no": current_user.get("mobile_no", "N/A"),
        "dob": current_user.get("dob", "N/A"),
        "location": current_user.get("location", "Bochasan"),
        "role": current_user.get("role", "yuvak"),
        "mandal": f"{current_user.get('location', 'Bochasan')} Yuvak Mandal",
        "registered_at": current_user.get("created_at", "2026-01-01")
    }
    return {"success": True, "profile": profile_data}

@router.get("/attendance")
def get_yuvak_attendance(current_user: dict = Depends(get_current_user)):
    """
    Calculates personal attendance metrics for the logged-in Yuvak.
    Computes total Sabhas held, Sabhas attended, percentage, and attendance log history.
    """
    yuvak_id = current_user.get("yuvak_id", "")
    all_sessions = get_all_attendance_records()
    
    total_sabhas = len(all_sessions)
    attended_sabhas = 0
    history = []
    
    for session in all_sessions:
        present_list = session.get("present_yuvak_ids", [])
        was_present = yuvak_id in present_list
        if was_present:
            attended_sabhas += 1
            
        history.append({
            "sabha_date": session.get("sabha_date"),
            "sabha_title": session.get("sabha_title", "Ravivariya Sabha"),
            "status": "Present" if was_present else "Absent"
        })

    percentage = round((attended_sabhas / total_sabhas * 100), 1) if total_sabhas > 0 else 100.0

    return {
        "success": True,
        "metrics": {
            "yuvak_id": yuvak_id,
            "full_name": current_user.get("full_name"),
            "total_sabhas": total_sabhas,
            "attended_sabhas": attended_sabhas,
            "absent_sabhas": total_sabhas - attended_sabhas,
            "attendance_percentage": percentage,
            "attendance_history": history
        }
    }
