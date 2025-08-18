import json
from datetime import datetime
import pytz
from typing import Union
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from motor.motor_asyncio import AsyncIOMotorClient

from app.db.session import get_db, get_mongo_db
from app.security.jwt import verify_token
from app.models import User, Admin
from app.websocket.connection_manager import manager
from app.cache.group_members import get_group_members
from app.cache.tenant_members import get_tenant_connection_ids

router = APIRouter()

async def broadcast_presence_update(tenant_id: int, user_id: int, role: str, status: str, db: Session):
    """Broadcasts a user's online/offline status to all users in the same tenant using the cache."""
    # Use the cache to get the list of who to notify
    broadcast_list = get_tenant_connection_ids(tenant_id, db)
    
    payload = json.dumps({
        "event": "presence_update",
        "user": {"id": user_id, "role": role},
        "status": status,
        "timestamp": datetime.now(pytz.timezone('Asia/Kolkata')).isoformat()
    })
    
    await manager.broadcast_to_users(payload, list(broadcast_list))

# --- Background task for database updates on disconnect ---
def update_last_seen(user_id: int, db: Session):
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user.last_seen = datetime.utcnow()
            db.commit()
    finally:
        db.close()

async def mark_messages_as_received(user_id: int, user_role: str, db: AsyncIOMotorClient):
    """Background task to update 'sent' messages to 'received'."""
    messages_collection = db["messages"]
    sent_messages_cursor = messages_collection.find({
        "receiver.id": user_id,
        "receiver.role": user_role,
        "status": "sent"
    })
    sent_messages = await sent_messages_cursor.to_list(length=None)
    if not sent_messages: return

    message_ids_to_update = [msg["_id"] for msg in sent_messages]
    
    await messages_collection.update_many(
        {"_id": {"$in": message_ids_to_update}},
        {"$set": {"status": "received"}}
    )

    for msg in sent_messages:
        sender_connection_id = f"{msg['sender']['role']}-{msg['sender']['id']}"
        status_update_payload = json.dumps({
            "event": "status_update",
            "message_id": str(msg["_id"]),
            "status": "received"
        })
        await manager.send_personal_message(status_update_payload, sender_connection_id)


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    mongo_db: AsyncIOMotorClient = Depends(get_mongo_db)
):
    try:
        # 1. Extract the access_token from the WebSocket's cookies
        token = websocket.cookies.get("access_token")
        if not token:
            await websocket.close(code=1008)
            return

        # 2. Verify the token
        credentials_exception = HTTPException(status_code=403)
        token_data = verify_token(token, credentials_exception)
        
        # 3. Fetch the user/admin from the database
        entity: Union[User, Admin] = None
        if token_data.role == 'user':
            entity = db.query(User).filter(User.username == token_data.username).first()
        elif token_data.role == 'admin':
            entity = db.query(Admin).filter(Admin.username == token_data.username).first()

        if not entity:
            await websocket.close(code=1008)
            return
            
    except Exception:
        # If any part of auth fails, close the connection
        await websocket.close(code=1008)
        return

    connection_id_str = f"{token_data.role}-{entity.id}"
    await manager.connect(connection_id_str, websocket)

    tenant_id = entity.id if isinstance(entity, Admin) else entity.admin_id
    
    online_connection_ids = manager.get_all_connection_ids()
    all_tenant_members = get_tenant_connection_ids(tenant_id, db)

    # 1. Identify which users in the tenant are offline
    offline_user_ids = []
    for member_cid in all_tenant_members:
        if member_cid.startswith('user-') and member_cid not in online_connection_ids:
            offline_user_ids.append(int(member_cid.split('-')[1]))
    
    # 2. Query the database for their last_seen timestamps in one go
    offline_users_info = {
        user.id: user.last_seen 
        for user in db.query(User.id, User.last_seen).filter(User.id.in_(offline_user_ids)).all()
    }

    # 3. Build the initial state map with the correct data
    initial_state = {}
    for member_cid in all_tenant_members:
        role, member_id_str = member_cid.split('-')
        member_id = int(member_id_str)
        
        if member_id == entity.id and role == token_data.role:
            continue

        if member_cid in online_connection_ids:
            status = "online"
            last_seen = None
        else:
            status = "offline"
            # Use the fetched timestamp if available
            last_seen = offline_users_info.get(member_id)
        
        # Ensure timestamp is in ISO format if it exists
        last_seen_iso = last_seen.isoformat() + "Z" if last_seen else None
        initial_state[member_cid] = {"status": status, "lastSeen": last_seen_iso}

    await manager.send_personal_message(json.dumps({
        "event": "initial_presence_state",
        "users": initial_state
    }), connection_id_str)

    # Announce the new user's arrival to everyone else
    await broadcast_presence_update(tenant_id, entity.id, token_data.role, "online", db)
    
    background_tasks.add_task(mark_messages_as_received, entity.id, token_data.role, mongo_db)
    
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            event_type = message_data.get("event", "new_message")
            messages_collection = mongo_db["messages"]

            if event_type == "messages_read":
                partner = message_data.get("partner")
                if not partner: continue
                
                messages_to_update = await messages_collection.find({
                    "receiver.id": entity.id, "receiver.role": token_data.role,
                    "sender.id": partner["id"], "sender.role": partner["role"],
                    "status": {"$in": ["sent", "received"]}
                }).to_list(length=None)

                if not messages_to_update: continue
                
                msg_ids = [msg["_id"] for msg in messages_to_update]
                await messages_collection.update_many(
                    {"_id": {"$in": msg_ids}},
                    {"$set": {"status": "read"}}
                )
                
                partner_connection_id = f"{partner['role']}-{partner['id']}"
                await manager.send_personal_message(json.dumps({
                    "event": "status_update",
                    "message_ids": [str(mid) for mid in msg_ids],
                    "status": "read"
                }), partner_connection_id)
                continue

            if event_type == "new_message":
                raw_content = message_data.get("content")
                if isinstance(raw_content, dict):
                    content_obj = raw_content
                else:
                    continue
                mongo_message = {
                    "type": message_data.get("type"),
                    "sender": {"id": entity.id, "role": token_data.role, "username": entity.username},
                    "content": content_obj,
                    "timestamp": datetime.now(pytz.utc),
                    "status": "sent",
                    "is_deleted": False
                }

                if mongo_message["type"] == "private":
                    receiver_info = message_data.get("receiver")
                    if not receiver_info: continue
                    
                    mongo_message["receiver"] = {
                        "id": receiver_info['id'],
                        "role": receiver_info['role'],
                        "username": receiver_info['username']
                    }
                    
                    result = await messages_collection.insert_one(mongo_message)
                    mongo_message["_id"] = str(result.inserted_id)
                    
                    receiver_connection_id = f"{receiver_info['role']}-{receiver_info['id']}"
                    await manager.broadcast_to_users(json.dumps(mongo_message, default=str), [receiver_connection_id])

                elif mongo_message["type"] == "group":
                    group_info = message_data.get("group")
                    if not group_info: continue
                    
                    mongo_message["group"] = {
                        "id": group_info["id"],
                        "name": group_info["name"]
                    }

                    result = await messages_collection.insert_one(mongo_message)
                    mongo_message["_id"] = str(result.inserted_id)

                    member_ids = get_group_members(group_info["id"], db=db)
                    connections = set(member_ids)
                    connections.discard(connection_id_str)
                    await manager.broadcast_to_users(json.dumps(mongo_message, default=str), list(connections))

    except WebSocketDisconnect:
        manager.disconnect(connection_id_str)
        await broadcast_presence_update(tenant_id, entity.id, token_data.role, "offline", db)
        if isinstance(entity, User):
            # Create a new session for the background task
            db_session_for_task = next(get_db())
            background_tasks.add_task(update_last_seen, entity.id, db_session_for_task)
    except Exception as e:
        print(f"Error in WebSocket: {e}")
        manager.disconnect(connection_id_str)
        await broadcast_presence_update(tenant_id, entity.id, token_data.role, "offline", db)
        if isinstance(entity, User):
            db_session_for_task = next(get_db())
            background_tasks.add_task(update_last_seen, entity.id, db_session_for_task)

