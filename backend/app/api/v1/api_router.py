from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, admin, chat, messages

api_router = APIRouter()

# Add the routers to the main API router
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin Management"])
api_router.include_router(messages.router, prefix="/messages", tags=["Message History"])
api_router.include_router(chat.router, prefix="/chat", tags=["Real-Time Chat"])
