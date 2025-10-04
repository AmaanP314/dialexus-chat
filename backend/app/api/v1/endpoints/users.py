from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Union

from app.db.session import get_db, get_mongo_db
from app.security.dependencies import get_current_user_from_cookie
from app.models import User, Admin, SuperAdmin, Group, GroupMember, PinnedConversation


from app.schemas.user import SearchResult, ConversationList, ConversationPartner, MeProfileOut, PasswordUpdate, FullNameUpdate 
from app.security.hashing import Hasher 

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
        "full_name": current_entity.full_name,
        "created_at": current_entity.created_at,
        "admin_key": None # Default to None
    }

    if isinstance(current_entity, User):
        response_data["type"] = "user"
        response_data["created_by"] = current_entity.owner_admin.username
    
    elif isinstance(current_entity, Admin):
        response_data["type"] = "admin"
        response_data["created_by"] = "Super Admin"
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
    # user_query = db.query(User).filter(
    #     User.username.ilike(f"%{query}%"),
    #     User.admin_id == tenant_id
    # )
    user_query = db.query(User).filter(
        User.admin_id == tenant_id,
        or_(
            User.username.ilike(f"%{query}%"),
            User.full_name.ilike(f"%{query}%")
            ),
    )
    if current_id: # Exclude self from search if the searcher is a user
        user_query = user_query.filter(User.id != current_id)
    found_users = user_query.all()

    # --- Search for the admin ---
    # found_admins = db.query(Admin).filter(
    #     Admin.username.ilike(f"%{query}%"),
    #     Admin.id == tenant_id
    # ).all()
    found_admins = db.query(Admin).filter(
        Admin.id == tenant_id,
        or_(
            Admin.username.ilike(f"%{query}%"),
            Admin.full_name.ilike(f"%{query}%")
        )
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
    current_entity: Union[User, Admin] = Depends(get_current_user_from_cookie),
    db: Session = Depends(get_db),
    mongo_db: AsyncIOMotorClient = Depends(get_mongo_db)
):
    messages_collection = mongo_db["messages"]
    
    entity_id = current_entity.id
    entity_role = "admin" if isinstance(current_entity, Admin) else "user"

    # --- 1. FETCH PINNED CONVERSATIONS FOR THE CURRENT USER ---
    pinned_items = db.query(PinnedConversation).filter_by(pinner_id=entity_id, pinner_role=entity_role).all()
    
    pinned_set = {
        f"{pin.conversation_role or pin.conversation_type}-{pin.conversation_id}" for pin in pinned_items
    }
    print("Pinned Set:", pinned_set)

    # --- 1. Fetch Detailed Group Membership Info ---
    memberships_map = {}
    if isinstance(current_entity, User):
        memberships = db.query(GroupMember).filter_by(user_id=entity_id).all()
        memberships_map = {m.group_id: m for m in memberships}
    elif isinstance(current_entity, Admin):
        groups = db.query(Group).filter_by(admin_id=entity_id).all()
        for group in groups:
            mock_membership = GroupMember(group_id=group.id, is_member_active=True, removed_at=None)
            memberships_map[group.id] = mock_membership

    # --- 2. Dynamically Build the Match Query ---
    match_conditions = [
        {"sender.id": entity_id, "sender.role": entity_role},
        {"receiver.id": entity_id, "receiver.role": entity_role},
    ]

    active_group_ids = [gid for gid, m in memberships_map.items() if m.is_member_active]
    if active_group_ids:
        match_conditions.append({"group.id": {"$in": active_group_ids}})

    inactive_memberships = [m for m in memberships_map.values() if not m.is_member_active]
    for m in inactive_memberships:
        if m.removed_at:
            match_conditions.append({
                "group.id": m.group_id,
                "timestamp": {"$lt": m.removed_at}
            })

    pipeline = [
        {"$match": {"$or": match_conditions}},
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
                    "else": "$group.id"
                }
            },
            "last_message_doc": {"$first": "$$ROOT"}
        }},
        {"$replaceRoot": {"newRoot": "$last_message_doc"}}
    ]

    latest_messages = await messages_collection.aggregate(pipeline).to_list(length=None)
    
    # --- EFFICIENTLY FETCH FULL NAMES ---
    user_ids_to_fetch = set()
    admin_ids_to_fetch = set()
    for msg in latest_messages:
        if msg['type'] == 'private':
            partner = msg['receiver'] if msg['sender']['id'] == entity_id and msg['sender']['role'] == entity_role else msg['sender']
            if partner['role'] == 'user':
                user_ids_to_fetch.add(partner['id'])
            elif partner['role'] == 'admin':
                admin_ids_to_fetch.add(partner['id'])

    users_data = db.query(User.id, User.username, User.full_name).filter(User.id.in_(user_ids_to_fetch)).all()
    admins_data = db.query(Admin.id, Admin.username, Admin.full_name).filter(Admin.id.in_(admin_ids_to_fetch)).all()
    
    details_map = {f"user-{u.id}": u for u in users_data}
    details_map.update({f"admin-{a.id}": a for a in admins_data})

    # --- BUILD THE FINAL RESPONSE ---
    conversations = []
    for msg in sorted(latest_messages, key=lambda x: x['timestamp'], reverse=True):
        last_message_text = msg.get("content", {}).get("text")
        if not last_message_text:
            if msg.get("content", {}).get("image") or msg.get("content", {}).get("file"):
                last_message_text = "[Attachment]"
            else:
                last_message_text = ""
        
        if msg['type'] == 'private':
            partner = msg['receiver'] if msg['sender']['id'] == entity_id and msg['sender']['role'] == entity_role else msg['sender']
            partner_key = f"{partner['role']}-{partner['id']}"
            partner_details = details_map.get(partner_key)

            if partner_details:
                conversations.append(ConversationPartner(
                    id=partner_details.id,
                    name=partner_details.username,
                    full_name=partner_details.full_name,
                    type=partner['role'],
                    last_message_id=msg["_id"],
                    last_message=last_message_text,
                    last_message_is_deleted=msg.get("is_deleted", False),
                    timestamp=msg['timestamp'],
                    is_member_active=True # Always true for private chats
                ))
        elif msg['type'] == 'group':
            group = msg['group']
            membership = memberships_map.get(group['id'])
            
            conversations.append(ConversationPartner(
                id=group['id'],
                name=group['name'],
                full_name=None,
                type='group',
                last_message_id=msg["_id"],
                last_message=last_message_text,
                last_message_is_deleted=msg.get("is_deleted", False),
                timestamp=msg['timestamp'],
                is_member_active=membership.is_member_active if membership else False
            ))
    
    pinned_list = []
    unpinned_list = []

    for conv in conversations:
        # Create a unique key for the conversation to check against the pinned_set
        conv_key = f"{conv.type}-{conv.id}"
        # print(conv_key)

        if conv_key in pinned_set:
            conv.is_pinned = True
            pinned_list.append(conv)
        else:
            conv.is_pinned = False
            unpinned_list.append(conv)
    
    final_conversations = pinned_list + unpinned_list

    return {"conversations": final_conversations}



@router.patch("/me/password", status_code=status.HTTP_204_NO_CONTENT)
def update_password(
    password_data: PasswordUpdate,
    current_entity: Union[User, Admin, SuperAdmin] = Depends(get_current_user_from_cookie),
    db: Session = Depends(get_db),
):
    """
    Allows the currently authenticated user or admin to change their own password.
    """
    # 1. Verify the old password
    if not Hasher.verify_password(password_data.old_password, current_entity.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password.",
        )

    # 2. Hash the new password
    new_password_hash = Hasher.get_password_hash(password_data.new_password)

    # 3. Update the password in the database
    current_entity.password_hash = new_password_hash
    db.commit()

    return None

@router.patch("/me/full-name", status_code=status.HTTP_204_NO_CONTENT)
def update_full_name(
    name_data: FullNameUpdate,
    current_entity: Union[User, Admin] = Depends(get_current_user_from_cookie),
    db: Session = Depends(get_db),
):
    """
    Allows the currently authenticated user or admin to update their own full name.
    """
    current_entity.full_name = name_data.full_name
    db.commit()
    return None