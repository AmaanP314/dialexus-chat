# app/schemas/message.py
from pydantic import BaseModel, Field
from typing import Optional
import datetime

# --- Nested objects for the main Message schema ---
class MessageSender(BaseModel):
    id: int
    username: str
    role: str

class MessageReceiver(BaseModel):
    id: int
    username: str
    role: str

class MessageGroup(BaseModel):
    id: int
    name: str

class MessageContent(BaseModel):
    text: Optional[str] = None
    image: Optional[str] = None
    file: Optional[str] = None

# --- Main Message Schema for API output ---
class MessageOut(BaseModel):
    id: str = Field(..., alias="_id") # Use MongoDB's _id
    type: str
    sender: MessageSender
    receiver: Optional[MessageReceiver] = None
    group: Optional[MessageGroup] = None
    content: MessageContent
    timestamp: datetime.datetime
    status: str

    class Config:
        orm_mode = True
        allow_population_by_field_name = True
        json_encoders = {
            datetime.datetime: lambda dt: dt.isoformat(),
        }

# --- Schema for the new message history endpoint response ---
class MessageHistory(BaseModel):
    messages: list[MessageOut]
    next_cursor: Optional[str] = None
