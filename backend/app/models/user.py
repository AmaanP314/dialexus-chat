from sqlalchemy import Boolean, Column, String, Integer, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from .base import Base
import datetime

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, index=True)
    username = Column(Text, unique=True, nullable=False)
    full_name = Column(String, nullable=True)
    password_hash = Column(Text, nullable=False)
    admin_id = Column(Integer, ForeignKey('admins.id', ondelete="CASCADE"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_seen = Column(DateTime, default=datetime.datetime.utcnow)
    owner_admin = relationship("Admin", back_populates="users")
    groups = relationship("GroupMember", back_populates="user", cascade="all, delete-orphan")