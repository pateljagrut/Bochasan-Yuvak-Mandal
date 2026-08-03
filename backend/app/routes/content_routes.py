"""
Public & Member Content Feed Routes.

Provides read-only access to announcements, Niyama feeds, and Sabha schedule items.
"""

from fastapi import APIRouter
from app.db import get_all_content_feeds

router = APIRouter(prefix="/api/content", tags=["Content Feed"])

@router.get("")
def get_public_content_feed():
    """
    Returns array of published content feeds (announcements, Niyama cards, Sabha themes)
    for both Yuvak and Karyakar views.
    """
    feeds = get_all_content_feeds()
    return {"success": True, "count": len(feeds), "feeds": feeds}
