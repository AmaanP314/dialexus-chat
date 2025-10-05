import json
from fastapi import APIRouter, Depends, HTTPException, status, Query
from motor.motor_asyncio import AsyncIOMotorClient
from sqlalchemy.orm import Session, joinedload
from typing import List, Union, Optional
import datetime
import redis.asyncio as redis
from app.db.session import get_db, get_mongo_db, get_redis_client
from app.security.dependencies import get_current_user_from_cookie
from app.security.hashing import Hasher
from app.models import Admin, User, Group, GroupMember
from app.schemas.user import UserOut, UserCreate, UserPasswordReset
from app.schemas.group import GroupCreateWithMembers, GroupWithMembers, GroupOut
from app.schemas.admin import ConversationSummary
# from app.schemas.message import MessageHistory
from app.schemas.message import PaginatedMessageResponse
from app.websocket.connection_manager import manager
from app.cache.group_members import remove_group_from_cache, add_member_to_cache, remove_member_from_cache

router = APIRouter()

def get_admin_from_dependency(current_entity: Union[User, Admin] = Depends(get_current_user_from_cookie)) -> Admin:
    """
    A helper dependency to ensure the user is an Admin.
    This replaces the old get_current_active_admin.
    """
    if not isinstance(current_entity, Admin):
        raise HTTPException(status_code=403, detail="Operation not permitted. Requires admin privileges.")
    if not current_entity.is_active:
        raise HTTPException(status_code=400, detail="Inactive admin.")
    return current_entity

# --- User Management by Admin ---

@router.post("/users", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user_for_admin(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_admin_from_dependency)
):
    # ... (logic remains the same)
    full_name = user_in.full_name if user_in.full_name else None
    full_username = f"{user_in.username}{current_admin.admin_key}"
    db_user = db.query(User).filter(User.username == full_username).first()
    if db_user:
        raise HTTPException(status_code=400, detail=f"Username '{user_in.username}' already exists in your tenant.")
    hashed_password = Hasher.get_password_hash(user_in.password)
    new_user = User(full_name=full_name, username=full_username, password_hash=hashed_password, admin_id=current_admin.id)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.get("/users/all", response_model=List[UserOut])
def list_users_for_admin(
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_admin_from_dependency)
):
    return db.query(User).filter(User.admin_id == current_admin.id).all()

@router.get("/users/active", response_model=List[UserOut])
def list_active_users_for_admin(
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_admin_from_dependency)
):
    """Lists all active users in the admin's tenant."""
    return db.query(User).filter(User.admin_id == current_admin.id, User.is_active == True).all()

@router.get("/users/deactivated", response_model=List[UserOut])
def list_deactivated_users_for_admin(
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_admin_from_dependency)
):
    """Lists all deactivated users in the admin's tenant."""
    return db.query(User).filter(User.admin_id == current_admin.id, User.is_active == False).all()

@router.get("/users/online", response_model=List[UserOut])
def get_online_users(
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_admin_from_dependency)
):
    """Gets a list of all online users within the current admin's tenant."""
    online_connection_ids = manager.get_all_connection_ids()
    online_user_ids = [int(cid.split('-')[1]) for cid in online_connection_ids if cid.startswith('user-')]

    # Fetch details only for online users that belong to this admin's tenant
    online_users_in_tenant = db.query(User).filter(
        User.id.in_(online_user_ids),
        User.admin_id == current_admin.id
    ).all()
    return online_users_in_tenant

@router.patch("/users/{user_id}/deactivate", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_admin_from_dependency)
):
    user = db.query(User).filter(User.id == user_id, User.admin_id == current_admin.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found in your tenant.")
    user.is_active = False
    db.commit()
    user_connection_id = f"user-{user.id}"
    if user_connection_id in manager.active_connections:
        logout_command = json.dumps({"event": "force_logout", "reason": "Your account has been deactivated by the administrator."})
        await manager.send_personal_message(logout_command, user_connection_id)
        manager.disconnect(user_connection_id)
    return

@router.patch("/users/{user_id}/reactivate", status_code=status.HTTP_204_NO_CONTENT)
def reactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_admin_from_dependency)
):
    # ... (logic remains the same)
    user = db.query(User).filter(User.id == user_id, User.admin_id == current_admin.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found in your tenant.")
    user.is_active = True
    db.commit()
    return

@router.patch("/users/{user_id}/reset-password", status_code=status.HTTP_204_NO_CONTENT)
async def reset_user_password(
    user_id: int,
    password_data: UserPasswordReset,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_admin_from_dependency)
):
    """
    Resets the password for a specific user within the admin's tenant.
    """
    # Find the user and verify they belong to the admin's tenant
    user = db.query(User).filter(User.id == user_id, User.admin_id == current_admin.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found in your tenant.")

    # Hash the new password and update the user's record
    hashed_password = Hasher.get_password_hash(password_data.new_password)
    user.password_hash = hashed_password
    
    db.commit()
    user_connection_id = f"user-{user.id}"
    if user_connection_id in manager.active_connections:
        logout_command = json.dumps({"event": "force_logout", "reason": "Please re-authenticate yourself as admin has reset your password."})
        await manager.send_personal_message(logout_command, user_connection_id)
        manager.disconnect(user_connection_id)
    return

# --- Group Management by Admin ---

@router.post("/groups", response_model=GroupOut, status_code=status.HTTP_201_CREATED)
async def create_group_for_admin(
    group_in: GroupCreateWithMembers,
    db: Session = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis_client), # Inject Redis client
    current_admin: Admin = Depends(get_admin_from_dependency)
):
    db_group = db.query(Group).filter(Group.name == group_in.name, Group.admin_id == current_admin.id).first()
    if db_group:
        raise HTTPException(status_code=400, detail=f"Group name '{group_in.name}' already exists in your tenant.")
    
    new_group = Group(name=group_in.name, admin_id=current_admin.id)
    db.add(new_group)
    db.flush()

    if group_in.members:
        for user_id in group_in.members:
            user = db.query(User).filter(User.id == user_id, User.admin_id == current_admin.id).first()
            if user:
                new_member = GroupMember(group_id=new_group.id, user_id=user.id)
                db.add(new_member)
                await add_member_to_cache(new_group.id, f"user-{user.id}", redis_client)

    db.commit()
    db.refresh(new_group)
    return new_group

@router.post("/groups/{group_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def add_user_to_group(
    group_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis_client), # Inject Redis client
    current_admin: Admin = Depends(get_admin_from_dependency)
):
    # ... (verification logic for group and user is unchanged) ...
    group = db.query(Group).filter(Group.id == group_id, Group.admin_id == current_admin.id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found in your tenant.")
    user = db.query(User).filter(User.id == user_id, User.admin_id == current_admin.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found in your tenant.")

    membership = db.query(GroupMember).filter(
        GroupMember.group_id == group_id, 
        GroupMember.user_id == user_id
    ).first()
    
    if membership:
        if membership.is_member_active:
            raise HTTPException(status_code=400, detail="User is already an active member of this group.")
        else:
            membership.is_member_active = True
            membership.removed_at = None
    else:
        new_member = GroupMember(group_id=group_id, user_id=user_id)
        db.add(new_member)
    
    db.commit()
    
    await add_member_to_cache(group_id, f"user-{user_id}", redis_client)
    
    return

@router.delete("/groups/{group_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_user_from_group(
    group_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis_client), # Inject Redis client
    current_admin: Admin = Depends(get_admin_from_dependency)
):
    # ... (verification logic is unchanged) ...
    group = db.query(Group).filter(Group.id == group_id, Group.admin_id == current_admin.id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found in your tenant.")
    membership = db.query(GroupMember).filter(GroupMember.group_id == group_id, GroupMember.user_id == user_id).first()
    if not membership:
        raise HTTPException(status_code=404, detail="User is not a member of this group.")

    membership.is_member_active = False
    membership.removed_at = datetime.datetime.utcnow()
    db.commit()
    
    user_connection_id = f"user-{user_id}"
    await remove_member_from_cache(group_id, user_connection_id, redis_client)
    
    if user_connection_id in manager.active_connections:
        notification_payload = json.dumps({
            "event": "member_removed",
            "type": "group",
            "id": group_id
        })
        await manager.send_personal_message(notification_payload, user_connection_id)
        # print(f"Sent 'member_removed' notification to {user_connection_id}")

    return None

@router.get("/groups/all", response_model=List[GroupWithMembers])
def list_groups_with_members_for_admin(
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_admin_from_dependency)
):
    """Lists all groups in the admin's tenant, including their members."""
    groups = (
        db.query(Group)
        .options(joinedload(Group.members).joinedload(GroupMember.user))
        .filter(Group.admin_id == current_admin.id)
        .all()
    )
    
    result = []
    for group in groups:
        members_info = [
            {"user_id": member.user.id, "username": member.user.username, "full_name": member.user.full_name}
            for member in group.members if member.is_member_active
        ]
        result.append({
            "id": group.id,
            "name": group.name,
            "admin_id": group.admin_id,
            "is_active": group.is_active,
            "members": members_info
        })
    return result

@router.get("/groups/active", response_model=List[GroupWithMembers])
def list_active_groups_with_members(
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_admin_from_dependency)
):
    """Lists all active groups in the admin's tenant, including their members."""
    groups = (
        db.query(Group)
        .options(joinedload(Group.members).joinedload(GroupMember.user))
        .filter(Group.admin_id == current_admin.id, Group.is_active == True)
        .all()
    )
    result = []
    for group in groups:
        members_info = [{"user_id": member.user.id, "username": member.user.username, "full_name": member.user.full_name} for member in group.members if member.is_member_active]
        result.append({"id": group.id, "name": group.name, "admin_id": group.admin_id, "is_active": group.is_active, "members": members_info})
    return result

@router.get("/groups/deactivated", response_model=List[GroupWithMembers])
def list_deactivated_groups_with_members(
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_admin_from_dependency)
):
    """Lists all deactivated groups in the admin's tenant, including their members."""
    groups = (
        db.query(Group)
        .options(joinedload(Group.members).joinedload(GroupMember.user))
        .filter(Group.admin_id == current_admin.id, Group.is_active == False)
        .all()
    )
    result = []
    for group in groups:
        members_info = [{"user_id": member.user.id, "username": member.user.username, "full_name": member.user.full_name} for member in group.members]
        result.append({"id": group.id, "name": group.name, "admin_id": group.admin_id, "is_active": group.is_active, "members": members_info})
    return result

@router.delete("/groups/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_admin_from_dependency),
    redis_client: redis.Redis = Depends(get_redis_client)
):
    group = db.query(Group).filter(Group.id == group_id, Group.admin_id == current_admin.id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found in your tenant.")
    group.is_active = False
    db.commit()
    remove_group_from_cache(group_id, redis_client) # Pass the Redis client to the cache function
    return

@router.get("/conversations/users", response_model=List[ConversationSummary])
async def list_user_to_user_conversations(
    db: Session = Depends(get_db),
    mongo_db: AsyncIOMotorClient = Depends(get_mongo_db),
    current_admin: Admin = Depends(get_admin_from_dependency)
):
    """
    Lists all private user-to-user conversations within the admin's tenant,
    sorted by the most recent message.
    """
    # 1. Get all user IDs for the current admin's tenant
    tenant_user_ids = [user.id for user in db.query(User.id).filter(User.admin_id == current_admin.id).all()]
    if not tenant_user_ids:
        return []

    messages_collection = mongo_db["messages"]
    
    # 2. Run the aggregation pipeline in MongoDB
    pipeline = [
        # Match only private messages between users in this tenant
        {"$match": {
            "type": "private",
            "sender.role": "user",
            "receiver.role": "user",
            "sender.id": {"$in": tenant_user_ids},
            "receiver.id": {"$in": tenant_user_ids}
        }},
        # Group by a canonical key (sorted participants)
        {"$group": {
            "_id": {
                "participants": {
                    "$sortArray": {"input": ["$sender", "$receiver"], "sortBy": {"id": 1}}
                }
            },
            "last_message_timestamp": {"$max": "$timestamp"},
            "message_count": {"$sum": 1}
        }},
        # Sort conversations by the most recent activity
        {"$sort": {"last_message_timestamp": -1}}
    ]
    
    aggregation_result = await messages_collection.aggregate(pipeline).to_list(length=None)

    # 3. Format the response
    response = []
    for item in aggregation_result:
        participants = item["_id"]["participants"]
        response.append({
            "user_one": {"id": participants[0]["id"], "username": participants[0]["username"]},
            "user_two": {"id": participants[1]["id"], "username": participants[1]["username"]},
            "last_message_timestamp": item["last_message_timestamp"],
            "message_count": item["message_count"]
        })
        
    return response

@router.get("/messages/users/{user1_id}/{user2_id}", response_model=PaginatedMessageResponse)
async def get_user_to_user_message_history(
    user1_id: int,
    user2_id: int,
    before: Optional[str] = Query(None, description="ISO timestamp cursor for pagination"),
    limit: int = Query(50, gt=0, le=100),
    db: Session = Depends(get_db),
    mongo_db: AsyncIOMotorClient = Depends(get_mongo_db),
    current_admin: Admin = Depends(get_admin_from_dependency)
):
    """
    Fetches the detailed message history for a specific user-to-user conversation.
    """
    # 1. Security Check: Verify both users belong to the admin's tenant
    users = db.query(User).filter(User.id.in_([user1_id, user2_id]), User.admin_id == current_admin.id).all()
    if len(users) != 2:
        raise HTTPException(status_code=404, detail="One or both users not found in your tenant.")

    # 2. Build the MongoDB query
    messages_collection = mongo_db["messages"]
    query = {
        "$or": [
            {"sender.id": user1_id, "receiver.id": user2_id},
            {"sender.id": user2_id, "receiver.id": user1_id}
        ],
        "type": "private"
    }

    if before:
        try:
            cursor_time = datetime.datetime.fromisoformat(before.replace("Z", "+00:00"))
            query["timestamp"] = {"$lt": cursor_time}
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid 'before' timestamp format.")
            
    # 3. Fetch messages
    messages_cursor = messages_collection.find(query).sort("timestamp", -1).limit(limit)
    messages = await messages_cursor.to_list(length=limit)

    for msg in messages:
        msg["_id"] = str(msg["_id"])
        receiver_identity = {
            "id": msg["receiver"]["id"],
            "role": msg["receiver"]["role"]
        }
        
        # Check if the receiver's identity object is in the read_by array
        if receiver_identity in msg.get("read_by", []):
            msg["status"] = "read"
        else:
            msg["status"] = "sent"

    next_cursor = None
    if len(messages) == limit:
        next_cursor = messages[-1]['timestamp'].isoformat() + "Z"
        
    return {"messages": messages, "next_cursor": next_cursor}