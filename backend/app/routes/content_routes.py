"""
Public & Member Content Feed Routes.

Provides read-only access to announcements, Niyama feeds, Sabha schedule items,
and Hero Photo Slideshow slides.
"""

from fastapi import APIRouter
from app.db import (
    get_all_content_feeds, 
    get_all_event_photos, 
    get_upcoming_sabha_schedule, 
    get_all_slideshow_slides
)

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

@router.get("/events")
def get_public_events():
    """
    Returns array of event objects for frontend axios consumption.
    """
    photos = get_all_event_photos()
    return {"success": True, "count": len(photos), "events": photos}

@router.get("/upcoming-sabha")
def get_public_upcoming_sabha():
    """
    Returns the currently configured upcoming Shanivariya Sabha schedule & details.
    """
    schedule = get_upcoming_sabha_schedule()
    return {"success": True, "schedule": schedule}

@router.get("/slideshow")
def get_public_slideshow_slides():
    """
    Returns array of configured hero photo slideshow slides.
    """
    slides = get_all_slideshow_slides()
    return {"success": True, "count": len(slides), "slides": slides}
