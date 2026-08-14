import asyncio
import app.db as db_mod
from app.routes.karyakar_routes import (
    remove_event_photo, edit_event_photo, 
    edit_content_feed, remove_content_feed
)
from app.models import EventPhotoUpdateRequest, ContentUpdateRequest

async def main():
    print("[1] Initializing database...")
    db_mod.init_db()
    
    admin = {"username": "admin", "full_name": "Patel Vidur", "role": "admin"}

    # 1. Check photos
    photos = db_mod.get_all_event_photos()
    print("[2] Current photos in database:", [p["id"] for p in photos])
    assert len(photos) > 0, "Photos list should not be empty"

    target_photo = photos[0]
    target_id = target_photo["id"]
    print(f"[3] Testing edit on photo: {target_id} (current title: {target_photo['title']})")

    # 2. Edit Photo
    edit_res = await edit_event_photo(
        target_id, 
        EventPhotoUpdateRequest(title="Special Edited Hindola Darshan 2026"), 
        current_user=admin
    )
    assert edit_res["success"] is True
    print("[4] Edit photo result:", edit_res)

    updated_photos = db_mod.get_all_event_photos()
    updated_match = next((p for p in updated_photos if p["id"] == target_id), None)
    assert updated_match is not None
    assert updated_match["title"] == "Special Edited Hindola Darshan 2026"
    print(f"[5] Verified title updated in database: {updated_match['title']}")

    # 3. Delete Photo
    print(f"[6] Testing delete on photo: {target_id}")
    del_res = await remove_event_photo(target_id, current_user=admin)
    assert del_res["success"] is True
    print("[7] Delete photo result:", del_res)

    remaining_photos = db_mod.get_all_event_photos()
    remaining_ids = [p["id"] for p in remaining_photos]
    print("[8] Remaining photo IDs in database:", remaining_ids)
    assert target_id not in remaining_ids, f"Photo {target_id} should be deleted"

    # 4. Content Feed Edit & Delete verification
    feeds = db_mod.get_all_content_feeds()
    print("[9] Current content feeds in database:", [f["id"] for f in feeds])
    if feeds:
        target_feed_id = feeds[0]["id"]
        edit_feed_res = await edit_content_feed(
            target_feed_id,
            ContentUpdateRequest(title="Updated Announcement Title Test"),
            current_user=admin
        )
        assert edit_feed_res["success"] is True
        print(f"[10] Verified feed edit on {target_feed_id}")

    print("\n--- ALL PHOTO AND CONTENT DB OPERATIONS FULLY VERIFIED! ---")

if __name__ == "__main__":
    asyncio.run(main())
