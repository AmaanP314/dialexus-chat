# app/db/session.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
import redis
from functools import lru_cache

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

@lru_cache()
def get_redis_client():
    """
    Creates and returns a Redis client instance with a connection pool.
    Using lru_cache ensures this function is only run once.
    """
    print("Creating Redis client...")
    # The decode_responses=True flag is crucial. It ensures that data
    # retrieved from Redis is automatically decoded from bytes to UTF-8 strings.
    client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)
    return client

# You can import 'redis_client' in other modules to use it.
redis_client = get_redis_client()
