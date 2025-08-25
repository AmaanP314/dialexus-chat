# app/api/v1/endpoints/super_admin.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.security.dependencies import get_current_super_admin
from app.security.hashing import Hasher
from app.models import Admin, User, Group, SuperAdmin
from app.schemas.super_admin import SuperAdminCreate, AdminOut

router = APIRouter()

@router.post("/admins", response_model=AdminOut, status_code=status.HTTP_201_CREATED)
def create_admin(
    admin_in: SuperAdminCreate,
    db: Session = Depends(get_db),
    current_super_admin: SuperAdmin = Depends(get_current_super_admin)
):
    """
    Create a new Admin tenant. (Super Admin only)
    """
    # Check for uniqueness
    if db.query(Admin).filter(Admin.username == admin_in.username).first():
        raise HTTPException(status_code=400, detail="Admin username already exists.")
    if db.query(Admin).filter(Admin.admin_key == admin_in.admin_key).first():
        raise HTTPException(status_code=400, detail="Admin key is already in use.")

    hashed_password = Hasher.get_password_hash(admin_in.password)
    new_admin = Admin(
        username=admin_in.username,
        password_hash=hashed_password,
        admin_key=admin_in.admin_key
    )
    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)
    return new_admin

@router.patch("/admins/{admin_id}/deactivate", response_model=AdminOut)
async def deactivate_admin(
    admin_id: int,
    db: Session = Depends(get_db),
    current_super_admin: SuperAdmin = Depends(get_current_super_admin)
):
    """
    Deactivates an admin and cascades the deactivation to all their users and groups.
    (Super Admin only)
    """
    admin = db.query(Admin).filter(Admin.id == admin_id).first()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found.")
    
    # Deactivate the admin
    admin.is_active = False
    
    # Cascade deactivate all users of this admin
    db.query(User).filter(User.admin_id == admin_id).update({"is_active": False})
    
    # Cascade deactivate all groups of this admin
    db.query(Group).filter(Group.admin_id == admin_id).update({"is_active": False})
    
    db.commit()
    db.refresh(admin)
    
    return admin

@router.patch("/admins/{admin_id}/reactivate", response_model=AdminOut)
def reactivate_admin(
    admin_id: int,
    db: Session = Depends(get_db),
    current_super_admin: SuperAdmin = Depends(get_current_super_admin)
):
    """
    Reactivates an admin and cascades the reactivation to all their users and groups.
    (Super Admin only)
    """
    admin = db.query(Admin).filter(Admin.id == admin_id).first()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found.")
        
    # Reactivate the admin
    admin.is_active = True
    
    # Cascade reactivate all users
    db.query(User).filter(User.admin_id == admin_id).update({"is_active": True})
    
    # Cascade reactivate all groups
    db.query(Group).filter(Group.admin_id == admin_id).update({"is_active": True})
    
    db.commit()
    db.refresh(admin)
    return admin

@router.get("/admins", response_model=List[AdminOut])
def list_all_admins(
    db: Session = Depends(get_db),
    current_super_admin: SuperAdmin = Depends(get_current_super_admin)
):
    """
    Lists all admins in the system. (Super Admin only)
    """
    return db.query(Admin).all()
