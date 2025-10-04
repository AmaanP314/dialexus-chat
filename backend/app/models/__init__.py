# app/models/__init__.py

# This makes it easier to import models from other parts of the application.
# For example: from app.models import User, Admin

from .base import Base
from .super_admin import SuperAdmin
from .admin import Admin
from .user import User
from .group import Group
from .group_member import GroupMember
from .pin import PinnedConversation
