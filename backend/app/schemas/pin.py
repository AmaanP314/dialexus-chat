# app/schemas/pin.py
from pydantic import BaseModel, Field
from typing import Optional

class PinCreate(BaseModel):
    """
    Schema for the request body when pinning or unpinning a conversation.
    """
    conversation_id: int
    conversation_type: str = Field(..., pattern="^(private|group)$")
    conversation_role: Optional[str] = Field(None, pattern="^(user|admin)$")
