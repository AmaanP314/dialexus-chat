from sqlalchemy import Boolean, Column, Integer, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from .base import Base
import datetime

class GroupMember(Base):
    __tablename__ = 'group_members'
    group_id = Column(Integer, ForeignKey('groups.id', ondelete="CASCADE"), primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete="CASCADE"), primary_key=True)
    is_admin = Column(Boolean, default=False)
    joined_at = Column(DateTime, default=datetime.datetime.utcnow)
    is_member_active = Column(Boolean, nullable=False, default=True)
    removed_at = Column(DateTime, nullable=True)

    group = relationship("Group", back_populates="members")
    user = relationship("User", back_populates="groups")