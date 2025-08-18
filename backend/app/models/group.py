from sqlalchemy import Boolean, Column, Integer, Text, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from .base import Base
import datetime

class Group(Base):
    __tablename__ = 'groups'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(Text, nullable=False)
    admin_id = Column(Integer, ForeignKey('admins.id', ondelete="CASCADE"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    owner_admin = relationship("Admin", back_populates="groups")
    members = relationship("GroupMember", back_populates="group", cascade="all, delete-orphan")
    
    __table_args__ = (UniqueConstraint('name', 'admin_id', name='_group_name_admin_uc'),)