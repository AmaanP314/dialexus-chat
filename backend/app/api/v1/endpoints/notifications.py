# # app/api/v1/endpoints/notifications.py
# from fastapi import APIRouter, Depends
# from sqlalchemy.orm import Session
# from motor.motor_asyncio import AsyncIOMotorClient
# from typing import Union

# from app.db.session import get_db, get_mongo_db
# from app.security.dependencies import get_current_user_from_cookie
# from app.models import User, Admin, SuperAdmin, GroupMember, Group
# from app.schemas.notification import NotificationSummary

# router = APIRouter()

# @router.get("/summary", response_model=NotificationSummary)
# async def get_notification_summary(
#     current_entity: Union[User, Admin, SuperAdmin] = Depends(get_current_user_from_cookie),
#     db: Session = Depends(get_db),
#     mongo_db: AsyncIOMotorClient = Depends(get_mongo_db)
# ):
#     messages_collection = mongo_db["messages"]
    
#     entity_id = current_entity.id
#     entity_role = "super_admin" if isinstance(current_entity, SuperAdmin) else \
#                   "admin" if isinstance(current_entity, Admin) else "user"

#     # Define the reader's identity for querying the 'read_by' array
#     reader_identity = {"id": entity_id, "role": entity_role}

#     # 1. Get user's group memberships from PostgreSQL
#     user_group_ids = []
#     if isinstance(current_entity, User):
#         memberships = db.query(GroupMember.group_id).filter(GroupMember.user_id == entity_id).all()
#         user_group_ids = [m.group_id for m in memberships]
#     elif isinstance(current_entity, Admin):
#         admin_groups = db.query(Group.id).filter(Group.admin_id == entity_id).all()
#         user_group_ids = [g.id for g in admin_groups]

#     # 2. Build the MongoDB Aggregation Pipeline
#     pipeline = [
#         {
#             "$match": {
#                 # Condition 1: The user must be a recipient (private or group)
#                 "$or": [
#                     {"receiver.id": entity_id, "receiver.role": entity_role},
#                     {"group.id": {"$in": user_group_ids}}
#                 ],
#                 # Condition 2: The user must NOT have read the message yet.
#                 # This uses the new schema to check for the identity object.
#                 "read_by": {"$not": {"$elemMatch": reader_identity}}
#             }
#         },
#         {"$sort": {"timestamp": -1}},
#         {
#             "$group": {
#                 "_id": {
#                     "$cond": {
#                         "if": {"$eq": ["$type", "private"]},
#                         # For private chats, the conversation is defined by the other person
#                         "then": {
#                            "$cond": { "if": { "$eq": ["$sender.id", entity_id] }, "then": "$receiver", "else": "$sender" }
#                         },
#                         "else": "$group"
#                     }
#                 },
#                 "last_message_doc": {"$first": "$$ROOT"},
#                 "unread_count": {"$sum": 1}
#             }
#         },
#         {"$sort": {"last_message_doc.timestamp": -1}},
#         {
#             "$project": {
#                 # ... (projection logic remains the same as before) ...
#                  "conversation_details": {
#                     "id": "$_id.id",
#                     "name": {"$ifNull": ["$_id.username", "$_id.name"]},
#                     "type": {"$ifNull": ["$_id.role", "group"]}
#                 },
#                 "last_message": {
#                     "preview": {
#                         "$cond": {
#                             "if": {"$or": [
#                                 {"$gt": [{"$strLenCP": {"$ifNull": ["$last_message_doc.content.image", ""]}}, 0]},
#                                 {"$gt": [{"$strLenCP": {"$ifNull": ["$last_message_doc.content.file", ""]}}, 0]}
#                             ]},
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
    
#     notifications_cursor = messages_collection.aggregate(pipeline)
#     notifications_list = await notifications_cursor.to_list(length=None)

#     # 3. Enrich with full_name from PostgreSQL for better UI
#     user_ids_to_fetch = set()
#     admin_ids_to_fetch = set()
#     for notif in notifications_list:
#         details = notif["conversation_details"]
#         if details["type"] == "user":
#             user_ids_to_fetch.add(details["id"])
#         elif details["type"] == "admin":
#             admin_ids_to_fetch.add(details["id"])

#     users_data = db.query(User.id, User.full_name).filter(User.id.in_(user_ids_to_fetch)).all()
#     admins_data = db.query(Admin.id, Admin.full_name).filter(Admin.id.in_(admin_ids_to_fetch)).all()
    
#     details_map = {f"user-{u.id}": u.full_name for u in users_data}
#     details_map.update({f"admin-{a.id}": a.full_name for a in admins_data})

#     for notif in notifications_list:
#         details = notif["conversation_details"]
#         key = f"{details['type']}-{details['id']}"
#         notif["conversation_details"]["full_name"] = details_map.get(key)

#     return {"notifications": notifications_list}

# app/api/v1/endpoints/notifications.py
from fastapi import APIRouter, Depends
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
    entity_role = "super_admin" if isinstance(current_entity, SuperAdmin) else \
                  "admin" if isinstance(current_entity, Admin) else "user"

    reader_identity = {"id": entity_id, "role": entity_role}

    # --- FIX IS HERE: Only include ACTIVE group memberships ---
    active_user_group_ids = []
    if isinstance(current_entity, User):
        # Fetch only active memberships from the database.
        active_memberships = db.query(GroupMember.group_id).filter(
            GroupMember.user_id == entity_id,
            GroupMember.is_member_active == True
        ).all()
        active_user_group_ids = [m.group_id for m in active_memberships]
    elif isinstance(current_entity, Admin):
        # Admins are considered active members of all groups in their tenant.
        admin_groups = db.query(Group.id).filter(Group.admin_id == entity_id).all()
        active_user_group_ids = [g.id for g in admin_groups]
    # --- END OF FIX ---

    # 2. Build the MongoDB Aggregation Pipeline
    pipeline = [
        {
            "$match": {
                "$or": [
                    # Unread private messages for the user
                    {"receiver.id": entity_id, "receiver.role": entity_role},
                    # Unread messages ONLY from groups where the user is an active member
                    {"group.id": {"$in": active_user_group_ids}}
                ],
                # The user must NOT have read the message yet.
                "read_by": {"$not": {"$elemMatch": reader_identity}}
            }
        },
        # ... (The rest of the pipeline: $sort, $group, $project remains the same) ...
        {"$sort": {"timestamp": -1}},
        {
            "$group": {
                "_id": {
                    "$cond": {
                        "if": {"$eq": ["$type", "private"]},
                        "then": {
                           "$cond": { "if": { "$eq": ["$sender.id", entity_id] }, "then": "$receiver", "else": "$sender" }
                        },
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
                    "name": {"$ifNull": ["$_id.username", "$_id.name"]},
                    "type": {"$ifNull": ["$_id.role", "group"]}
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

    # ... (The logic to enrich with full_name is unchanged and correct) ...
    user_ids_to_fetch = set()
    admin_ids_to_fetch = set()
    for notif in notifications_list:
        details = notif["conversation_details"]
        if details["type"] == "user":
            user_ids_to_fetch.add(details["id"])
        elif details["type"] == "admin":
            admin_ids_to_fetch.add(details["id"])

    users_data = db.query(User.id, User.full_name).filter(User.id.in_(user_ids_to_fetch)).all()
    admins_data = db.query(Admin.id, Admin.full_name).filter(Admin.id.in_(admin_ids_to_fetch)).all()
    
    details_map = {f"user-{u.id}": u.full_name for u in users_data}
    details_map.update({f"admin-{a.id}": a.full_name for a in admins_data})

    for notif in notifications_list:
        details = notif["conversation_details"]
        key = f"{details['type']}-{details['id']}"
        notif["conversation_details"]["full_name"] = details_map.get(key)

    return {"notifications": notifications_list}

