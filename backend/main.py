# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.api_router import api_router
from app.db.session import close_mongo_connection, connect_to_mongo

app = FastAPI(
    title="Multi-Tenant Chat API",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
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

@app.on_event("startup")
async def startup_event():
    """
    Connect to MongoDB on startup.
    """
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_event():
    """
    Close MongoDB connection on shutdown.
    """
    await close_mongo_connection()


# Include the API router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    """
    Root endpoint for basic health check.
    """
    return {"message": "Welcome to the Multi-Tenant Chat API"}
