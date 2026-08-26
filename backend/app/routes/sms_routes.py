"""
Karyakar Admin SMS Notification Routes.

Provides Admin-only endpoints to compose and broadcast SMS to Yuvak members,
fetch delivery history logs, and load pre-configured BAPS templates.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any

from app.models import SendSmsRequest
from app.auth import require_admin_role
from app.db import get_all_yuvaks, save_sms_log, get_sms_logs
from app.sms_service import (
    dispatch_sms_broadcast, 
    get_available_templates, 
    calculate_sms_segments
)
from app.websocket_manager import ws_manager

router = APIRouter(prefix="/karyakar/sms", tags=["Karyakar SMS Operations"])


@router.get("/templates")
def fetch_sms_templates(admin: dict = Depends(require_admin_role)):

    """
    Returns pre-configured BAPS Sabha, Utsav, and Niyama SMS templates.
    """
    return {
        "success": True,
        "templates": get_available_templates()
    }


@router.get("/history")
def fetch_sms_history(admin: dict = Depends(require_admin_role)):
    """
    Returns recent SMS dispatch logs and delivery reports.
    """
    logs = get_sms_logs(limit=50)
    return {
        "success": True,
        "count": len(logs),
        "logs": logs
    }


@router.post("/send")
async def send_sms_broadcast(
    payload: SendSmsRequest,
    admin: dict = Depends(require_admin_role)
):

    """
    Admin endpoint to broadcast SMS to all members, selected members, or custom mobile numbers.
    Triggers real-time notification broadcast via WebSockets & SSE.
    """
    if not payload.message or not payload.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="SMS message body cannot be empty."
        )

    all_yuvaks = get_all_yuvaks()
    recipients_list: List[Dict[str, str]] = []

    if payload.recipient_mode == "all":
        recipients_list = [
            {"mobile_no": y.get("mobile_no", ""), "full_name": y.get("full_name", "")}
            for y in all_yuvaks
            if y.get("status", "active") != "inactive" and y.get("mobile_no")
        ]
    elif payload.recipient_mode == "selected":
        target_ids = set(payload.yuvak_ids or [])
        recipients_list = [
            {"mobile_no": y.get("mobile_no", ""), "full_name": y.get("full_name", "")}
            for y in all_yuvaks
            if y.get("yuvak_id") in target_ids and y.get("mobile_no")
        ]
    elif payload.recipient_mode == "custom":
        recipients_list = [
            {"mobile_no": num, "full_name": "Member"}
            for num in (payload.custom_numbers or [])
            if num.strip()
        ]
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid recipient_mode: '{payload.recipient_mode}'."
        )

    if not recipients_list:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid recipients found for this selection."
        )

    admin_name = admin.get("full_name", admin.get("username", "Karyakar Admin"))

    # Dispatch SMS
    result = dispatch_sms_broadcast(
        recipients=recipients_list,
        message=payload.message.strip(),
        template_type=payload.template_type or "custom",
        sent_by=admin_name
    )

    if not result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", "SMS dispatch failed.")
        )

    # Save to logs
    log_entry = result.get("log_entry")
    if log_entry:
        save_sms_log(log_entry)

    # Real-time synchronization broadcast across connected clients
    await ws_manager.broadcast("SMS_BROADCAST_SENT", {
        "id": log_entry.get("id") if log_entry else "",
        "sent_by": admin_name,
        "recipient_count": result.get("recipient_count", 0),
        "template_type": payload.template_type or "custom",
        "preview": payload.message[:60] + ("..." if len(payload.message) > 60 else ""),
        "provider": result.get("provider", "Simulation")
    })

    return {
        "success": True,
        "message": result.get("message"),
        "recipient_count": result.get("recipient_count", 0),
        "segments": result.get("segments", 1),
        "provider": result.get("provider"),
        "log_entry": log_entry
    }
