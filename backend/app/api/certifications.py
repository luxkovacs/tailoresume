from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional, cast
from sqlalchemy.orm import Session

from ..schemas import certification_schemas
from ..models.models import Certification as DBModelCertification, User as DBModelUser
from ..core.auth import get_current_user
from ..core.database import get_db

router = APIRouter(
    tags=["Certifications"]
)

def get_certification_by_name_for_user(db: Session, name: str, user_id: int) -> Optional[DBModelCertification]:
    return db.query(DBModelCertification).filter(DBModelCertification.name == name, DBModelCertification.user_id == user_id).first()

@router.post("/", response_model=certification_schemas.Certification, status_code=status.HTTP_201_CREATED)
def create_certification(
    certification_in: certification_schemas.CertificationCreate,
    current_user: DBModelUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new certification for the current user."""
    user_id_actual = cast(int, current_user.id)
    existing_certification = get_certification_by_name_for_user(db, name=certification_in.name, user_id=user_id_actual)
    if existing_certification:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Certification with this name already exists for the current user"
        )
    
    db_certification_data = certification_in.model_dump()
    db_certification = DBModelCertification(**db_certification_data, user_id=user_id_actual)
    db.add(db_certification)
    db.commit()
    db.refresh(db_certification)
    return db_certification

@router.get("/", response_model=List[certification_schemas.Certification])
def get_certifications(
    current_user: DBModelUser = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """Get all certifications for the current user."""
    user_id_actual = cast(int, current_user.id)
    certifications = db.query(DBModelCertification).filter(DBModelCertification.user_id == user_id_actual).offset(skip).limit(limit).all()
    return certifications

@router.get("/{certification_id}", response_model=certification_schemas.Certification)
def get_certification(
    certification_id: int,
    current_user: DBModelUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific certification by ID."""
    user_id_actual = cast(int, current_user.id)
    db_certification = db.query(DBModelCertification).filter(DBModelCertification.id == certification_id, DBModelCertification.user_id == user_id_actual).first()
    if not db_certification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Certification not found or not owned by user")
    return db_certification

@router.put("/{certification_id}", response_model=certification_schemas.Certification)
def update_certification(
    certification_id: int,
    certification_update_in: certification_schemas.CertificationUpdate,
    current_user: DBModelUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a specific certification by ID."""
    user_id_actual = cast(int, current_user.id)
    db_certification = db.query(DBModelCertification).filter(DBModelCertification.id == certification_id, DBModelCertification.user_id == user_id_actual).first()
    if not db_certification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Certification not found or not owned by user")
    
    update_data = certification_update_in.model_dump(exclude_unset=True)
    
    if 'name' in update_data and update_data['name'] != db_certification.name:
        existing_certification_with_new_name = get_certification_by_name_for_user(db, name=update_data['name'], user_id=user_id_actual)
        if existing_certification_with_new_name:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Another certification with this name already exists for the current user"
            )

    for key, value in update_data.items():
        setattr(db_certification, key, value)
    
    db.commit()
    db.refresh(db_certification)
    return db_certification

@router.delete("/{certification_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_certification(
    certification_id: int,
    current_user: DBModelUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a specific certification by ID."""
    user_id_actual = cast(int, current_user.id)
    db_certification = db.query(DBModelCertification).filter(DBModelCertification.id == certification_id, DBModelCertification.user_id == user_id_actual).first()
    if not db_certification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Certification not found or not owned by user")
    
    db.delete(db_certification)
    db.commit()
    return None
