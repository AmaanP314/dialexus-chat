# # scripts/seed.py
# import os
# import sys
# from sqlalchemy import create_engine
# from sqlalchemy.orm import sessionmaker

# # Add the project root to the Python path
# sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# from app.core.config import settings
# from app.security.hashing import Hasher
# from app.models.base import Base
# from app.models.super_admin import SuperAdmin
# from app.models.admin import Admin
# from app.models.user import User

# # --- Database Setup ---
# engine = create_engine(settings.DATABASE_URL)
# SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# def seed_data():
#     """
#     Populates the database with initial data.
#     """
#     db = SessionLocal()

#     try:
#         # Drop all tables (for a clean seed) and recreate them
#         print("Dropping all tables...")
#         Base.metadata.drop_all(bind=engine)
#         print("Creating all tables...")
#         Base.metadata.create_all(bind=engine)
#         print("Tables created successfully.")

#         # --- Create Super Admin ---
#         super_admin_username = "daemonTargaryen"
#         super_admin_password = "Daemon@Targaryen.314"
        
#         if not db.query(SuperAdmin).filter(SuperAdmin.username == super_admin_username).first():
#             hashed_password = Hasher.get_password_hash(super_admin_password)
#             new_super_admin = SuperAdmin(username=super_admin_username, password_hash=hashed_password)
#             db.add(new_super_admin)
#             db.commit()
#             print(f"Super Admin '{super_admin_username}' created.")

#         # --- Create Admin Tenant 1 (Company A) ---
#         admin1_username = "admin_a"
#         admin1_password = "pass123"
#         admin1_key = "1"

#         if not db.query(Admin).filter(Admin.username == admin1_username).first():
#             hashed_password = Hasher.get_password_hash(admin1_password)
#             new_admin1 = Admin(username=admin1_username, password_hash=hashed_password, admin_key=admin1_key)
#             db.add(new_admin1)
#             db.commit()
#             db.refresh(new_admin1)
#             print(f"Admin '{admin1_username}' with key '{admin1_key}' created.")

#             # --- Create Users for Admin 1 ---
#             users_a = [("alex", "pass123"), ("brenda", "pass123")]
#             for user, password in users_a:
#                 full_username = f"{user}{admin1_key}"
#                 if not db.query(User).filter(User.username == full_username).first():
#                     hashed_pass = Hasher.get_password_hash(password)
#                     new_user = User(username=full_username, password_hash=hashed_pass, admin_id=new_admin1.id)
#                     db.add(new_user)
#             db.commit()
#             print(f"Users for Admin '{admin1_username}' created.")

#         # --- Create Admin Tenant 2 (Company B) ---
#         admin2_username = "admin_b"
#         admin2_password = "pass456"
#         admin2_key = "2"

#         if not db.query(Admin).filter(Admin.username == admin2_username).first():
#             hashed_password = Hasher.get_password_hash(admin2_password)
#             new_admin2 = Admin(username=admin2_username, password_hash=hashed_password, admin_key=admin2_key)
#             db.add(new_admin2)
#             db.commit()
#             db.refresh(new_admin2)
#             print(f"Admin '{admin2_username}' with key '{admin2_key}' created.")

#             # --- Create Users for Admin 2 ---
#             users_b = [("carlos", "pass456"), ("diana", "pass456"), ("alex", "pass456")]
#             for user, password in users_b:
#                 full_username = f"{user}{admin2_key}" # e.g., alex2
#                 if not db.query(User).filter(User.username == full_username).first():
#                     hashed_pass = Hasher.get_password_hash(password)
#                     new_user = User(username=full_username, password_hash=hashed_pass, admin_id=new_admin2.id)
#                     db.add(new_user)
#             db.commit()
#             print(f"Users for Admin '{admin2_username}' created.")
        
#         print("\nDatabase seeding completed successfully!")

#     except Exception as e:
#         print(f"An error occurred during seeding: {e}")
#         db.rollback()
#     finally:
#         db.close()

# if __name__ == "__main__":
#     print("Starting database seeding process...")
#     seed_data()


from pymongo import MongoClient
from datetime import datetime
from dotenv import load_dotenv
import os

# Load environment variables (if using .env file)
load_dotenv()

# Connect to MongoDB Atlas
client = MongoClient(os.getenv("MONGO_DATABASE_URL"))  
db = client[os.getenv("MONGO_DB_NAME")]              
collection = db["messages"]   

# Define your date range (UTC timezone is assumed)
start_date = datetime(2025, 8, 25)
end_date = datetime(2025, 9, 4)

# Delete all messages where timestamp is within the range
result = collection.delete_many({
    "timestamp": {
        "$gte": start_date,
        "$lt": end_date
    }
})

print(f"✅ Deleted {result.deleted_count} messages between {start_date} and {end_date}")
