from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional, cast
from sqlalchemy.orm import Session

from ..schemas import skill_schemas
from ..models.models import Skill as DBModelSkill, User as DBModelUser, ExperienceLevel
from ..core.auth import get_current_user
from ..core.database import get_db

router = APIRouter(
    tags=["Skills"]
)

def get_skill_by_name_for_user(db: Session, name: str, user_id: int) -> Optional[DBModelSkill]:
    return db.query(DBModelSkill).filter(DBModelSkill.name == name, DBModelSkill.user_id == user_id).first()

@router.post("/", response_model=skill_schemas.Skill, status_code=status.HTTP_201_CREATED)
def create_skill(
    skill_in: skill_schemas.SkillCreate,
    current_user: DBModelUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new skill for the current user."""
    user_id_actual = cast(int, current_user.id)
    existing_skill = get_skill_by_name_for_user(db, name=skill_in.name, user_id=user_id_actual)
    if existing_skill:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Skill with this name already exists for the current user"
        )
    
    db_skill_data = skill_in.model_dump()
    db_skill = DBModelSkill(**db_skill_data, user_id=user_id_actual)
    db.add(db_skill)
    db.commit()
    db.refresh(db_skill)
    return db_skill

@router.get("/", response_model=List[skill_schemas.Skill])
def get_skills(
    current_user: DBModelUser = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None
):
    """Get all skills for the current user with optional filtering."""
    user_id_actual = cast(int, current_user.id)
    query = db.query(DBModelSkill).filter(DBModelSkill.user_id == user_id_actual)
    
    if category:
        query = query.filter(DBModelSkill.category == category)
    
    skills = query.offset(skip).limit(limit).all()
    return skills

@router.get("/{skill_id}", response_model=skill_schemas.Skill)
def get_skill(
    skill_id: int,
    current_user: DBModelUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific skill by ID."""
    user_id_actual = cast(int, current_user.id)
    db_skill = db.query(DBModelSkill).filter(DBModelSkill.id == skill_id, DBModelSkill.user_id == user_id_actual).first()
    if not db_skill:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill not found or not owned by user")
    return db_skill

@router.put("/{skill_id}", response_model=skill_schemas.Skill)
def update_skill(
    skill_id: int,
    skill_update_in: skill_schemas.SkillUpdate,
    current_user: DBModelUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a specific skill by ID."""
    user_id_actual = cast(int, current_user.id)
    db_skill = db.query(DBModelSkill).filter(DBModelSkill.id == skill_id, DBModelSkill.user_id == user_id_actual).first()
    if not db_skill:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill not found or not owned by user")
    
    update_data = skill_update_in.model_dump(exclude_unset=True)
    
    if 'name' in update_data and update_data['name'] != db_skill.name:
        existing_skill_with_new_name = get_skill_by_name_for_user(db, name=update_data['name'], user_id=user_id_actual)
        if existing_skill_with_new_name:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Another skill with this name already exists for the current user"
            )

    for key, value in update_data.items():
        setattr(db_skill, key, value)
    
    db.commit()
    db.refresh(db_skill)
    return db_skill

@router.delete("/{skill_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_skill(
    skill_id: int,
    current_user: DBModelUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a specific skill by ID."""
    user_id_actual = cast(int, current_user.id)
    db_skill = db.query(DBModelSkill).filter(DBModelSkill.id == skill_id, DBModelSkill.user_id == user_id_actual).first()
    if not db_skill:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill not found or not owned by user")
    
    db.delete(db_skill)
    db.commit()
    return None