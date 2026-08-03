"""
Database Access Layer (MongoDB Integration).

Handles MongoDB database connections via PyMongo, collections management,
data querying, and fallback in-memory state management.
Annotated with detailed comments for junior and fresher developer clarity.
"""

import sys
import logging
from typing import Dict, List, Optional
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
in_memory_store = {
    "users": [],
    "attendance": [],
    "content": []
}

def init_db():
    """
    Initializes MongoDB connection and seeds default system data.
    Attempts connection with a short timeout. If MongoDB server is detected,
    uses real PyMongo collections. Otherwise, falls back gracefully to in-memory mode.
    """
    global mongo_client, db, is_mongo_connected
    
    try:
        # Create PyMongo client with a 2-second timeout check
        logger.info(f"Connecting to MongoDB at {MONGO_URI}...")
        mongo_client = pymongo.MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
        
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
    Seeds default system admin (Karyakar) and initial Yuvak profiles
    if no users exist in the database yet.
    """
    # 1. Check if Admin account exists
    admin_user = find_user_by_identifier(DEFAULT_ADMIN_USERNAME)
    if not admin_user:
        admin_doc = {
            "username": DEFAULT_ADMIN_USERNAME,
            "password": DEFAULT_ADMIN_PASSWORD,  # Will be hashed in auth layer if needed
            "full_name": DEFAULT_ADMIN_NAME,
            "mobile_no": DEFAULT_ADMIN_MOBILE,
            "location": DEFAULT_ADMIN_LOCATION,
            "role": "admin",
            "created_at": datetime.now().isoformat()
        }
        insert_user(admin_doc)
        logger.info(f"[SEED] Seeded default Admin user: {DEFAULT_ADMIN_USERNAME}")

    # 2. Seed initial sample Yuvaks for testing and demonstration
    sample_yuvaks = [
        {
            "yuvak_id": "ROH3210",
            "full_name": "Rohan Patel",
            "mobile_no": "9876543210",
            "dob": "2002-05-15",
            "location": "Bochasan",
            "password": "9876543210",
            "role": "yuvak",
            "created_at": datetime.now().isoformat()
        },
        {
            "yuvak_id": "HAR5678",
            "full_name": "Harshil Shah",
            "mobile_no": "9812345678",
            "dob": "2001-08-20",
            "location": "Atladara",
            "password": "9812345678",
            "role": "yuvak",
            "created_at": datetime.now().isoformat()
        },
        {
            "yuvak_id": "JAY1234",
            "full_name": "Jayesh Joshi",
            "mobile_no": "9988771234",
            "dob": "2003-12-10",
            "location": "Gadhada",
            "password": "9988771234",
            "role": "yuvak",
            "created_at": datetime.now().isoformat()
        }
    ]
    
    for yuvak in sample_yuvaks:
        if not find_user_by_identifier(yuvak["yuvak_id"]):
            insert_user(yuvak)
            logger.info(f"[SEED] Seeded sample Yuvak: {yuvak['full_name']} ({yuvak['yuvak_id']})")

    # 3. Seed initial sample attendance history
    sample_attendance = [
        {
            "sabha_date": "2026-07-19",
            "sabha_title": "Niyama & Seva Orientation Sabha",
            "present_yuvak_ids": ["ROH3210", "HAR5678"],
            "created_at": datetime.now().isoformat()
        },
        {
            "sabha_date": "2026-07-26",
            "sabha_title": "Ekantik Dharma & Yuva Mahotsav Prep",
            "present_yuvak_ids": ["ROH3210", "JAY1234"],
            "created_at": datetime.now().isoformat()
        },
        {
            "sabha_date": "2026-08-02",
            "sabha_title": "Monthly Prerna Sabha & Attendance Check",
            "present_yuvak_ids": ["ROH3210", "HAR5678", "JAY1234"],
            "created_at": datetime.now().isoformat()
        }
    ]
    
    existing_attendance = get_all_attendance_records()
    if not existing_attendance:
        for att in sample_attendance:
            insert_attendance_record(att)

    # 4. Seed initial content feed
    sample_content = [
        {
            "id": "cnt_01",
            "title": "Welcome to Bochasan Yuvak Mandal Sabha!",
            "content": "Join us every Sunday at 5:30 PM at the Mandal Mandir for inspiring discourses, group discussions, and cultural activities.",
            "category": "announcement",
            "author": "Bochasan Karyakar Team",
            "created_at": "2026-08-01T10:00:00"
        },
        {
            "id": "cnt_02",
            "title": "Niyama of the Week: Daily Morning Puja",
            "content": "Practicing daily morning Mansi Puja and Agna instills purity and strength in youth life.",
            "category": "niyama",
            "author": "Prerna Desk",
            "created_at": "2026-08-02T08:00:00"
        }
    ]
    
    existing_content = get_all_content_feeds()
    if not existing_content:
        for cnt in sample_content:
            insert_content_feed(cnt)

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
                user.get("mobile_no") == identifier or 
                user.get("username") == identifier):
                return user
        return None

def get_all_yuvaks() -> List[dict]:
    """Retrieves all Yuvak user profiles from MongoDB."""
    if is_mongo_connected and db is not None:
        cursor = db.users.find({"role": "yuvak"}, {"_id": 0})
        return list(cursor)
    else:
        return [u for u in in_memory_store["users"] if u.get("role") == "yuvak"]

def update_yuvak_profile(yuvak_id: str, updates: dict) -> bool:
    """Updates a Yuvak's profile fields in MongoDB."""
    if is_mongo_connected and db is not None:
        res = db.users.update_one({"yuvak_id": yuvak_id}, {"$set": updates})
        return res.modified_count > 0
    else:
        for u in in_memory_store["users"]:
            if u.get("yuvak_id") == yuvak_id:
                u.update(updates)
                return True
        return False

def insert_attendance_record(record: dict) -> dict:
    """Inserts a new Sabha attendance record into MongoDB."""
    if is_mongo_connected and db is not None:
        db.attendance.insert_one(record)
    else:
        in_memory_store["attendance"].append(record)
    return record

def get_all_attendance_records() -> List[dict]:
    """Retrieves all Sabha attendance records."""
    if is_mongo_connected and db is not None:
        cursor = db.attendance.find({}, {"_id": 0})
        return list(cursor)
    else:
        return list(in_memory_store["attendance"])

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
        return sorted(in_memory_store["content"], key=lambda x: x.get("created_at", ""), reverse=True)
