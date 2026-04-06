"""
database.py — MongoDB Connection Layer
Connects to MongoDB Atlas and exposes collection accessors.
"""

import os
from dotenv import load_dotenv
from pymongo import MongoClient

# Load environment variables
load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")

if not MONGODB_URI:
    raise ValueError("MONGODB_URI is not set in the .env file.")

# Create MongoDB client
client = MongoClient(MONGODB_URI)

# Database
db = client["secondbrain"]

# Collections
tasks_collection = db["tasks"]
activity_collection = db["activity_log"]
users_collection = db["users"]


def check_connection():
    """Verify MongoDB connection is alive."""
    try:
        if "<user>" in MONGODB_URI or "<password>" in MONGODB_URI:
            print("⚠️ MONGODB_URI still contains <user> or <password>. Update Backend/.env with real credentials.")
            return False

        client.admin.command("ping")
        print("✅ Connected to MongoDB Atlas successfully!")
        return True
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        return False
