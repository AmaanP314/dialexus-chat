from fastapi import Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import Union

from app.db.session import get_db
from app.security.jwt import verify_token
from app.models import User, Admin, SuperAdmin

def get_current_user_from_cookie(request: Request, db: Session = Depends(get_db)) -> Union[User, Admin, SuperAdmin]:
    """
    New primary dependency to get the current user from the access_token cookie.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token = request.cookies.get("access_token")
    if token is None:
        raise credentials_exception
        
    token_data = verify_token(token, credentials_exception)
    
    # Based on the role in the token, fetch from the correct table
    role = token_data.role
    username = token_data.username
    
    user = None
    if role == "user":
        user = db.query(User).filter(User.username == username).first()
    elif role == "admin":
        user = db.query(Admin).filter(Admin.username == username).first()
    elif role == "super_admin":
        user = db.query(SuperAdmin).filter(SuperAdmin.username == username).first()

    if user is None:
        raise credentials_exception
        
    return user

def get_current_super_admin(current_user: SuperAdmin = Depends(get_current_user_from_cookie)) -> SuperAdmin:
    """
    Dependency to ensure the current user is a Super Admin.
    """
    if not isinstance(current_user, SuperAdmin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation not permitted. Requires super admin privileges."
        )
    return current_user