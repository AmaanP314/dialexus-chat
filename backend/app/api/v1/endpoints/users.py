from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Union

from app.db.session import get_db, get_mongo_db
from app.security.dependencies import get_current_user_from_cookie
from app.models import User, Admin, SuperAdmin, Group, GroupMember
from app.websocket.connection_manager import manager
from typing import List
from app.schemas.user import UserOut, AdminOut, SearchResult, ConversationList, ConversationPartner, MeOut, MeProfileOut

router = APIRouter()

@router.get("/me", response_model=MeProfileOut)
def read_users_me(
    current_entity: Union[User, Admin, SuperAdmin] = Depends(get_current_user_from_cookie)
):
    """
    Get the profile of the currently authenticated user or admin.
    Includes admin_key for admin users.
    """
    response_data = {
        "id": current_entity.id,
        "username": current_entity.username,
        "created_at": current_entity.created_at,
        "admin_key": None # Default to None
    }

    if isinstance(current_entity, User):
        response_data["type"] = "user"
        response_data["created_by"] = current_entity.owner_admin.username
    
    elif isinstance(current_entity, Admin):
        response_data["type"] = "admin"
        response_data["created_by"] = "Super Admin"
        # *** FIX IS HERE: Add the admin_key to the response data ***
        response_data["admin_key"] = current_entity.admin_key
        
    elif isinstance(current_entity, SuperAdmin):
        response_data["type"] = "super_admin"
        response_data["created_by"] = "System"
        
    else:
        raise HTTPException(status_code=403, detail="Invalid entity type.")

    return MeProfileOut(**response_data)

@router.get("/search", response_model=SearchResult)
def search_for_entities(
    query: str = Query(..., min_length=1, description="Search query for users, admins, or groups"),
    # current_entity: Union[User, Admin] = Depends(get_current_active_user_or_admin),
    current_entity: Union[User, Admin] = Depends(get_current_user_from_cookie),
    db: Session = Depends(get_db)
):
    """
    Search for users, the tenant admin, and groups within the same tenant.
    - For Users: Shows other users in their tenant.
    - For Admins: Shows all users and groups in their tenant.
    """
    if isinstance(current_entity, Admin):
        tenant_id = current_entity.id
        current_id = None
    else: # It's a User
        tenant_id = current_entity.admin_id
        current_id = current_entity.id

    # --- Search for users ---
    user_query = db.query(User).filter(
        User.username.ilike(f"%{query}%"),
        User.admin_id == tenant_id
    )
    if current_id: # Exclude self from search if the searcher is a user
        user_query = user_query.filter(User.id != current_id)
    found_users = user_query.all()

    # --- Search for the admin ---
    found_admins = db.query(Admin).filter(
        Admin.username.ilike(f"%{query}%"),
        Admin.id == tenant_id
    ).all()
    
    # --- Search for groups ---
    group_query = db.query(Group).filter(
        Group.name.ilike(f"%{query}%"),
        Group.admin_id == tenant_id
    )
    # If the searcher is a standard user, only show groups they are a member of.
    if isinstance(current_entity, User):
        group_query = group_query.join(Group.members).filter(GroupMember.user_id == current_entity.id)
    
    found_groups = group_query.all()

    return {"users": found_users, "admins": found_admins, "groups": found_groups}

@router.get("/conversations", response_model=ConversationList)
async def get_user_conversations(
    # current_entity: Union[User, Admin] = Depends(get_current_active_user_or_admin),
    current_entity: Union[User, Admin] = Depends(get_current_user_from_cookie),
    db: Session = Depends(get_db),
    mongo_db: AsyncIOMotorClient = Depends(get_mongo_db)
):
    messages_collection = mongo_db["messages"]
    
    entity_id = current_entity.id
    entity_role = "admin" if isinstance(current_entity, Admin) else "user"
    tenant_id = current_entity.id if isinstance(current_entity, Admin) else current_entity.admin_id

    user_group_ids = []
    if isinstance(current_entity, User):
        memberships = db.query(GroupMember.group_id).filter_by(user_id=entity_id).all()
        user_group_ids = [row.group_id for row in memberships]
    else: # An admin is part of all groups in their tenant
        groups = db.query(Group.id).filter_by(admin_id=tenant_id).all()
        user_group_ids = [row.id for row in groups]

    pipeline = [
        {"$match": {
            "$or": [
                # Private messages sent to or from the user
                {"sender.id": entity_id, "sender.role": entity_role},
                {"receiver.id": entity_id, "receiver.role": entity_role},
                # Messages from any group the user is a member of
                {"group.id": {"$in": user_group_ids}}
            ]
        }},
        {"$sort": {"timestamp": -1}},
        {"$group": {
            "_id": {
                "$cond": {
                    "if": {"$eq": ["$type", "private"]},
                    "then": {
                        "participants": {
                           "$sortArray": { "input": [ "$sender", "$receiver" ], "sortBy": { "id": 1 } }
                        }
                    },
                    "else": {"$concat": ["group-", {"$toString": "$group.id"}]}
                }
            },
            "last_message_doc": {"$first": "$$ROOT"}
        }},
        {"$replaceRoot": {"newRoot": "$last_message_doc"}}
    ]

    latest_messages = await messages_collection.aggregate(pipeline).to_list(length=None)
    
    conversations = []
    # The post-aggregation filtering is no longer needed, as the DB query is now correct.
    for msg in sorted(latest_messages, key=lambda x: x['timestamp'], reverse=True):
        last_message_text = msg.get("content", {}).get("text", "[attachment]")
        
        if msg['type'] == 'private':
            partner = msg['receiver'] if msg['sender']['id'] == entity_id and msg['sender']['role'] == entity_role else msg['sender']
            conversations.append(ConversationPartner(
                id=partner['id'], name=partner['username'], type=partner['role'],
                last_message=last_message_text, timestamp=msg['timestamp']
            ))
        elif msg['type'] == 'group':
            group = msg['group']
            conversations.append(ConversationPartner(
                id=group['id'], name=group['name'], type='group',
                last_message=last_message_text, timestamp=msg['timestamp']
            ))

    return {"conversations": conversations}