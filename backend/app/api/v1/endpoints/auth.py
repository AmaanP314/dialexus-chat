from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.user import UserLoginSchema
from app.security.hashing import Hasher
from app.security.jwt import create_access_token, create_refresh_token, verify_token
from app.models import User, Admin, SuperAdmin

router = APIRouter()

def set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    """Utility function to set auth cookies on a response."""
    response.set_cookie(
        key="access_token", value=access_token, httponly=True, samesite="lax", secure=False
    )
    response.set_cookie(
        key="refresh_token", value=refresh_token, httponly=True, samesite="lax", secure=False
    )

def delete_auth_cookies(response: Response):
    """Utility function to delete auth cookies."""
    response.delete_cookie(key="access_token")
    response.delete_cookie(key="refresh_token")

@router.post("/login", status_code=status.HTTP_204_NO_CONTENT)
def login(response: Response, user_credentials: UserLoginSchema, db: Session = Depends(get_db)):
    """
    Handles login and sets HttpOnly cookies for access and refresh tokens.
    Now includes a check to ensure the user/admin is active.
    """
    entity = None
    role = None
    tenant_id = None
    
    inactive_exception = HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Your account has been deactivated. Please contact your administrator."
    )

    # Check across user, admin, and super_admin tables
    user = db.query(User).filter(User.username == user_credentials.username).first()
    if user:
        if not user.is_active:
            raise inactive_exception
        if Hasher.verify_password(user_credentials.password, user.password_hash):
            entity, role, tenant_id = user, "user", user.admin_id
    
    if not entity:
        admin = db.query(Admin).filter(Admin.username == user_credentials.username).first()
        if admin:
            if not admin.is_active:
                raise inactive_exception
            if Hasher.verify_password(user_credentials.password, admin.password_hash):
                entity, role, tenant_id = admin, "admin", admin.id

    if not entity:
        super_admin = db.query(SuperAdmin).filter(SuperAdmin.username == user_credentials.username).first()
        if super_admin and Hasher.verify_password(user_credentials.password, super_admin.password_hash):
            entity, role, tenant_id = super_admin, "super_admin", None

    if not entity:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")

    token_data = {"sub": entity.username, "role": role, "tenant_id": tenant_id}
    access_token = create_access_token(data=token_data)
    refresh_token = create_refresh_token(data=token_data)

    set_auth_cookies(response, access_token, refresh_token)
    return

@router.post("/refresh", status_code=status.HTTP_204_NO_CONTENT)
def refresh_token(request: Request, response: Response, db: Session = Depends(get_db)):
    """
    Uses the refresh_token from cookies to issue a new access_token.
    Now includes a check to ensure the user/admin is still active.
    """
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No refresh token found")
    
    credentials_exception = HTTPException(status_code=401, detail="Could not validate refresh token")
    token_data = verify_token(refresh_token, credentials_exception)
    
    # *** FIX IS HERE: Verify the user from the token is still active ***
    entity_to_check = None
    if token_data.role == "user":
        entity_to_check = db.query(User).filter(User.username == token_data.username).first()
    elif token_data.role == "admin":
        entity_to_check = db.query(Admin).filter(Admin.username == token_data.username).first()

    if entity_to_check and not entity_to_check.is_active:
        # If the user has been deactivated, invalidate their session by deleting cookies
        delete_auth_cookies(response)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Session terminated."
        )

    # Re-create the payload for the new access token
    new_token_data = {"sub": token_data.username, "role": token_data.role, "tenant_id": token_data.tenant_id}
    new_access_token = create_access_token(data=new_token_data)
    
    response.set_cookie(key="access_token", value=new_access_token, httponly=True, samesite="lax", secure=True)
    return

@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response):
    """Logs the user out by deleting the auth cookies."""
    delete_auth_cookies(response)
    return
