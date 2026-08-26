"""
Configuration Module for Bochasan Yuvak Mandal Sabha Attendance Management System.

This file centralizes all system settings including MongoDB connection URIs,
JWT authentication parameters, and default system constants.
Designed with clear explanatory comments for fresher developers.
"""

import os
from pathlib import Path

# Load environment variables from .env file if present
try:
    from dotenv import load_dotenv
    env_path = Path(__file__).resolve().parent.parent / ".env"
    if env_path.exists():
        load_dotenv(dotenv_path=env_path)
    else:
        load_dotenv()
except ImportError:
    pass

# ==========================================
# MongoDB Connection Configuration
# ==========================================
# MongoDB Atlas Cloud Database URI
DEFAULT_ATLAS_URI = "mongodb+srv://jagrutpatel1101_db_user:FvlgDCn5yeqd7ECE@cluster0.nqawozt.mongodb.net/?retryWrites=true&w=majority"
MONGO_URI = os.getenv("MONGO_URI", DEFAULT_ATLAS_URI)
DB_NAME = os.getenv("DB_NAME", "Bochasan_yuvak_mandal")

# ==========================================
# Security & JWT Configuration
# ==========================================
# Secret key used for signing JWT authentication tokens.
# Change this secret key in production environments!
SECRET_KEY = os.getenv("SECRET_KEY", "Bochasan_yuvak_mandal_super_secret_key_2026_jai_swaminarayan")
ALGORITHM = "HS256"

# Token lifespan: Tokens expire after 24 hours (1440 minutes)
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

# ==========================================
# Default Super Admin (Karyakar) Credentials
# ==========================================
# Seeded default super admin account for initial setup and system bootstrap.
DEFAULT_ADMIN_USERNAME = "vidur.patel"
DEFAULT_ADMIN_PASSWORD = "Vidur@2026"
DEFAULT_ADMIN_NAME = "Patel Vidur"
DEFAULT_ADMIN_MOBILE = "9898989898"
DEFAULT_ADMIN_LOCATION = "Bochasan"

# ==========================================
# SMS Gateway Configuration
# ==========================================
# Supports 'fast2sms', 'twilio', or 'simulation' mode (live simulation if API key is unset)
SMS_PROVIDER = os.getenv("SMS_PROVIDER", "auto")
FAST2SMS_API_KEY = os.getenv("FAST2SMS_API_KEY", "")
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER", "")
SMS_SENDER_ID = os.getenv("SMS_SENDER_ID", "BAPS-BYM")

