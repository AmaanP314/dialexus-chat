from sqlalchemy import Boolean, Column, Integer, String, Text, DateTime
from sqlalchemy.orm import relationship
from .base import Base
import datetime

class Admin(Base):
    __tablename__ = 'admins'
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    admin_key = Column(Text, unique=True, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    users = relationship("User", back_populates="owner_admin", cascade="all, delete-orphan")
    groups = relationship("Group", back_populates="owner_admin", cascade="all, delete-orphan")