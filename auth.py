from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from database import get_user_by_username, get_user_by_id, update_user_login
from models import UserRole
from exceptions import AuthenticationError, AuthorizationError, ErrorMessages

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now() + expires_delta
    else:
        expire = datetime.now() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
        return payload
    except JWTError:
        return None

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = verify_token(token)
    if payload is None:
        raise AuthenticationError(ErrorMessages.INVALID_TOKEN)
    
    username: str = payload.get("sub")
    if username is None:
        raise AuthenticationError(ErrorMessages.INVALID_TOKEN)
    
    user = await get_user_by_username(username)
    if user is None:
        raise AuthenticationError(ErrorMessages.USER_NOT_FOUND)
    
    return user

async def get_current_teacher(current_user = Depends(get_current_user)):
    if current_user["role"] not in [UserRole.TEACHER, UserRole.ADMIN]:
        raise AuthorizationError(
            required_role="Teacher or Admin",
            current_role=current_user["role"]
        )
    return current_user

async def get_current_admin(current_user = Depends(get_current_user)):
    if current_user["role"] != UserRole.ADMIN:
        raise AuthorizationError(
            required_role="Admin",
            current_role=current_user["role"]
        )
    return current_user
