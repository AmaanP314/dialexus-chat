from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Union, Optional
import datetime

from app.db.session import get_db, get_mongo_db
from app.security.dependencies import get_current_user_from_cookie
from app.models import User, Admin, Group, GroupMember
# from app.schemas.message import MessageHistory
from app.schemas.message import MessageOut, PaginatedMessageResponse

router = APIRouter()

def calculate_status_for_user(message: dict, user_id: int) -> str:
    """
    Calculates the 'status' string based on the read_by array.
    """
    sender_id = message.get("sender", {}).get("id")
    read_by = message.get("read_by", [])
    
    # If the current user sent the message
    if sender_id == user_id:
        # Check if any *other* participant has read it
        if message["type"] == "private":
            receiver_id = message.get("receiver", {}).get("id")
            if receiver_id in read_by:
                return "read"
        # For groups, we simplify and don't show read receipts for senders
        return "sent"
    
    # If the current user received the message
    else:
        if user_id in read_by:
            return "read"
        else:
            return "sent" # From the receiver's perspective, "sent" means unread

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
    """
    Fetch the message history for a specific conversation with pagination.
    """
    messages_collection = mongo_db["messages"]
    
    entity_id = current_entity.id
    entity_role = "admin" if isinstance(current_entity, Admin) else "user"
    
    query = {"type": conversation_type}

    # --- Authorization and Query Building ---
    if conversation_type == "private":
        if not partner_role:
            raise HTTPException(status_code=400, detail="Partner role is required for private chats.")
        
        # Build a query that finds messages between the two parties, regardless of who is sender/receiver
        query["$or"] = [
            {"sender.id": entity_id, "sender.role": entity_role, "receiver.id": partner_id, "receiver.role": partner_role},
            {"sender.id": partner_id, "sender.role": partner_role, "receiver.id": entity_id, "receiver.role": entity_role}
        ]
    elif conversation_type == "group":
        # Verify the current entity is a member of the group
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

    # --- Pagination ---
    if before:
        try:
            # Using timestamp for cursor-based pagination
            cursor_time = datetime.datetime.fromisoformat(before.replace("Z", "+00:00"))
            query["timestamp"] = {"$lt": cursor_time}
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid 'before' timestamp format.")

    # --- Fetching Messages ---
    messages_cursor = messages_collection.find(query).sort("timestamp", -1).limit(limit)
    # messages = await messages_cursor.to_list(length=limit)

    # # Convert MongoDB's _id to a string for Pydantic
    # for msg in messages:
    #     msg["_id"] = str(msg["_id"])

    # # --- Determine the next cursor ---
    # next_cursor = None
    # if len(messages) == limit:
    #     # The timestamp of the last message fetched is the cursor for the next page
    #     next_cursor = messages[-1]['timestamp'].isoformat() + "Z"

    # return {"messages": messages, "next_cursor": next_cursor}
    messages_from_db = await messages_cursor.to_list(length=limit)
    
    # --- FIX IS HERE: Process messages to add the computed 'status' ---
    processed_messages = []
    for msg in messages_from_db:
        # Calculate status from the perspective of the current user
        status = calculate_status_for_user(msg, current_entity.id)
        
        # Create a new dict with the status field before validation
        msg_with_status = {**msg, "status": status}
        processed_messages.append(msg_with_status)

    # Determine the next cursor
    next_cursor = None
    if len(messages_from_db) == limit:
        oldest_message = messages_from_db[-1]
        next_cursor = oldest_message["timestamp"].isoformat() + "Z"
        
    return PaginatedMessageResponse(
        messages=processed_messages, 
        next_cursor=next_cursor
    )
