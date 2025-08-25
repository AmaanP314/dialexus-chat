from pydantic import BaseModel, Field
from typing import Optional

class SuperAdminCreate(BaseModel):
    username: str
    password: str = Field(..., min_length=8)
    admin_key: str = Field(..., description="A unique key for the new admin tenant.")

class AdminOut(BaseModel):
    id: int
    username: str
    admin_key: str
    is_active: bool

    class Config:
        orm_mode = True
