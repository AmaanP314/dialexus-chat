from pydantic import BaseModel
from typing import List, Optional

class GroupMemberInfo(BaseModel):
    user_id: int
    username: str

class GroupWithMembers(BaseModel):
    id: int
    name: str
    admin_id: int
    is_active: bool
    members: List[GroupMemberInfo]

    class Config:
        orm_mode = True

class GroupCreateWithMembers(BaseModel):
    name: str
    members: Optional[List[int]] = []

class GroupCreate(BaseModel):
    name: str

class GroupOut(BaseModel):
    id: int
    name: str
    admin_id: int

    class Config:
        orm_mode = True
