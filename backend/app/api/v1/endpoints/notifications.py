# # app/api/v1/endpoints/notifications.py
# from fastapi import APIRouter, Depends
# from sqlalchemy.orm import Session
# from motor.motor_asyncio import AsyncIOMotorClient
# from typing import Union

# from app.db.session import get_db, get_mongo_db
# from app.security.dependencies import get_current_user_from_cookie
# from app.models import User, Admin, SuperAdmin, GroupMember
# from app.schemas.notification import NotificationSummary

# router = APIRouter()

# @router.get("/summary", response_model=NotificationSummary)
# async def get_notification_summary(
#     current_entity: Union[User, Admin, SuperAdmin] = Depends(get_current_user_from_cookie),
#     db: Session = Depends(get_db),
#     mongo_db: AsyncIOMotorClient = Depends(get_mongo_db)
# ):
#     """
#     Get a summary of all unread messages, grouped by conversation,
#     with details like last message, timestamp, and unread count.
#     """
#     messages_collection = mongo_db["messages"]
#     entity_id = current_entity.id
#     entity_role = "admin" if isinstance(current_entity, Admin) else "super_admin" if isinstance(current_entity, SuperAdmin) else "user"

#     # 1. Get user's group memberships from PostgreSQL
#     user_group_ids = []
#     if isinstance(current_entity, User):
#         memberships = db.query(GroupMember.group_id).filter(GroupMember.user_id == entity_id).all()
#         user_group_ids = [m.group_id for m in memberships]
#     elif isinstance(current_entity, Admin):
#         # Admins are implicitly members of all their groups
#         groups = db.query(GroupMember.group_id).filter(GroupMember.admin_id == entity_id).distinct().all()
#         user_group_ids = [g.group_id for g in groups]

#     # 2. Build the MongoDB Aggregation Pipeline
#     pipeline = [
#         # Match messages where the user is a recipient and has not read it
#         {
#             "$match": {
#                 "$and": [
#                     {
#                         "$or": [
#                             {"receiver.id": entity_id, "receiver.role": entity_role},
#                             {"group.id": {"$in": user_group_ids}}
#                         ]
#                     },
#                     {"read_by": {"$ne": entity_id}}
#                 ]
#             }
#         },
#         # Sort by timestamp to easily find the latest message
#         {"$sort": {"timestamp": -1}},
#         # Group by conversation
#         {
#             "$group": {
#                 "_id": {
#                     "$cond": {
#                         "if": {"$eq": ["$type", "private"]},
#                         "then": "$sender", # Group by the sender if they are not the current user
#                         "else": "$group"
#                     }
#                 },
#                 "last_message_doc": {"$first": "$$ROOT"},
#                 "unread_count": {"$sum": 1}
#             }
#         },
#         # Sort the conversations by the most recent message
#         {"$sort": {"last_message_doc.timestamp": -1}},
#         # Project the final shape
#         {
#             "$project": {
#                 "_id": 0,
#                 "conversation_details": {
#                     "id": "$_id.id",
#                     "name": "$_id.username",
#                     "type": {
#                         "$ifNull": ["$_id.role", "group"]
#                     }
#                 },
#                 "last_message": {
#                     "preview": {
#                         "$cond": {
#                             "if": {"$or": ["$last_message_doc.content.image", "$last_message_doc.content.file"]},
#                             "then": "[Attachment]",
#                             "else": "$last_message_doc.content.text"
#                         }
#                     },
#                     "timestamp": "$last_message_doc.timestamp"
#                 },
#                 "unread_count": "$unread_count"
#             }
#         }
#     ]
    
#     # Execute the pipeline
#     notifications_cursor = messages_collection.aggregate(pipeline)
#     notifications_list = await notifications_cursor.to_list(length=None)

#     return {"notifications": notifications_list}

# app/api/v1/endpoints/notifications.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Union

from app.db.session import get_db, get_mongo_db
from app.security.dependencies import get_current_user_from_cookie
from app.models import User, Admin, SuperAdmin, GroupMember, Group
from app.schemas.notification import NotificationSummary

router = APIRouter()

@router.get("/summary", response_model=NotificationSummary)
async def get_notification_summary(
    current_entity: Union[User, Admin, SuperAdmin] = Depends(get_current_user_from_cookie),
    db: Session = Depends(get_db),
    mongo_db: AsyncIOMotorClient = Depends(get_mongo_db)
):
    messages_collection = mongo_db["messages"]
    entity_id = current_entity.id

    # 1. Get user's group memberships from PostgreSQL
    user_group_ids = []
    if isinstance(current_entity, User):
        memberships = db.query(GroupMember.group_id).filter(GroupMember.user_id == entity_id).all()
        user_group_ids = [m.group_id for m in memberships]
    elif isinstance(current_entity, Admin):
        # FIX 1: Correctly join Group and GroupMember to find groups owned by the admin
        admin_groups = db.query(Group.id).filter(Group.admin_id == entity_id).all()
        user_group_ids = [g.id for g in admin_groups]

    # 2. Build the MongoDB Aggregation Pipeline
    pipeline = [
        # Match messages where the user is a recipient and has not read it
        {
            "$match": {
                "$and": [
                    {
                        "$or": [
                            {"receiver.id": entity_id},
                            {"group.id": {"$in": user_group_ids}}
                        ]
                    },
                    # This now works for both old and new schemas
                    {"read_by": {"$ne": entity_id}},
                    # Ensure the sender is not the current user
                    {"sender.id": {"$ne": entity_id}}
                ]
            }
        },
        {"$sort": {"timestamp": -1}},
        {
            "$group": {
                "_id": {
                    "$cond": {
                        "if": {"$eq": ["$type", "private"]},
                        "then": "$sender",
                        "else": "$group"
                    }
                },
                "last_message_doc": {"$first": "$$ROOT"},
                "unread_count": {"$sum": 1}
            }
        },
        {"$sort": {"last_message_doc.timestamp": -1}},
        {
            "$project": {
                "_id": 0,
                "conversation_details": {
                    "id": "$_id.id",
                    # FIX 2: Conditionally get name from 'username' or 'name' field
                    "name": {
                        "$ifNull": ["$_id.username", "$_id.name"]
                    },
                    "type": {
                        "$ifNull": ["$_id.role", "group"]
                    }
                },
                "last_message": {
                    "preview": {
                        "$cond": {
                            "if": {"$or": [
                                {"$gt": [{"$strLenCP": {"$ifNull": ["$last_message_doc.content.image", ""]}}, 0]},
                                {"$gt": [{"$strLenCP": {"$ifNull": ["$last_message_doc.content.file", ""]}}, 0]}
                            ]},
                            "then": "[Attachment]",
                            "else": "$last_message_doc.content.text"
                        }
                    },
                    "timestamp": "$last_message_doc.timestamp"
                },
                "unread_count": "$unread_count"
            }
        }
    ]
    
    notifications_cursor = messages_collection.aggregate(pipeline)
    notifications_list = await notifications_cursor.to_list(length=None)

    return {"notifications": notifications_list}
