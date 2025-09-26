# # app/schemas/message.py
# from pydantic import BaseModel, Field
# from typing import Optional
# import datetime

# # --- Nested objects for the main Message schema ---
# class MessageSender(BaseModel):
#     id: int
#     username: str
#     role: str

# class MessageReceiver(BaseModel):
#     id: int
#     username: str
#     role: str

# class MessageGroup(BaseModel):
#     id: int
#     name: str

# class MessageContent(BaseModel):
#     text: Optional[str] = None
#     image: Optional[str] = None
#     file: Optional[str] = None

# # --- Main Message Schema for API output ---
# class MessageOut(BaseModel):
#     id: str = Field(..., alias="_id") # Use MongoDB's _id
#     type: str
#     sender: MessageSender
#     receiver: Optional[MessageReceiver] = None
#     group: Optional[MessageGroup] = None
#     content: MessageContent
#     timestamp: datetime.datetime
#     status: str

#     class Config:
#         orm_mode = True
#         allow_population_by_field_name = True
#         json_encoders = {
#             datetime.datetime: lambda dt: dt.isoformat(),
#         }

# # --- Schema for the new message history endpoint response ---
# class MessageHistory(BaseModel):
#     messages: list[MessageOut]
#     next_cursor: Optional[str] = None

# app/schemas/message.py
# from pydantic import BaseModel, Field
# from typing import Optional, List, Any
# import datetime

# # Internal models for sender/receiver/group
# class MessageParticipant(BaseModel):
#     id: int
#     username: str
#     role: str

# class MessageGroup(BaseModel):
#     id: int
#     name: str

# class MessageContent(BaseModel):
#     text: Optional[str] = None
#     image: Optional[str] = None
#     file: Optional[str] = None

# # The main response model for a single message
# class MessageOut(BaseModel):
#     id: str = Field(..., alias="_id") # MongoDB's _id
#     type: str
#     sender: MessageParticipant
#     receiver: Optional[MessageParticipant] = None
#     group: Optional[MessageGroup] = None
#     content: MessageContent
#     timestamp: datetime.datetime
#     is_deleted: bool = False
    
#     # Add the status field back for frontend compatibility
#     status: str 

#     class Config:
#         populate_by_name = True
#         json_encoders = {
#             datetime.datetime: lambda dt: dt.isoformat(),
#             # Add ObjectId encoder if you ever expose it directly
#         }

# # Model for the paginated response
# class PaginatedMessageResponse(BaseModel):
#     messages: List[MessageOut]
#     next_cursor: Optional[str] = None

from pydantic import BaseModel, Field, BeforeValidator
from typing import Optional, List, Annotated
import datetime
from bson import ObjectId

# Correct way to define the PyObjectId type alias using Annotated
# This tells Pydantic to treat this field as a string, but first
# run it through the BeforeValidator, which converts the ObjectId.
PyObjectId = Annotated[str, BeforeValidator(str)]

# Internal models for sender/receiver/group
class MessageParticipant(BaseModel):
    id: int
    username: str
    role: str

class MessageGroup(BaseModel):
    id: int
    name: str

class MessageContent(BaseModel):
    text: Optional[str] = None
    image: Optional[str] = None
    file: Optional[str] = None

# The main response model for a single message
class MessageOut(BaseModel):
    # Use the corrected PyObjectId alias here
    id: PyObjectId = Field(..., alias="_id")
    type: str
    sender: MessageParticipant
    receiver: Optional[MessageParticipant] = None
    group: Optional[MessageGroup] = None
    content: MessageContent
    timestamp: datetime.datetime
    is_deleted: bool = False
    read_by: Optional[List[int]] = None
    status: str 

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime.datetime: lambda dt: dt.isoformat(),
            ObjectId: str  # This encoder is still useful for direct ObjectId serialization
        }

# Model for the paginated response
class PaginatedMessageResponse(BaseModel):
    messages: List[MessageOut]
    next_cursor: Optional[str] = None