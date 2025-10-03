# # app/cache/tenant_members.py
# from typing import Dict, List, Set
# from threading import Lock
# from sqlalchemy.orm import Session
# from app.models import User, Admin

# # Cache format: { tenant_id: {"user-1", "user-2", "admin-10"} }
# tenant_members_cache: Dict[int, Set[str]] = {}
# lock = Lock()

# def get_tenant_connection_ids(tenant_id: int, db: Session) -> Set[str]:
#     """
#     Returns cached connection IDs for a tenant.
#     If not cached, it queries the DB, populates the cache, and returns the data.
#     """
#     with lock:
#         if tenant_id in tenant_members_cache:
#             return tenant_members_cache[tenant_id]

#     # --- Not in cache, so load from PostgreSQL ---
#     tenant_users = db.query(User.id).filter(User.admin_id == tenant_id).all()
#     # The admin is also a member of their own tenant
#     tenant_admin = db.query(Admin.id).filter(Admin.id == tenant_id).first()

#     connection_ids = {f"user-{uid}" for uid, in tenant_users}
#     if tenant_admin:
#         connection_ids.add(f"admin-{tenant_admin.id}")
    
#     # Populate the cache
#     with lock:
#         tenant_members_cache[tenant_id] = connection_ids
    
#     return connection_ids

from sqlalchemy.orm import Session
from app.models import User, Admin
from app.db.session import redis_client

# Define a cache expiration time in seconds (e.g., 1 hour)
CACHE_EXPIRATION_SECONDS = 3600

def get_tenant_connection_ids(tenant_id: int, db: Session) -> set[str]:
    """
    Returns a set of connection IDs for a tenant, using Redis as a cache.
    """
    cache_key = f"tenant:{tenant_id}:members"

    # Try to fetch from Redis cache first
    cached_members = redis_client.smembers(cache_key)
    if cached_members:
        return cached_members

    # --- Cache Miss: Load from PostgreSQL ---
    tenant_users = db.query(User.id).filter(User.admin_id == tenant_id).all()
    tenant_admin = db.query(Admin.id).filter(Admin.id == tenant_id).first()

    connection_ids = {f"user-{uid}" for uid, in tenant_users}
    if tenant_admin:
        connection_ids.add(f"admin-{tenant_admin.id}")
    
    # Populate the Redis cache
    if connection_ids:
        pipeline = redis_client.pipeline()
        pipeline.sadd(cache_key, *connection_ids)
        pipeline.expire(cache_key, CACHE_EXPIRATION_SECONDS)
        pipeline.execute()
    
    return connection_ids

def invalidate_tenant_cache(tenant_id: int):
    """Invalidates the cache for a specific tenant."""
    cache_key = f"tenant:{tenant_id}:members"
    redis_client.delete(cache_key)
