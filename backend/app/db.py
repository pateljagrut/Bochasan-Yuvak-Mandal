"""
Database Access Layer (MongoDB Integration).

Handles MongoDB database connections via PyMongo, collections management,
data querying, and fallback in-memory state management.
Annotated with detailed comments for junior and fresher developer clarity.
"""

import sys
import logging
import certifi
from typing import Dict, List, Optional, Any
from datetime import datetime
import pymongo
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

from app.config import MONGO_URI, DB_NAME, DEFAULT_ADMIN_USERNAME, DEFAULT_ADMIN_PASSWORD, DEFAULT_ADMIN_NAME, DEFAULT_ADMIN_MOBILE, DEFAULT_ADMIN_LOCATION


# Configure logging to trace database operations
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("Bochasan_db")

# Global variables for MongoDB Client and Database reference
mongo_client = None
db = None
is_mongo_connected = False

# ==========================================
# In-Memory Fallback Storage
# ==========================================
# If MongoDB service is unavailable on localhost:27017, this dictionary
# ensures the API remains 100% operational for development, testing, and demos.
in_memory_store: Dict[str, Any] = {
    "users": [],
    "attendance": [],
    "content": [],
    "photos": [],
    "sabha_schedule": {}
}

def init_db():
    """
    Initializes MongoDB connection and seeds default system data.
    Attempts connection with a short timeout. If MongoDB server is detected,
    uses real PyMongo collections. Otherwise, falls back gracefully to in-memory mode.
    """
    global mongo_client, db, is_mongo_connected
    
    try:
        # Create PyMongo client with a 5-second timeout check
        logger.info(f"Connecting to MongoDB at {MONGO_URI}...")
        mongo_client = pymongo.MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000,tlsCAFile=certifi.where())
        
        # Ping server to confirm connection status
        mongo_client.admin.command('ping')
        db = mongo_client[DB_NAME]
        is_mongo_connected = True
        logger.info("[OK] Successfully connected to live MongoDB server!")
        
        # Create indexes for optimal querying performance
        db.users.create_index("yuvak_id", unique=True, sparse=True)
        db.users.create_index("username", unique=True, sparse=True)
        db.users.create_index("mobile_no")
        
    except (ConnectionFailure, ServerSelectionTimeoutError) as e:
        is_mongo_connected = False
        logger.warning(f"[WARN] Live MongoDB connection not detected: {e}")
        logger.warning("[INFO] Switched to high-performance Standalone Memory Database Mode.")

    # Seed default Admin and sample Yuvak data
    seed_initial_data()

def seed_initial_data():
    """
    Seeds and maintains the 2 default system Admin users (vidur.patel and jagrut.patel).
    Does NOT seed any dummy yuvaks, dummy attendance, or dummy content feeds.
    """
    # 1. Super Admin: Patel Vidur
    admin_vidur = {
        "yuvak_id": "VID9898",
        "username": DEFAULT_ADMIN_USERNAME,
        "password": DEFAULT_ADMIN_PASSWORD,
        "full_name": DEFAULT_ADMIN_NAME,
        "mobile_no": DEFAULT_ADMIN_MOBILE,
        "dob": "1998-01-01",
        "location": DEFAULT_ADMIN_LOCATION,
        "role": "admin",
        "created_at": datetime.now().isoformat()
    }

    # 2. Admin: Jagrut Patel
    admin_jagrut = {
        "yuvak_id": "ADM-JAGRUT.PATEL",
        "username": "jagrut.patel",
        "password": "Jagrut@2026",
        "full_name": "Jagrut Patel",
        "dob": "2005-01-11",
        "mobile_no": "7698011236",
        "location": "Bochasan",
        "role": "admin",
        "created_by": "vidur.patel",
        "created_at": datetime.now().isoformat()
    }

    if is_mongo_connected and db is not None:
        db.users.update_one(
            {"$or": [{"username": DEFAULT_ADMIN_USERNAME}, {"username": "admin"}, {"yuvak_id": "VID9898"}]},
            {"$set": admin_vidur},
            upsert=True
        )
        db.users.update_one(
            {"$or": [{"username": "jagrut.patel"}, {"yuvak_id": "ADM-JAGRUT.PATEL"}]},
            {"$set": admin_jagrut},
            upsert=True
        )
        logger.info("[SEED] Verified and maintained the 2 Admin users: vidur.patel & jagrut.patel.")
    else:
        in_memory_store["users"] = [
            u for u in in_memory_store.get("users", []) 
            if u.get("role") == "admin"
        ]
        vidur_idx = next((i for i, u in enumerate(in_memory_store["users"]) if u.get("username") == DEFAULT_ADMIN_USERNAME or u.get("yuvak_id") == "VID9898"), -1)
        if vidur_idx >= 0:
            in_memory_store["users"][vidur_idx].update(admin_vidur)
        else:
            in_memory_store["users"].append(admin_vidur)

        jagrut_idx = next((i for i, u in enumerate(in_memory_store["users"]) if u.get("username") == "jagrut.patel" or u.get("yuvak_id") == "ADM-JAGRUT.PATEL"), -1)
        if jagrut_idx >= 0:
            in_memory_store["users"][jagrut_idx].update(admin_jagrut)
        else:
            in_memory_store["users"].append(admin_jagrut)


# ==========================================
# MongoDB Data Access Helper Functions
# ==========================================

def insert_user(user_doc: dict) -> dict:
    """Inserts a user document into MongoDB or fallback store."""
    if is_mongo_connected and db is not None:
        db.users.insert_one(user_doc)
    else:
        in_memory_store["users"].append(user_doc)
    return user_doc

def find_user_by_identifier(identifier: str) -> Optional[dict]:
    """
    Queries MongoDB for a user matching Yuvak ID, Mobile Number, or Username.
    Core query used in Unified Smart Login.
    """
    if is_mongo_connected and db is not None:
        # Search across yuvak_id, mobile_no, or username fields
        user = db.users.find_one({
            "$or": [
                {"yuvak_id": identifier},
                {"yuvak_id": identifier.upper() if isinstance(identifier, str) else identifier},
                {"mobile_no": identifier},
                {"username": identifier}
            ]
        })
        if user and "_id" in user:
            user["_id"] = str(user["_id"])  # Sanitize ObjectId for JSON compatibility
        return user
    else:
        # Search fallback memory array
        for user in in_memory_store["users"]:
            if (user.get("yuvak_id") == identifier or 
                user.get("yuvak_id", "").upper() == (identifier.upper() if isinstance(identifier, str) else identifier) or
                user.get("mobile_no") == identifier or 
                user.get("username") == identifier):
                return user
        return None

def get_all_yuvaks() -> List[dict]:
    """
    Retrieves all user profiles (both Yuvaks and Admins/Karyakars) from MongoDB
    so Admins are included in the Members DB and frontend directory views.
    """
    if is_mongo_connected and db is not None:
        cursor = db.users.find({}, {"_id": 0})
        users = list(cursor)
    else:
        users = list(in_memory_store["users"])

    # Ensure every admin user has a yuvak_id assigned for display in members list
    for user in users:
        if not user.get("yuvak_id"):
            username = user.get("username", "ADMIN")
            user["yuvak_id"] = f"ADM-{username.upper()}"
        if not user.get("dob"):
            user["dob"] = "N/A"

    return users

def update_yuvak_profile(yuvak_id: str, updates: dict) -> bool:
    """Updates a member's (Yuvak or Admin) profile fields in MongoDB."""
    if is_mongo_connected and db is not None:
        res = db.users.update_one(
            {"$or": [{"yuvak_id": yuvak_id}, {"yuvak_id": yuvak_id.upper()}, {"username": yuvak_id}]}, 
            {"$set": updates}
        )
        return res.matched_count > 0 or res.modified_count > 0
    else:
        for u in in_memory_store["users"]:
            if u.get("yuvak_id") == yuvak_id or u.get("yuvak_id", "").upper() == yuvak_id.upper() or u.get("username") == yuvak_id:
                u.update(updates)
                return True
        return False

def delete_yuvak_member(yuvak_id: str) -> bool:
    """Deletes a member (Yuvak or Admin) profile from MongoDB or in-memory store."""
    if is_mongo_connected and db is not None:
        res = db.users.delete_one({"$or": [{"yuvak_id": yuvak_id}, {"yuvak_id": yuvak_id.upper()}, {"username": yuvak_id}]})
        return res.deleted_count > 0
    else:
        initial_len = len(in_memory_store["users"])
        in_memory_store["users"] = [
            u for u in in_memory_store["users"] 
            if not (u.get("yuvak_id") == yuvak_id or u.get("yuvak_id", "").upper() == yuvak_id.upper() or u.get("username") == yuvak_id)
        ]
        return len(in_memory_store["users"]) < initial_len

def insert_attendance_record(record: dict) -> dict:
    """Inserts or updates a Sabha attendance record for a specific date in MongoDB."""
    sabha_date = record.get("sabha_date")
    if is_mongo_connected and db is not None:
        db.attendance.update_one(
            {"sabha_date": sabha_date},
            {"$set": record},
            upsert=True
        )
    else:
        existing_idx = next((i for i, a in enumerate(in_memory_store["attendance"]) if a.get("sabha_date") == sabha_date), -1)
        if existing_idx >= 0:
            in_memory_store["attendance"][existing_idx].update(record)
        else:
            in_memory_store["attendance"].append(record)
    return record

def get_all_attendance_records() -> List[dict]:
    """Retrieves all Sabha attendance records sorted chronologically by sabha_date."""
    if is_mongo_connected and db is not None:
        cursor = db.attendance.find({}, {"_id": 0}).sort("sabha_date", pymongo.ASCENDING)
        return list(cursor)
    else:
        return sorted(in_memory_store["attendance"], key=lambda x: x.get("sabha_date", ""))


def insert_content_feed(content_doc: dict) -> dict:
    """Inserts a content item (announcement/niyama) into MongoDB."""
    if is_mongo_connected and db is not None:
        db.content.insert_one(content_doc)
    else:
        in_memory_store["content"].append(content_doc)
    return content_doc

def get_all_content_feeds() -> List[dict]:
    """Retrieves all content feeds sorted by latest creation time."""
    if is_mongo_connected and db is not None:
        cursor = db.content.find({}, {"_id": 0}).sort("created_at", pymongo.DESCENDING)
        return list(cursor)
    else:
        return sorted(in_memory_store.get("content", []), key=lambda x: x.get("created_at", ""), reverse=True)

def delete_content_feed(content_id: str) -> bool:
    """Deletes a content item (announcement/niyama) by ID from MongoDB or in-memory store."""
    if is_mongo_connected and db is not None:
        res = db.content.delete_one({"$or": [{"id": content_id}, {"id": str(content_id)}]})
        if res.deleted_count == 0:
            try:
                from bson import ObjectId
                res = db.content.delete_one({"_id": ObjectId(content_id)})
            except Exception:
                pass
        return res.deleted_count > 0
    else:
        initial_len = len(in_memory_store.get("content", []))
        in_memory_store["content"] = [c for c in in_memory_store.get("content", []) if c.get("id") != content_id and str(c.get("_id", "")) != content_id]
        return len(in_memory_store.get("content", [])) < initial_len

def update_content_feed(content_id: str, updates: dict) -> bool:
    """Updates a content item (announcement/niyama) by ID in MongoDB or in-memory store."""
    if is_mongo_connected and db is not None:
        res = db.content.update_one(
            {"$or": [{"id": content_id}, {"id": str(content_id)}]}, 
            {"$set": updates}
        )
        if res.matched_count == 0:
            try:
                from bson import ObjectId
                res = db.content.update_one({"_id": ObjectId(content_id)}, {"$set": updates})
            except Exception:
                pass
        return res.matched_count > 0 or res.modified_count > 0
    else:
        for c in in_memory_store.get("content", []):
            if c.get("id") == content_id or str(c.get("_id", "")) == content_id:
                c.update(updates)
                return True
        return False

# ==========================================
# Event Photos Gallery Functions
# ==========================================

def insert_event_photo(photo_doc: dict) -> dict:
    """Inserts an event photo record into MongoDB or in-memory store."""
    if is_mongo_connected and db is not None:
        db.photos.insert_one(photo_doc)
    else:
        if "photos" not in in_memory_store:
            in_memory_store["photos"] = []
        in_memory_store["photos"].append(photo_doc)
    return photo_doc

def get_all_event_photos() -> List[dict]:
    """Retrieves all event photos sorted by creation time."""
    if is_mongo_connected and db is not None:
        cursor = db.photos.find({}, {"_id": 0}).sort("created_at", pymongo.DESCENDING)
        return list(cursor)
    else:
        photos = in_memory_store.get("photos", [])
        return sorted(photos, key=lambda x: x.get("created_at", ""), reverse=True)

def delete_event_photo(photo_id: str) -> bool:
    """Deletes an event photo record from MongoDB or in-memory store."""
    if is_mongo_connected and db is not None:
        res = db.photos.delete_one({"$or": [{"id": photo_id}, {"id": str(photo_id)}]})
        if res.deleted_count == 0:
            try:
                from bson import ObjectId
                res = db.photos.delete_one({"_id": ObjectId(photo_id)})
            except Exception:
                pass
        return res.deleted_count > 0
    else:
        initial_len = len(in_memory_store.get("photos", []))
        in_memory_store["photos"] = [p for p in in_memory_store.get("photos", []) if p.get("id") != photo_id and str(p.get("_id", "")) != photo_id]
        return len(in_memory_store.get("photos", [])) < initial_len

def update_event_photo(photo_id: str, updates: dict) -> bool:
    """Updates an event photo record in MongoDB or in-memory store."""
    if is_mongo_connected and db is not None:
        res = db.photos.update_one(
            {"$or": [{"id": photo_id}, {"id": str(photo_id)}]},
            {"$set": updates}
        )
        if res.matched_count == 0:
            try:
                from bson import ObjectId
                res = db.photos.update_one({"_id": ObjectId(photo_id)}, {"$set": updates})
            except Exception:
                pass
        return res.matched_count > 0 or res.modified_count > 0
    else:
        for p in in_memory_store.get("photos", []):
            if p.get("id") == photo_id or str(p.get("_id", "")) == photo_id:
                p.update(updates)
                return True
        return False

def get_sample_photos() -> List[dict]:
    """Returns sample initial event photos for gallery demonstration."""
    return [
        {
            "id": "pho_01",
            "title": "Hindola Utsav Celebration 2026",
            "event_date": "2026-08-04",
            "category": "Utsav",
            "image_url": "https://images.unsplash.com/photo-1609766857041-ed402ea8069a?q=80&w=800&auto=format&fit=crop",
            "author": "Bochasan Karyakar Team",
            "created_at": "2026-08-04T12:00:00"
        },
        {
            "id": "pho_02",
            "title": "Sunday Ravivariya Yuvak Sabha",
            "event_date": "2026-08-02",
            "category": "Sabha",
            "image_url": "https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=800&auto=format&fit=crop",
            "author": "Bochasan Media Cell",
            "created_at": "2026-08-02T19:30:00"
        },
        {
            "id": "pho_03",
            "title": "Mandal Cultural Kirtan Evening",
            "event_date": "2026-07-28",
            "category": "Cultural",
            "image_url": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop",
            "author": "Prerna Sangeet Team",
            "created_at": "2026-07-28T20:00:00"
        },
        {
            "id": "pho_04",
            "title": "Guruhari Smruti Darshan Prasang",
            "event_date": "2026-07-20",
            "category": "Prasang",
            "image_url": "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?q=80&w=800&auto=format&fit=crop",
            "author": "Bochasan Karyakar Team",
            "created_at": "2026-07-20T10:15:00"
        }
    ]

# ==========================================
# Upcoming Sabha Schedule Functions
# ==========================================

def get_upcoming_sabha_schedule() -> dict:
    """Retrieves the upcoming Sabha schedule from MongoDB or default configuration."""
    default_schedule: dict = {
        "id": "upcoming_sabha_active",
        "title": "Upcoming Shanivariya Sabha",
        "date_str": None,
        "timing": "8:30 PM IST",
        "venue": "Mahant Hall 1st floor",
        "description": "Weekly spiritual session, youth leadership development, Satsang Chintan and Mahaprasad.",
        "target_attendance": "100% Attendance",
        "status_badge": "● Saturday Scheduled",
        "updated_at": datetime.now().isoformat()
    }
    if is_mongo_connected and db is not None:
        doc = db.sabha_schedule.find_one({"id": "upcoming_sabha_active"}, {"_id": 0})
        if doc and isinstance(doc, dict):
            return doc
        return default_schedule
    else:
        cached = in_memory_store.get("sabha_schedule")
        if isinstance(cached, dict) and cached:
            return cached
        return default_schedule

def update_upcoming_sabha_schedule(schedule_doc: dict) -> dict:
    """Updates the upcoming Sabha schedule in MongoDB or in-memory store."""
    schedule_doc["id"] = "upcoming_sabha_active"
    schedule_doc["updated_at"] = datetime.now().isoformat()
    if is_mongo_connected and db is not None:
        db.sabha_schedule.update_one(
            {"id": "upcoming_sabha_active"},
            {"$set": schedule_doc},
            upsert=True
        )
    else:
        in_memory_store["sabha_schedule"] = schedule_doc
    return schedule_doc



