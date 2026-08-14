import asyncio
import sys
import app.db as db_mod
from app.routes.karyakar_routes import update_sabha_schedule_admin
from app.routes.content_routes import get_public_upcoming_sabha
from app.models import UpcomingSabhaScheduleRequest

async def main():
    print("[1] Initializing DB...")
    db_mod.init_db()

    print("[2] Getting default schedule...")
    def_schedule = get_public_upcoming_sabha()
    print("Default timing:", def_schedule["schedule"]["timing"])
    print("Default venue:", def_schedule["schedule"]["venue"])
    assert def_schedule["schedule"]["timing"] == "8:30 PM IST"
    assert def_schedule["schedule"]["venue"] == "Mahant Hall 1st floor"

    print("[3] Updating schedule as Admin...")
    admin_user = {"username": "vidur.patel", "role": "admin", "full_name": "Patel Vidur"}
    update_req = UpcomingSabhaScheduleRequest(
        title="Upcoming Shanivariya Sabha - Yuva Chintan",
        timing="8:30 PM IST",
        venue="Mahant Hall 1st floor",
        description="Inspiring youth session, video presentation, and Mahaprasad.",
        target_attendance="100% Attendance",
        status_badge="Saturday Scheduled"
    )
    res = await update_sabha_schedule_admin(update_req, current_user=admin_user)
    assert res["success"] is True
    print("[4] Schedule updated successfully!")

    print("[5] Querying updated schedule...")
    latest = get_public_upcoming_sabha()
    print("Latest title:", latest["schedule"]["title"])
    print("Latest timing:", latest["schedule"]["timing"])
    print("Latest venue:", latest["schedule"]["venue"])
    assert latest["schedule"]["title"] == "Upcoming Shanivariya Sabha - Yuva Chintan"
    assert latest["schedule"]["timing"] == "8:30 PM IST"
    assert latest["schedule"]["venue"] == "Mahant Hall 1st floor"

    print("\n--- UPCOMING SABHA EDITABLE TEST PASSED SUCCESSFULLY! ---")

if __name__ == "__main__":
    asyncio.run(main())
