from sqlalchemy import Column, Integer, String, Text, DateTime
from .base import Base
import datetime

class SuperAdmin(Base):
    __tablename__ = 'super_admin'
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)