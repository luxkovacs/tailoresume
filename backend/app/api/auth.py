from datetime import timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from ..core.auth import authenticate_user, create_access_token, get_password_hash, ACCESS_TOKEN_EXPIRE_MINUTES
from ..core.database import get_db
from ..models.models import User
from ..core.firebase_auth import verify_firebase_token

router = APIRouter()

class Token(BaseModel):
    access_token: str
    token_type: str

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    username: str

    class Config:
        orm_mode = True

@router.post("/register", response_model=UserResponse)
def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    # Check if email already exists
    db_user = db.query(User).filter(User.email == user_data.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Check if username already exists
    db_user = db.query(User).filter(User.username == user_data.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        email=user_data.email,
        username=user_data.username,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.post("/login", response_model=Token)
async def login_with_firebase(firebase_user: dict = Depends(verify_firebase_token), db: Session = Depends(get_db)):
    """Login/register user via Firebase token and issue a backend JWT."""
    if not firebase_user or not firebase_user.get("email"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Firebase token or email missing"
        )

    email = firebase_user["email"]
    # Optional: Get name or other details from firebase_user if needed
    # name = firebase_user.get("name") 

    # Check if user exists in your database
    user = db.query(User).filter(User.email == email).first()

    if not user:
        # User does not exist, create a new user record
        # You might want to generate a random password or leave it null if Firebase is the sole auth method
        # For simplicity, we'll use a placeholder for username if not available from Firebase token
        username = firebase_user.get("name") or email.split('@')[0] # Example username
        
        # Check if generated username already exists
        temp_username = username
        counter = 1
        while db.query(User).filter(User.username == temp_username).first():
            temp_username = f"{username}{counter}"
            counter += 1
        username = temp_username

        # Create a new user. Password is not set or set to a dummy value as Firebase handles auth.
        new_user = User(
            email=email,
            username=username,
            # hashed_password=get_password_hash("some_default_or_random_password_if_needed") 
            # Or leave hashed_password null if your model allows and Firebase is primary auth
            full_name=firebase_user.get("name")
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        user = new_user
        print(f"New user created in local DB: {email}")
    else:
        print(f"User found in local DB: {email}")

    # Create an access token for your backend
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    backend_access_token = create_access_token(
        data={"sub": user.email, "user_id": user.id}, expires_delta=access_token_expires
    )
    return {"access_token": backend_access_token, "token_type": "bearer"}


@router.post("/token", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Generate a token for authentication."""
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}