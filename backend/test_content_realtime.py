"""
Async integration tests for real-time Content management and photo gallery endpoints.
"""

import asyncio
from app.db import init_db, get_all_content_feeds, get_all_event_photos, delete_content_feed, delete_event_photo
from app.models import ContentPostRequest, ContentUpdateRequest, EventPhotoPostRequest
from app.routes.karyakar_routes import (
    post_content_feed, edit_content_feed, remove_content_feed,
    post_event_photo, remove_event_photo
)
from app.routes.content_routes import get_public_content_feed, get_public_event_photos

async def main():
    print("[TEST] Initializing database...")
    init_db()

    mock_admin = {
        "username": "admin",
        "full_name": "Patel Vidur",
        "role": "admin"
    }

    # 1. Post new Announcement Feed
    post_feed_payload = ContentPostRequest(
        title="Grand Youth Festival 2026",
        content="Special cultural preparations starting this Sunday at 6:00 PM.",
        category="announcement",
        author="Bochasan Media Cell"
    )
    res_post_feed = await post_content_feed(post_feed_payload, current_user=mock_admin)
    assert res_post_feed["success"] is True
    feed_id = res_post_feed["content_id"]
    print(f"[TEST PASS] Published announcement feed: {feed_id}")

    # 2. Check public content feed
    public_feeds = get_public_content_feed()
    assert public_feeds["success"] is True
    titles = [f["title"] for f in public_feeds["feeds"]]
    assert "Grand Youth Festival 2026" in titles
    print(f"[TEST PASS] Public content feed contains new announcement: {titles[0]}")

    # 3. Update announcement feed
    update_feed_payload = ContentUpdateRequest(
        title="Grand Youth Festival 2026 - Updated Schedule",
        content="Updated time: 5:00 PM at Main Sabha Hall."
    )
    res_update_feed = await edit_content_feed(feed_id, update_feed_payload, current_user=mock_admin)
    assert res_update_feed["success"] is True
    print(f"[TEST PASS] Updated announcement feed ID: {feed_id}")

    # 4. Post Event Photo
    photo_payload = EventPhotoPostRequest(
        title="Janmashtami Hindola Darshan 2026",
        event_date="2026-08-15",
        category="Utsav",
        image_url="https://images.unsplash.com/photo-1609766857041-ed402ea8069a?q=80&w=800",
        author="Media Team"
    )
    res_photo = await post_event_photo(photo_payload, current_user=mock_admin)
    assert res_photo["success"] is True
    photo_id = res_photo["photo"]["id"]
    print(f"[TEST PASS] Uploaded event photo: {photo_id}")

    # 5. Check public event photos
    public_photos = get_public_event_photos()
    assert public_photos["success"] is True
    photo_titles = [p["title"] for p in public_photos["photos"]]
    assert "Janmashtami Hindola Darshan 2026" in photo_titles
    print(f"[TEST PASS] Public photos include: {photo_titles[0]}")

    # 6. Delete Event Photo
    res_del_photo = await remove_event_photo(photo_id, current_user=mock_admin)
    assert res_del_photo["success"] is True
    print(f"[TEST PASS] Removed event photo ID: {photo_id}")

    # 7. Delete Announcement Feed
    res_del_feed = await remove_content_feed(feed_id, current_user=mock_admin)
    assert res_del_feed["success"] is True
    print(f"[TEST PASS] Removed announcement feed ID: {feed_id}")

    print("\n--- ALL CONTENT REALTIME INTEGRATION TESTS PASSED SUCCESSFULLY! ---")

if __name__ == "__main__":
    asyncio.run(main())

