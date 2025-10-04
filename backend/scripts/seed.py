import os
import sys
import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add the project's root directory to the Python path to allow module imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.config import settings
from app.security.hashing import Hasher
from app.models.base import Base
from app.models.admin import Admin
from app.models.super_admin import SuperAdmin
from app.models.user import User
from app.models.group import Group
from app.models.group_member import GroupMember
from app.models.pin import PinnedConversation

# --- Database Setup ---
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def seed_data():
    """
    Drops all existing tables, creates new ones based on the models,
    and populates the database with initial data.
    """
    db = SessionLocal()

    try:
        print("--- Starting Database Seeding ---")

        # Drop all tables to ensure a clean slate
        print("Dropping all tables...")
        Base.metadata.drop_all(bind=engine)
        
        # Create all tables based on your models
        print("Creating all tables...")
        Base.metadata.create_all(bind=engine)
        print("Tables created successfully.")

        # --- 1. Create Super Admin ---
        super_admin_username = settings.SUPER_ADMIN_USERNAME
        super_admin_password = settings.SUPER_ADMIN_PASSWORD
        
        hashed_password = Hasher.get_password_hash(super_admin_password)
        new_super_admin = SuperAdmin(username=super_admin_username, password_hash=hashed_password)
        db.add(new_super_admin)
        db.commit()
        print(f"✅ Super Admin '{super_admin_username}' created.")

        print("\n--- Database seeding completed successfully! ---")

    except Exception as e:
        print(f"\n❌ An error occurred during seeding: {e}")
        db.rollback()
    finally:
        db.close()
        print("Database session closed.")

if __name__ == "__main__":
    seed_data()

# from pymongo import MongoClient
# from datetime import datetime
# from dotenv import load_dotenv
# import os

# # Load environment variables (if using .env file)
# load_dotenv()

# # Connect to MongoDB Atlas
# client = MongoClient(os.getenv("MONGO_DATABASE_URL"))  
# db = client[os.getenv("MONGO_DB_NAME")]              
# collection = db["messages"]   

# # Define your date range (UTC timezone is assumed)
# start_date = datetime(2025, 8, 25)
# end_date = datetime(2025, 10, 1)

# # Delete all messages where timestamp is within the range
# result = collection.delete_many({
#     "timestamp": {
#         "$gte": start_date,
#         "$lt": end_date
#     }
# })

# print(f"✅ Deleted {result.deleted_count} messages between {start_date} and {end_date}")
