from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session

from ..models.models import Education, User
from ..core.auth import get_current_user
from ..core.database import get_db

router = APIRouter()

class EducationBase(BaseModel):
    institution: str
    degree: str
    field_of_study: str
    start_date: date
    end_date: Optional[date] = None
    is_current: bool = False
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    gpa: Optional[str] = None
    achievements: Optional[str] = None
    activities: Optional[str] = None

class EducationCreate(EducationBase):
    pass

class EducationUpdate(BaseModel):
    institution: Optional[str] = None
    degree: Optional[str] = None
    field_of_study: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_current: Optional[bool] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    gpa: Optional[str] = None
    achievements: Optional[str] = None
    activities: Optional[str] = None

class EducationResponse(EducationBase):
    id: int
    user_id: int

    class Config:
        orm_mode = True

@router.post("/", response_model=EducationResponse)
def create_education(
    education: EducationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new education entry for the current user."""
    # Validate that if is_current is True, end_date should be None
    if education.is_current and education.end_date:
        raise HTTPException(
            status_code=400,
            detail="Current education should not have an end date"
        )
    
    # Create education object
    db_education = Education(
        **education.dict(),
        user_id=current_user.id
    )
    db.add(db_education)
    db.commit()
    db.refresh(db_education)
    return db_education

@router.get("/", response_model=List[EducationResponse])
def get_educations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """Get all education entries for the current user."""
    educations = db.query(Education)\
        .filter(Education.user_id == current_user.id)\
        .order_by(Education.start_date.desc())\
        .offset(skip).limit(limit).all()
    return educations

@router.get("/{education_id}", response_model=EducationResponse)
def get_education(
    education_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific education entry by ID."""
    education = db.query(Education).filter(
        Education.id == education_id,
        Education.user_id == current_user.id
    ).first()
    if not education:
        raise HTTPException(status_code=404, detail="Education not found")
    return education

@router.put("/{education_id}", response_model=EducationResponse)
def update_education(
    education_id: int,
    education: EducationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a specific education entry by ID."""
    db_education = db.query(Education).filter(
        Education.id == education_id,
        Education.user_id == current_user.id
    ).first()
    if not db_education:
        raise HTTPException(status_code=404, detail="Education not found")
    
    # Update only the fields that were provided
    update_data = education.dict(exclude_unset=True)
    
    # Validate that if is_current is being set to True, end_date should be None
    if update_data.get('is_current') and update_data.get('end_date'):
        raise HTTPException(
            status_code=400,
            detail="Current education should not have an end date"
        )
    
    for key, value in update_data.items():
        setattr(db_education, key, value)
    
    db.commit()
    db.refresh(db_education)
    return db_education

@router.delete("/{education_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_education(
    education_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a specific education entry by ID."""
    db_education = db.query(Education).filter(
        Education.id == education_id,
        Education.user_id == current_user.id
    ).first()
    if not db_education:
        raise HTTPException(status_code=404, detail="Education not found")
    
    db.delete(db_education)
    db.commit()
    return None