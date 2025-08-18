from typing import Dict, Set
from threading import Lock
from sqlalchemy.orm import Session
from app.models import GroupMember, Group

group_members_cache: Dict[int, Set[str]] = {}
lock = Lock()

def get_group_members(group_id: int, db: Session) -> Set[str]:
    with lock:
        if group_id in group_members_cache:
            return group_members_cache[group_id]

    group = db.query(Group).get(group_id)
    if not group: return set()

    members = db.query(GroupMember).filter_by(group_id=group.id).all()
    connection_ids = {f"user-{m.user_id}" for m in members}
    connection_ids.add(f"admin-{group.admin_id}")
    
    with lock:
        group_members_cache[group_id] = connection_ids
    return connection_ids

def add_member_to_cache(group_id: int, connection_id: str):
    with lock:
        if group_id not in group_members_cache:
            return
        group_members_cache[group_id].add(connection_id)

def remove_member_from_cache(group_id: int, connection_id: str):
    with lock:
        if group_id in group_members_cache:
            group_members_cache[group_id].discard(connection_id)

def remove_group_from_cache(group_id: int):
    """Removes an entire group from the cache, e.g., when it's deactivated."""
    with lock:
        if group_id in group_members_cache:
            del group_members_cache[group_id]
