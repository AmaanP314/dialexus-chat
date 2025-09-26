# app/schemas/user.py
from pydantic import BaseModel, Field
from typing import List, Union, Optional
import datetime
from .group import GroupOut

class UserCreate(BaseModel):
    username: str
    password: str
    full_name: Optional[str] = None

class MeProfileOut(BaseModel):
    id: int
    username: str
    full_name: Optional[str] = None
    type: str
    created_by: str
    created_at: datetime.datetime
    admin_key: Optional[str] = None

class UserOut(BaseModel):
    id: int
    username: str
    full_name: Optional[str] = None
    type: str = "User"
    
    class Config:
        orm_mode = True

class AdminOut(BaseModel):
    id: int
    username: str
    full_name: Optional[str] = None
    type: str = "Admin"
    admin_key: str

    class Config:
        orm_mode = True

# A flexible response model for the /me endpoint
MeOut = Union[UserOut, AdminOut]

# A schema for the search result
class SearchResult(BaseModel):
    users: List[UserOut]
    admins: List[AdminOut]
    groups: List[GroupOut] 

# Schemas for the conversation list
class ConversationPartner(BaseModel):
    id: int
    name: str
    full_name: Optional[str] = None
    type: str # "user", "group", or "admin"
    last_message: str
    timestamp: datetime.datetime

class ConversationList(BaseModel):
    conversations: List[ConversationPartner]

class UserLoginSchema(BaseModel):
    username: str
    password: str

class UserPasswordReset(BaseModel):
    new_password: str

class PasswordUpdate(BaseModel):
    old_password: str
    new_password: str