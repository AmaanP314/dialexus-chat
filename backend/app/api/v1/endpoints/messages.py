# app/api/v1/endpoints/messages.py
from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Union, Optional, Dict, Any
import datetime

from app.db.session import get_db, get_mongo_db
from app.security.dependencies import get_current_user_from_cookie
from app.models import User, Admin, Group, GroupMember
from app.schemas.message import PaginatedMessageResponse

router = APIRouter()

def calculate_status_for_user(message: Dict[str, Any], current_user_identity: Dict[str, Any]) -> str:
    """
    Calculates the 'status' string based on the new 'read_by' array of objects.
    """
    read_by_list = message.get("read_by", [])
    if message.get("sender") == current_user_identity:
        if message["type"] == "private":
            receiver_identity = message.get("receiver").get("id")
            receiver_role = message.get("receiver").get("role")
            receiver_identity = {"id": receiver_identity, "role": receiver_role}
            if receiver_identity in read_by_list:
                return "read"
        return "sent"
    else:
        if current_user_identity in read_by_list:
            return "read"
        else:
            return "sent"

@router.get("/{conversation_type}/{partner_id}", response_model=PaginatedMessageResponse)
async def get_message_history(
    conversation_type: str = Path(..., description="Type of conversation: 'private' or 'group'"),
    partner_id: int = Path(..., description="ID of the user, admin, or group"),
    partner_role: Optional[str] = Query(None, description="Role of the partner if private: 'user' or 'admin'"),
    before: Optional[str] = Query(None, description="ISO timestamp cursor for pagination"),
    limit: int = Query(50, gt=0, le=100),
    current_entity: Union[User, Admin] = Depends(get_current_user_from_cookie),
    db: Session = Depends(get_db),
    mongo_db: AsyncIOMotorClient = Depends(get_mongo_db)
):
    messages_collection = mongo_db["messages"]
    
    entity_id = current_entity.id
    entity_role = "admin" if isinstance(current_entity, Admin) else "user"
    
    query = {"type": conversation_type}

    if conversation_type == "private":
        if not partner_role:
            raise HTTPException(status_code=400, detail="Partner role is required for private chats.")
        
        # --- FIX IS HERE: Use Dot Notation for Precise Matching ---
        # This query checks the fields inside the sub-documents, which is robust.
        query["$or"] = [
            {
                "sender.id": entity_id, "sender.role": entity_role,
                "receiver.id": partner_id, "receiver.role": partner_role
            },
            {
                "sender.id": partner_id, "sender.role": partner_role,
                "receiver.id": entity_id, "receiver.role": entity_role
            }
        ]
    elif conversation_type == "group":
        # ... (group logic is unchanged and correct)
        group = db.query(Group).filter(Group.id == partner_id).first()
        if not group: raise HTTPException(status_code=404, detail="Group not found.")
        is_member = False
        if isinstance(current_entity, Admin) and current_entity.id == group.admin_id:
            is_member = True
        elif isinstance(current_entity, User):
            membership = db.query(GroupMember).filter(GroupMember.group_id == partner_id, GroupMember.user_id == entity_id).first()
            if membership: is_member = True
        if not is_member:
            raise HTTPException(status_code=403, detail="You are not a member of this group.")
        query["group.id"] = partner_id
    else:
        raise HTTPException(status_code=400, detail="Invalid conversation type.")

    if before:
        try:
            cursor_time = datetime.datetime.fromisoformat(before.replace("Z", "+00:00"))
            query["timestamp"] = {"$lt": cursor_time}
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid 'before' timestamp format.")

    messages_cursor = messages_collection.find(query).sort("timestamp", -1).limit(limit)
    messages_from_db = await messages_cursor.to_list(length=limit)
    
    current_user_identity = {"id": entity_id, "role": entity_role}
    processed_messages = []
    for msg in messages_from_db:
        status = calculate_status_for_user(msg, current_user_identity)
        msg_with_status = {**msg, "status": status}
        processed_messages.append(msg_with_status)

    next_cursor = None
    if len(messages_from_db) == limit:
        oldest_message = messages_from_db[-1]
        next_cursor = oldest_message["timestamp"].isoformat() + "Z"
        
    return PaginatedMessageResponse(
        messages=processed_messages, 
        next_cursor=next_cursor
    )

