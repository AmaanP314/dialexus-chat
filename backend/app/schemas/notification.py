# app/schemas/notification.py
from pydantic import BaseModel
from typing import List, Optional
import datetime

class ConversationDetails(BaseModel):
    id: int
    name: str
    type: str # 'user', 'admin', or 'group'

class LastMessage(BaseModel):
    preview: str
    timestamp: datetime.datetime

class NotificationItem(BaseModel):
    conversation_details: ConversationDetails
    last_message: LastMessage
    unread_count: int

class NotificationSummary(BaseModel):
    notifications: List[NotificationItem]
