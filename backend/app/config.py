"""
Configuration Module for Bochasan Yuvak Mandal Sabha Attendance Management System.

This file centralizes all system settings including MongoDB connection URIs,
JWT authentication parameters, and default system constants.
Designed with clear explanatory comments for fresher developers.
"""

import os

# ==========================================
# MongoDB Connection Configuration
# ==========================================
# Default connection string for local MongoDB deployment.
# Can be overridden via environment variables for MongoDB Atlas or custom servers.
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
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
# Default Admin (Karyakar) Credentials
# ==========================================
# Seeded default admin account for initial setup and system bootstrap.
DEFAULT_ADMIN_USERNAME = "admin"
DEFAULT_ADMIN_PASSWORD = "adminpassword123"
DEFAULT_ADMIN_NAME = "Lead Admin Karyakar"
DEFAULT_ADMIN_MOBILE = "9999999999"
DEFAULT_ADMIN_LOCATION = "Bochasan"
