import app.db as db_mod

def clean_database():
    print("--- CONNECTING TO MONGODB TO REMOVE ALL DUMMY DATA ---")
    db_mod.init_db()

    if db_mod.is_mongo_connected and db_mod.db is not None:
        db = db_mod.db

        # 1. Remove all non-admin users (dummy yuvaks)
        del_users = db.users.delete_many({
            "$and": [
                {"role": {"$ne": "admin"}},
                {"username": {"$nin": ["vidur.patel", "jagrut.patel"]}}
            ]
        })
        print(f"[CLEAN] Deleted {del_users.deleted_count} dummy member(s) from 'users' collection.")

        # Also remove test yuvak IDs specifically if any had been inserted
        del_test_ids = db.users.delete_many({"yuvak_id": {"$in": ["ROH3210", "HAR5678", "JAY1234"]}})
        if del_test_ids.deleted_count > 0:
            print(f"[CLEAN] Deleted {del_test_ids.deleted_count} sample member(s) by ID.")

        # 2. Clear all dummy attendance sessions
        del_att = db.attendance.delete_many({})
        print(f"[CLEAN] Deleted {del_att.deleted_count} attendance session(s) from 'attendance' collection.")

        # 3. Clear all dummy announcements/content
        del_cnt = db.content.delete_many({})
        print(f"[CLEAN] Deleted {del_cnt.deleted_count} announcement(s) from 'content' collection.")

        # 4. Clear all dummy photos
        del_pho = db.photos.delete_many({})
        print(f"[CLEAN] Deleted {del_pho.deleted_count} photo(s) from 'photos' collection.")

        # 5. Clean meta flags
        db.meta.delete_many({})
        print("[CLEAN] Cleaned 'meta' seeding collection.")

        # Verify final state
        remaining_users = list(db.users.find({}, {"_id": 0, "password": 0}))
        print("\n--- FINAL DATABASE STATE ---")
        print(f"Total Users: {len(remaining_users)}")
        for u in remaining_users:
            print(f"  - [{u.get('role')}] {u.get('full_name')} (Username: {u.get('username')}, ID: {u.get('yuvak_id')})")

        print(f"Total Attendance Sessions: {db.attendance.count_documents({})}")
        print(f"Total Content Feeds: {db.content.count_documents({})}")
        print(f"Total Photos: {db.photos.count_documents({})}")
        print("\n--- DATABASE IS CLEAN AND PRODUCTION READY! ---")
    else:
        print("[WARN] MongoDB is not connected. In-memory store reset.")

if __name__ == "__main__":
    clean_database()
