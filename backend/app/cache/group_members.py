# from typing import Dict, Set
# from threading import Lock
# from sqlalchemy.orm import Session
# from app.models import GroupMember, Group

# group_members_cache: Dict[int, Set[str]] = {}
# lock = Lock()

# def get_group_members(group_id: int, db: Session) -> Set[str]:
#     with lock:
#         if group_id in group_members_cache:
#             return group_members_cache[group_id]

#     group = db.query(Group).get(group_id)
#     if not group: return set()

#     members = db.query(GroupMember).filter_by(group_id=group.id).all()
#     connection_ids = {f"user-{m.user_id}" for m in members}
#     connection_ids.add(f"admin-{group.admin_id}")
    
#     with lock:
#         group_members_cache[group_id] = connection_ids
#     return connection_ids

# def add_member_to_cache(group_id: int, connection_id: str):
#     with lock:
#         if group_id not in group_members_cache:
#             return
#         group_members_cache[group_id].add(connection_id)

# def remove_member_from_cache(group_id: int, connection_id: str):
#     with lock:
#         if group_id in group_members_cache:
#             group_members_cache[group_id].discard(connection_id)

# def remove_group_from_cache(group_id: int):
#     """Removes an entire group from the cache, e.g., when it's deactivated."""
#     with lock:
#         if group_id in group_members_cache:
#             del group_members_cache[group_id]

from sqlalchemy.orm import Session
from app.models import GroupMember, Group
from app.db.session import redis_client

# Define a cache expiration time in seconds (e.g., 1 hour)
CACHE_EXPIRATION_SECONDS = 3600

def get_group_members(group_id: int, db: Session) -> set[str]:
    """
    Returns a set of connection IDs for a group, using Redis as a cache.
    """
    cache_key = f"group:{group_id}:members"
    
    # Try to fetch from Redis cache first
    cached_members = redis_client.smembers(cache_key)
    if cached_members:
        return cached_members

    # --- Cache Miss: Load from PostgreSQL ---
    group = db.query(Group).get(group_id)
    if not group:
        return set()

    # We only cache ACTIVE members for broadcasting new messages
    members = db.query(GroupMember).filter_by(group_id=group.id, is_member_active=True).all()
    
    connection_ids = {f"user-{m.user_id}" for m in members}
    connection_ids.add(f"admin-{group.admin_id}")
    
    # Populate the Redis cache
    if connection_ids:
        # Use a pipeline for atomic operations
        pipeline = redis_client.pipeline()
        pipeline.sadd(cache_key, *connection_ids)
        pipeline.expire(cache_key, CACHE_EXPIRATION_SECONDS)
        pipeline.execute()
        
    return connection_ids

def add_member_to_cache(group_id: int, connection_id: str):
    """Adds a member to a group's cache in Redis."""
    cache_key = f"group:{group_id}:members"
    if redis_client.exists(cache_key):
        redis_client.sadd(cache_key, connection_id)

def remove_member_from_cache(group_id: int, connection_id: str):
    """Removes a member from a group's cache in Redis."""
    cache_key = f"group:{group_id}:members"
    redis_client.srem(cache_key, connection_id)

def remove_group_from_cache(group_id: int):
    """Removes an entire group from the cache in Redis."""
    cache_key = f"group:{group_id}:members"
    redis_client.delete(cache_key)
