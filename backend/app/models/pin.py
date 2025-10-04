# app/models/pin.py
from sqlalchemy import Column, Integer, String, DateTime, Enum as SQLAlchemyEnum
from sqlalchemy.sql import func
from .base import Base

class PinnedConversation(Base):
    """
    Represents a user's choice to pin a specific conversation.
    """
    __tablename__ = "pinned_conversations"

    id = Column(Integer, primary_key=True, index=True)
    
    # Who is doing the pinning
    pinner_id = Column(Integer, nullable=False, index=True)
    pinner_role = Column(String, nullable=False)
    
    # What is being pinned
    conversation_type = Column(String, nullable=False) # 'private' or 'group'
    conversation_id = Column(Integer, nullable=False)
    conversation_role = Column(String, nullable=True) # 'user' or 'admin', null for groups
    
    pinned_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<PinnedConversation pinner={self.pinner_role}-{self.pinner_id} pins={self.conversation_type}-{self.conversation_id}>"
