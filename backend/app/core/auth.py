import os
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..models.models import User
from ..core.database import get_db

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "generate_a_secure_secret_key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 10080 # 7 days for testing, was 30

# Password handling
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
# This scheme is for the /api/auth/token endpoint (OAuth2 password flow)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token") 
# This scheme is for general Bearer token authentication for other endpoints
http_bearer_scheme = HTTPBearer()

def verify_password(plain_password, hashed_password):
    """Verify a password against a hash."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    """Generate a password hash."""
    return pwd_context.hash(password)

def authenticate_user(db: Session, email: str, password: str):
    """Authenticate a user by email and password."""
    cleaned_email = email.strip()
    print(f"Attempting to authenticate user with cleaned email: {cleaned_email}")  # DEBUG
    
    user = db.query(User).filter(func.lower(User.email) == func.lower(cleaned_email)).first()
    
    if not user:
        print(f"User with cleaned email {cleaned_email} (case-insensitive) not found.")  # DEBUG
        return False
    
    print(f"User found: {user.email} (DB actual: {user.email}), Hashed password from DB: {user.hashed_password}")  # DEBUG

    # If the user has no hashed password (e.g., created via Firebase or other external provider),
    # they cannot be authenticated using this local password verification method.
    if user.hashed_password is None:
        print(f"User {cleaned_email} has no local password set. Cannot authenticate via /token endpoint.") # DEBUG
        return False

    # Proceed with password verification only if a hashed_password exists.
    password_verified = verify_password(password, user.hashed_password)
    print(f"Password verification result for {cleaned_email}: {password_verified}")  # DEBUG
    
    if not password_verified:
        print(f"Password verification failed for user {cleaned_email}.")  # DEBUG
        return False
        
    print(f"User {cleaned_email} authenticated successfully.")  # DEBUG
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Updated get_current_user to use http_bearer_scheme
def get_current_user(db: Session = Depends(get_db), auth_credentials: HTTPAuthorizationCredentials = Depends(http_bearer_scheme)):
    """Get the current authenticated user from a Bearer token."""
    token = auth_credentials.credentials # Extract token from HTTPAuthorizationCredentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email_from_payload = payload.get("sub") 
        if email_from_payload is None:
            raise credentials_exception
        email: str = str(email_from_payload) 
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user