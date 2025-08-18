from pydantic import BaseModel
from typing import List
import datetime

class AdminUserCreate(BaseModel):
    username: str
    password: str

class AdminUserUpdate(BaseModel):
    is_active: bool

class OnlineUser(BaseModel):
    id: int
    username: str
    role: str

class AllOnlineUsers(BaseModel):
    users: List[OnlineUser]

class UserPairInfo(BaseModel):
    id: int
    username: str

class ConversationSummary(BaseModel):
    user_one: UserPairInfo
    user_two: UserPairInfo
    last_message_timestamp: datetime.datetime
    message_count: int