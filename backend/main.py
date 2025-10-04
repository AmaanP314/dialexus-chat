# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.api_router import api_router
from app.db.session import close_mongo_connection, connect_to_mongo
from contextlib import asynccontextmanager
import redis.asyncio as redis

@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Code to run on startup ---
    print("Application startup: Initializing connections...")
    
    # Connect to Redis
    redis_pool = redis.ConnectionPool.from_url(
        settings.REDIS_URL, decode_responses=True
    )
    app.state.redis_client = redis.Redis(connection_pool=redis_pool)
    print("Redis connection pool created.")

    # --- ADD THIS: Connect to MongoDB ---
    await connect_to_mongo()
    
    yield # The application runs here
    
    # --- Code to run on shutdown ---
    print("Application shutdown: Closing connections...")

    # Close Redis connection
    await app.state.redis_client.close()
    print("Redis connection pool closed.")

    # --- ADD THIS: Close MongoDB connection ---
    await close_mongo_connection()

app = FastAPI(
    title="Multi-Tenant Chat API",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

origins = [
    "http://localhost:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the API router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    """
    Root endpoint for basic health check.
    """
    return {"message": "Welcome to the Multi-Tenant Chat API"}
    """
    Close MongoDB connection on shutdown.
    """
    # await close_mongo_connection()


# Include the API router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    """
    Root endpoint for basic health check.
    """
    return {"message": "Welcome to the Multi-Tenant Chat API"}
