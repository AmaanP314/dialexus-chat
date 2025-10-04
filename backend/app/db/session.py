# app/db/session.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
import redis
from functools import lru_cache
from fastapi import Request

# --- PostgreSQL (SQLAlchemy) Setup ---
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """
    Dependency to get a DB session.
    Ensures the session is always closed after the request.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- MongoDB (Motor) Setup ---
class DataBase:
    client: AsyncIOMotorClient = None

db = DataBase()

async def get_mongo_db():
    """
    Dependency to get the MongoDB database instance.
    """
    return db.client[settings.MONGO_DB_NAME]

async def connect_to_mongo():
    """
    Connect to the MongoDB instance.
    """
    print("Connecting to MongoDB...")
    db.client = AsyncIOMotorClient(settings.MONGO_DATABASE_URL)
    print("Successfully connected to MongoDB.")

async def close_mongo_connection():
    """
    Close the MongoDB connection.
    """
    print("Closing MongoDB connection...")
    db.client.close()
    print("MongoDB connection closed.")


# --- Redis Setup ---
def get_redis_client(request: Request):
    """
    Dependency to get the Redis client instance from the app state.
    Only for HTTP endpoints, not for WebSocket.
    """
    return request.app.state.redis_client