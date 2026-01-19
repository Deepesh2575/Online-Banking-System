from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import jwt

import models, schemas
from database import get_db
from config import settings

# This would be for JWT in headers, but we'll use a cookie instead.
# It can be kept for other uses or if you switch later.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# --- JWT/Cookie Helper Functions ---

def create_access_token(data: dict):
    """Creates a JWT access token."""
    to_encode = data.copy()
    # For simplicity, we are not setting an expiry time.
    # In a real app, you should add:
    # expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    # to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
    return encoded_jwt

def verify_token(token: str, credentials_exception):
    """Decodes and verifies a JWT token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        return schemas.TokenData(username=username)
    except jwt.PyJWTError:
        raise credentials_exception

# --- Main Dependency for Getting Current User ---

async def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> models.User:
    """
    Dependency to get the current user from the JWT token in the Authorization header.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token_data = verify_token(token, credentials_exception)
    
    user = db.query(models.User).filter(models.User.username == token_data.username).first()
    if user is None:
        raise credentials_exception
        
    return user

async def get_current_active_user(
    current_user: models.User = Depends(get_current_user),
) -> models.User:
    """
    A further dependency that can be used to check if the user is active.
    (Here, we just return the user, but you could add checks).
    """
    # if current_user.disabled:
    #     raise HTTPException(status_code=400, detail="Inactive user")
    return current_user
