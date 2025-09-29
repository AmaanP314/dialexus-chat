import json
from datetime import datetime
from bson import ObjectId
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

from app.db.session import get_db, get_mongo_db, SessionLocal

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

def update_last_seen(entity_id: int, entity_role: str):
    """
    Synchronously updates the last_seen timestamp for a user or admin.
    This function creates its own DB session to ensure atomicity.
    """
    db = SessionLocal()
    try:
        if entity_role == "user":
            db_entity = db.query(User).filter(User.id == entity_id).first()
        elif entity_role == "admin":
            db_entity = db.query(Admin).filter(Admin.id == entity_id).first()
        else:
            return

        if db_entity:
            db_entity.last_seen = datetime.utcnow()
            db.commit()
            print(f"SYNC: Successfully updated last_seen for {entity_role} {entity_id}")
        else:
            print(f"No {entity_role} found with ID {entity_id}")
    except Exception as e:
        print(f"Error in update_last_seen_sync: {e}")
        db.rollback()
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
                group_id = message_data.get("group_id")

                if not (partner or group_id):
                    continue

                query_filter = { "read_by": { "$ne": entity.id } }
                if partner:
                    query_filter.update({
                        "type": "private",
                        "sender.id": partner["id"],
                        "sender.role": partner["role"],
                        "receiver.id": entity.id,
                        "receiver.role": token_data.role
                    })
                elif group_id:
                    query_filter.update({
                        "type": "group",
                        "group.id": group_id
                    })

                await messages_collection.update_many(
                    query_filter,
                    { "$addToSet": { "read_by": entity.id } }
                )
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
                    "timestamp": datetime.now(pytz.timezone('Asia/Kolkata')),
                    "read_by": [entity.id], 
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

            if event_type == "delete_message":
                message_id = message_data.get("message_id")
                if not message_id:
                    continue

                try:
                    obj_id = ObjectId(message_id)
                except Exception:
                    print(f"Invalid message ID format: {message_id}")
                    continue

                # Security check: only the sender can delete
                message_to_delete = await messages_collection.find_one({"_id": obj_id})
                if not message_to_delete or message_to_delete["sender"]["id"] != entity.id:
                    print(f"Security violation: User {entity.id} tried to delete message {message_id}")
                    continue

                # Perform the soft delete
                await messages_collection.update_one(
                    {"_id": obj_id},
                    {"$set": {"is_deleted": True}}
                )

                # Notify participants
                participants = []
                if message_to_delete["type"] == "private":
                    participants = [
                        f"{message_to_delete['sender']['role']}-{message_to_delete['sender']['id']}",
                        f"{message_to_delete['receiver']['role']}-{message_to_delete['receiver']['id']}",
                    ]
                elif message_to_delete["type"] == "group":
                    group_id = message_to_delete["group"]["id"]
                    participants = list(get_group_members(group_id, db=db))

                delete_notification = json.dumps({
                    "event": "message_deleted",
                    "message_id": message_id
                })
                await manager.broadcast_to_users(delete_notification, participants)

                print(f"Message {message_id} successfully marked as deleted.")
                continue
            
    except WebSocketDisconnect:
        manager.disconnect(connection_id_str)
        await broadcast_presence_update(tenant_id, entity.id, token_data.role, "offline", db)
        update_last_seen(entity.id, token_data.role)
    except Exception as e:
        print(f"Error in WebSocket: {e}")
        manager.disconnect(connection_id_str)
        await broadcast_presence_update(tenant_id, entity.id, token_data.role, "offline", db)
        update_last_seen(entity.id, token_data.role)
