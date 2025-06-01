from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..core.auth import get_current_user
from ..core.database import get_db
from ..models.models import User

router = APIRouter()

class ProfileUpdate(BaseModel):
    username: str = None
    email: str = None
    
class ProfileResponse(BaseModel):
    id: int
    username: str
    email: str
    
    class Config:
        orm_mode = True

@router.get("/me", response_model=ProfileResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    """Get the current user's profile."""
    return current_user

@router.put("/me", response_model=ProfileResponse)
def update_profile(
    profile_data: ProfileUpdate, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update the current user's profile."""
    # Check username availability if being updated
    if profile_data.username and profile_data.username != current_user.username:
        db_user = db.query(User).filter(User.username == profile_data.username).first()
        if db_user:
            raise HTTPException(status_code=400, detail="Username already taken")
        current_user.username = profile_data.username
    
    # Check email availability if being updated
    if profile_data.email and profile_data.email != current_user.email:
        db_user = db.query(User).filter(User.email == profile_data.email).first()
        if db_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        current_user.email = profile_data.email
    
    db.commit()
    db.refresh(current_user)
    return current_user