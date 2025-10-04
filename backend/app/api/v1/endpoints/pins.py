# app/api/v1/endpoints/pins.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Union

from app.db.session import get_db
from app.models import User, Admin, PinnedConversation
from app.schemas.pin import PinCreate
from app.security.dependencies import get_current_user_from_cookie

router = APIRouter()

@router.post("/conversations/pin", status_code=status.HTTP_204_NO_CONTENT)
def pin_conversation(
    pin_data: PinCreate,
    current_entity: Union[User, Admin] = Depends(get_current_user_from_cookie),
    db: Session = Depends(get_db)
):
    """
    Pins a conversation for the current user.
    """
    pinner_id = current_entity.id
    pinner_role = "admin" if isinstance(current_entity, Admin) else "user"

    # Check if this pin already exists
    existing_pin = db.query(PinnedConversation).filter_by(
        pinner_id=pinner_id,
        pinner_role=pinner_role,
        conversation_type=pin_data.conversation_type,
        conversation_id=pin_data.conversation_id,
        conversation_role=pin_data.conversation_role
    ).first()

    if existing_pin:
        # The conversation is already pinned, so do nothing.
        return

    new_pin = PinnedConversation(
        pinner_id=pinner_id,
        pinner_role=pinner_role,
        conversation_type=pin_data.conversation_type,
        conversation_id=pin_data.conversation_id,
        conversation_role=pin_data.conversation_role
    )
    db.add(new_pin)
    db.commit()

@router.delete("/conversations/unpin", status_code=status.HTTP_204_NO_CONTENT)
def unpin_conversation(
    pin_data: PinCreate, # Using the same schema for identification
    current_entity: Union[User, Admin] = Depends(get_current_user_from_cookie),
    db: Session = Depends(get_db)
):
    """
    Unpins a conversation for the current user.
    """
    pinner_id = current_entity.id
    pinner_role = "admin" if isinstance(current_entity, Admin) else "user"

    pin_to_delete = db.query(PinnedConversation).filter_by(
        pinner_id=pinner_id,
        pinner_role=pinner_role,
        conversation_type=pin_data.conversation_type,
        conversation_id=pin_data.conversation_id,
        conversation_role=pin_data.conversation_role
    ).first()

    if not pin_to_delete:
        # The pin doesn't exist, so do nothing.
        return

    db.delete(pin_to_delete)
    db.commit()
