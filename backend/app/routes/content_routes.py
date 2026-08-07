"""
Public & Member Content Feed Routes.

Provides read-only access to announcements, Niyama feeds, and Sabha schedule items.
"""

from fastapi import APIRouter
from app.db import get_all_content_feeds, get_all_event_photos

router = APIRouter(prefix="/api/content", tags=["Content Feed"])

@router.get("")
def get_public_content_feed():
    """
    Returns array of published content feeds (announcements, Niyama cards, Sabha themes)
    for both Yuvak and Karyakar views.
    """
    feeds = get_all_content_feeds()
    return {"success": True, "count": len(feeds), "feeds": feeds}

@router.get("/photos")
def get_public_event_photos():
    """
    Returns array of Utsav & Prasang event photo records for gallery display.
    """
    photos = get_all_event_photos()
    return {"success": True, "count": len(photos), "photos": photos}
