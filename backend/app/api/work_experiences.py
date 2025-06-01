from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session

from ..models.models import WorkExperience, User
from ..core.auth import get_current_user
from ..core.database import get_db

router = APIRouter()

class WorkExperienceBase(BaseModel):
    company: str
    job_title: str
    start_date: date
    end_date: Optional[date] = None
    is_current: bool = False
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    description: Optional[str] = None
    responsibilities: Optional[str] = None
    achievements: Optional[str] = None

class WorkExperienceCreate(WorkExperienceBase):
    pass

class WorkExperienceUpdate(BaseModel):
    company: Optional[str] = None
    job_title: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_current: Optional[bool] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    description: Optional[str] = None
    responsibilities: Optional[str] = None
    achievements: Optional[str] = None

class WorkExperienceResponse(WorkExperienceBase):
    id: int
    user_id: int

    class Config:
        orm_mode = True

@router.post("/", response_model=WorkExperienceResponse)
def create_work_experience(
    work_experience: WorkExperienceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new work experience entry for the current user."""
    # Validate that if is_current is True, end_date should be None
    if work_experience.is_current and work_experience.end_date:
        raise HTTPException(
            status_code=400,
            detail="Current job should not have an end date"
        )
    
    # Create work experience object
    db_work_experience = WorkExperience(
        **work_experience.dict(),
        user_id=current_user.id
    )
    db.add(db_work_experience)
    db.commit()
    db.refresh(db_work_experience)
    return db_work_experience

@router.get("/", response_model=List[WorkExperienceResponse])
def get_work_experiences(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """Get all work experiences for the current user."""
    work_experiences = db.query(WorkExperience)\
        .filter(WorkExperience.user_id == current_user.id)\
        .order_by(WorkExperience.start_date.desc())\
        .offset(skip).limit(limit).all()
    return work_experiences

@router.get("/{work_experience_id}", response_model=WorkExperienceResponse)
def get_work_experience(
    work_experience_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific work experience by ID."""
    work_experience = db.query(WorkExperience).filter(
        WorkExperience.id == work_experience_id,
        WorkExperience.user_id == current_user.id
    ).first()
    if not work_experience:
        raise HTTPException(status_code=404, detail="Work experience not found")
    return work_experience

@router.put("/{work_experience_id}", response_model=WorkExperienceResponse)
def update_work_experience(
    work_experience_id: int,
    work_experience: WorkExperienceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a specific work experience by ID."""
    db_work_experience = db.query(WorkExperience).filter(
        WorkExperience.id == work_experience_id,
        WorkExperience.user_id == current_user.id
    ).first()
    if not db_work_experience:
        raise HTTPException(status_code=404, detail="Work experience not found")
    
    # Update only the fields that were provided
    update_data = work_experience.dict(exclude_unset=True)
    
    # Validate that if is_current is being set to True, end_date should be None
    if update_data.get('is_current') and update_data.get('end_date'):
        raise HTTPException(
            status_code=400,
            detail="Current job should not have an end date"
        )
    
    for key, value in update_data.items():
        setattr(db_work_experience, key, value)
    
    db.commit()
    db.refresh(db_work_experience)
    return db_work_experience

@router.delete("/{work_experience_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_work_experience(
    work_experience_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a specific work experience by ID."""
    db_work_experience = db.query(WorkExperience).filter(
        WorkExperience.id == work_experience_id,
        WorkExperience.user_id == current_user.id
    ).first()
    if not db_work_experience:
        raise HTTPException(status_code=404, detail="Work experience not found")
    
    db.delete(db_work_experience)
    db.commit()
    return None