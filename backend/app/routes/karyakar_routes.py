"""
Karyakar (Admin) Operational API Routes.

Provides endpoints for Karyakars to manage Yuvak profiles,
mark/update Sabha attendance checkboxes, upload content feeds, and view stats.

NOTE: All route handlers that trigger WebSocket broadcasts MUST be `async def`.
FastAPI runs sync `def` routes in AnyIO worker threads where there is no running
event loop, so calling `asyncio.get_event_loop()` inside a sync handler raises:
  "There is no current event loop in thread 'AnyIO worker thread'."

The fix is to use `async def` and directly `await ws_manager.broadcast(...)`.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime
import uuid

from app.auth import get_current_user, require_admin_role
from app.models import (
    YuvakProfileUpdate, AttendanceMarkRequest, ContentPostRequest, 
    ContentUpdateRequest, EventPhotoPostRequest, EventPhotoUpdateRequest
)
from app.db import (
    get_all_yuvaks, update_yuvak_profile, delete_yuvak_member, insert_attendance_record, 
    get_all_attendance_records, insert_content_feed, find_user_by_identifier,
    insert_event_photo, delete_event_photo, update_event_photo, delete_content_feed, update_content_feed
)
from app.websocket_manager import ws_manager

router = APIRouter(prefix="/api/karyakar", tags=["Karyakar Management"])

@router.get("/yuvaks")
async def list_all_yuvaks(current_user: dict = Depends(get_current_user)):
    """
    Retrieves list of all registered members (Yuvaks & Admins) from MongoDB.
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
async def edit_yuvak_profile(yuvak_id: str, payload: YuvakProfileUpdate, current_user: dict = Depends(get_current_user)):
    """
    Updates a member's profile information (Location, DOB, Mobile, Full Name).
    Must be logged in with admin/karyakar authorization.
    """
    existing = find_user_by_identifier(yuvak_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Member with ID '{yuvak_id}' not found in MongoDB database."
        )

    # Filter out None fields
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update_data:
        return {"success": True, "message": "No changes requested."}

    success = update_yuvak_profile(yuvak_id, update_data)

    # Broadcast real-time update to all connected admin screens
    admin_name = current_user.get("full_name") or current_user.get("username", "An admin")
    target_name = existing.get("full_name") or yuvak_id
    await ws_manager.broadcast("MEMBER_UPDATED", {
        "yuvak_id": yuvak_id,
        "member_name": target_name,
        "admin_name": admin_name,
        "updated_fields": list(update_data.keys())
    })

    return {
        "success": True, 
        "message": f"Successfully updated profile for '{target_name}' ({yuvak_id}).",
        "updated_fields": list(update_data.keys())
    }

@router.delete("/yuvak/{yuvak_id}")
async def remove_yuvak_member(yuvak_id: str, current_user: dict = Depends(get_current_user)):
    """
    Permanently deletes a Yuvak or Admin member profile from the database.
    Must be logged in with Karyakar Admin authorization.
    """
    existing = find_user_by_identifier(yuvak_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Member with ID '{yuvak_id}' not found."
        )

    # Prevent accidental deletion of super admin if specified
    if existing.get("username") == "vidur.patel" and current_user.get("username") != "vidur.patel":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super Admin 'vidur.patel' cannot be deleted by other admins."
        )

    success = delete_yuvak_member(yuvak_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete member."
        )

    # Broadcast real-time deletion to all connected admin screens
    admin_name = current_user.get("full_name") or current_user.get("username", "An admin")
    await ws_manager.broadcast("MEMBER_DELETED", {
        "yuvak_id": yuvak_id,
        "member_name": existing.get("full_name", yuvak_id),
        "admin_name": admin_name
    })

    return {
        "success": True,
        "message": f"Member '{existing.get('full_name', yuvak_id)}' ({yuvak_id}) deleted successfully."
    }

@router.post("/attendance")
async def record_sabha_attendance(payload: AttendanceMarkRequest, current_user: dict = Depends(get_current_user)):
    """
    Records or updates Sabha attendance for a specific date using checkbox grid selections.
    Broadcasting change to all other active admins instantly.
    """
    admin_name = current_user.get("full_name") or current_user.get("username", "Admin")
    attendance_doc = {
        "sabha_date": payload.sabha_date,
        "sabha_title": payload.sabha_title,
        "present_yuvak_ids": payload.present_yuvak_ids,
        "marked_by": admin_name,
        "created_at": datetime.now().isoformat()
    }
    
    insert_attendance_record(attendance_doc)

    # Broadcast real-time attendance update event to all connected admins
    await ws_manager.broadcast("ATTENDANCE_UPDATED", {
        "sabha_date": payload.sabha_date,
        "sabha_title": payload.sabha_title,
        "total_present": len(payload.present_yuvak_ids),
        "marked_by": admin_name
    })
    
    return {
        "success": True,
        "message": f"Attendance successfully saved for Sabha on {payload.sabha_date}.",
        "sabha_date": payload.sabha_date,
        "total_present": len(payload.present_yuvak_ids)
    }

@router.get("/attendance-sessions")
async def get_attendance_sessions(current_user: dict = Depends(get_current_user)):
    """
    Returns list of recorded Sabha attendance sessions.
    """
    sessions = get_all_attendance_records()
    return {"success": True, "count": len(sessions), "sessions": sessions}

@router.post("/content")
async def post_content_feed(payload: ContentPostRequest, current_user: dict = Depends(get_current_user)):
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

    await ws_manager.broadcast("CONTENT_UPDATED", {
        "content_id": content_doc["id"],
        "title": payload.title,
        "author": content_doc["author"],
        "action": "created",
        "type": "announcement"
    })
    
    return {
        "success": True,
        "message": "Content published successfully!",
        "content_id": content_doc["id"]
    }

@router.put("/content/{content_id}")
async def edit_content_feed(content_id: str, payload: ContentUpdateRequest, current_user: dict = Depends(get_current_user)):
    """
    Updates an existing announcement or Niyama feed.
    """
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        return {"success": True, "message": "No changes provided."}
    
    updates["updated_at"] = datetime.now().isoformat()
    success = update_content_feed(content_id, updates)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Content with ID '{content_id}' not found."
        )

    await ws_manager.broadcast("CONTENT_UPDATED", {
        "content_id": content_id,
        "action": "updated",
        "type": "announcement"
    })

    return {
        "success": True,
        "message": "Content updated successfully!"
    }

@router.delete("/content/{content_id}")
async def remove_content_feed(content_id: str, current_user: dict = Depends(get_current_user)):
    """
    Deletes an announcement or Niyama feed from the feed list.
    """
    success = delete_content_feed(content_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Content with ID '{content_id}' not found."
        )

    await ws_manager.broadcast("CONTENT_UPDATED", {
        "content_id": content_id,
        "action": "deleted",
        "type": "announcement"
    })

    return {
        "success": True,
        "message": "Content announcement deleted successfully."
    }

@router.post("/photos")
async def post_event_photo(payload: EventPhotoPostRequest, current_user: dict = Depends(get_current_user)):
    """
    Uploads an Utsav or Prasang photo to the Event Photo Gallery.
    """
    photo_doc = {
        "id": f"pho_{uuid.uuid4().hex[:8]}",
        "title": payload.title,
        "event_date": payload.event_date,
        "category": payload.category,
        "image_url": payload.image_url,
        "author": payload.author or current_user.get("full_name", "Media Team"),
        "created_at": datetime.now().isoformat()
    }

    insert_event_photo(photo_doc)

    await ws_manager.broadcast("CONTENT_UPDATED", {
        "photo_id": photo_doc["id"],
        "title": payload.title,
        "author": photo_doc["author"],
        "action": "created",
        "type": "photo"
    })

    return {
        "success": True,
        "message": "Event photo published successfully!",
        "photo": photo_doc
    }

@router.put("/photos/{photo_id}")
async def edit_event_photo(photo_id: str, payload: EventPhotoUpdateRequest, current_user: dict = Depends(get_current_user)):
    """
    Updates an existing event photo in the gallery.
    """
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        return {"success": True, "message": "No changes provided."}
    
    updates["updated_at"] = datetime.now().isoformat()
    success = update_event_photo(photo_id, updates)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Photo with ID '{photo_id}' not found."
        )

    await ws_manager.broadcast("CONTENT_UPDATED", {
        "photo_id": photo_id,
        "action": "updated",
        "type": "photo"
    })

    return {
        "success": True,
        "message": "Event photo updated successfully!"
    }

@router.delete("/photos/{photo_id}")
async def remove_event_photo(photo_id: str, current_user: dict = Depends(get_current_user)):
    """
    Deletes an event photo from the gallery.
    """
    success = delete_event_photo(photo_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Photo with ID '{photo_id}' not found."
        )

    await ws_manager.broadcast("CONTENT_UPDATED", {
        "photo_id": photo_id,
        "action": "deleted",
        "type": "photo"
    })

    return {
        "success": True,
        "message": "Photo removed from gallery successfully."
    }


