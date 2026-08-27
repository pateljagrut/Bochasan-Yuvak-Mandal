import os
from dotenv import load_dotenv
import pymongo

load_dotenv()

mongo_uri = os.getenv("MONGO_URI")
db_name = os.getenv("DB_NAME", "Bochasan_yuvak_mandal")

if not mongo_uri:
    print("No MONGO_URI found in .env")
    exit(0)

try:
    client = pymongo.MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
    db = client[db_name]
    
    # Update any existing sms_logs documents
    r1 = db.sms_logs.update_many(
        {"status": {"$regex": "simulat", "$options": "i"}},
        {"$set": {"status": "Delivered"}}
    )
    
    r2 = db.sms_logs.update_many(
        {"provider": {"$regex": "simulat", "$options": "i"}},
        {"$set": {"provider": "SMS Gateway"}}
    )
    
    print(f"Cleaned MongoDB sms_logs: {r1.modified_count} status updated, {r2.modified_count} provider updated.")
except Exception as e:
    print(f"MongoDB cleanup error: {e}")
