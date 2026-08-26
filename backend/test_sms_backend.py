"""
Direct verification of SMS Service and DB storage functions without unicode prints for Windows cp1252 stdout.
"""
import asyncio
from app.sms_service import (
    dispatch_sms_broadcast,
    get_available_templates,
    calculate_sms_segments,
    sanitize_phone_number
)
from app.db import save_sms_log, get_sms_logs
from app.routes.sms_routes import send_sms_broadcast
from app.models import SendSmsRequest

def test_sms_unit():
    print("Testing phone number sanitization...")
    assert sanitize_phone_number("9876543210") == "9876543210"
    assert sanitize_phone_number("+91 98765-43210") == "9876543210"
    assert sanitize_phone_number("919876543210") == "9876543210"
    print("[PASS] Phone number sanitization passed.")

    print("Testing SMS segments calculation...")
    seg_ascii = calculate_sms_segments("Jai Swaminarayan! Saturday Sabha reminder.")
    assert seg_ascii["segments"] == 1
    assert seg_ascii["is_unicode"] is False

    seg_unicode = calculate_sms_segments("Jai Swaminarayan Sabha")
    assert seg_unicode["segments"] == 1
    print("[PASS] Segment calculation passed.")

    print("Testing template loading...")
    templates = get_available_templates()
    assert len(templates) >= 3
    print(f"[PASS] Loaded {len(templates)} templates.")

    print("Testing SMS broadcast dispatch (Simulation Mode)...")
    recipients = [
        {"mobile_no": "9876543210", "full_name": "Rohan Patel"},
        {"mobile_no": "9898989898", "full_name": "Patel Vidur"}
    ]
    msg = "Jai Swaminarayan! Reminding all Yuvaks to attend Saturday Sabha at 8:30 PM."
    res = dispatch_sms_broadcast(recipients, msg, "sabha_reminder", "Patel Vidur")
    assert res["success"] is True
    assert res["recipient_count"] == 2
    assert "log_entry" in res
    print("[PASS] SMS dispatch returned:", res["message"])

    print("Testing log storage...")
    log_entry = res["log_entry"]
    saved = save_sms_log(log_entry)
    assert saved["id"] == log_entry["id"]

    logs = get_sms_logs(10)
    assert len(logs) >= 1
    assert logs[0]["id"] == log_entry["id"]
    print("[PASS] SMS logs storage and retrieval passed.")

    print("\nTesting async route handler directly...")
    mock_admin = {"username": "vidur.patel", "full_name": "Patel Vidur", "role": "admin"}
    req = SendSmsRequest(
        message="Test route broadcast message",
        recipient_mode="custom",
        custom_numbers=["9876543210", "9811122233"],
        template_type="custom"
    )
    route_res = asyncio.run(send_sms_broadcast(req, mock_admin))
    assert route_res["success"] is True
    assert route_res["recipient_count"] == 2
    print("[PASS] Route handler returned successfully:", route_res["message"])

    print("\nALL BACKEND SMS LOGIC & INTEGRATION TESTS PASSED 100%!")

if __name__ == "__main__":
    test_sms_unit()
