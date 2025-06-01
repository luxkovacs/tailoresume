from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional, cast
from sqlalchemy.orm import Session

from ..schemas import language_schemas
from ..models.models import Language as DBModelLanguage, User as DBModelUser
from ..core.auth import get_current_user
from ..core.database import get_db

router = APIRouter(
    tags=["Languages"]
)

def get_language_by_name_for_user(db: Session, name: str, user_id: int) -> Optional[DBModelLanguage]:
    return db.query(DBModelLanguage).filter(DBModelLanguage.name == name, DBModelLanguage.user_id == user_id).first()

@router.post("/", response_model=language_schemas.Language, status_code=status.HTTP_201_CREATED)
def create_language(
    language_in: language_schemas.LanguageCreate,
    current_user: DBModelUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new language for the current user."""
    user_id_actual = cast(int, current_user.id)
    existing_language = get_language_by_name_for_user(db, name=language_in.name, user_id=user_id_actual)
    if existing_language:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Language with this name already exists for the current user"
        )
    
    db_language_data = language_in.model_dump()
    db_language = DBModelLanguage(**db_language_data, user_id=user_id_actual)
    db.add(db_language)
    db.commit()
    db.refresh(db_language)
    return db_language

@router.get("/", response_model=List[language_schemas.Language])
def get_languages(
    current_user: DBModelUser = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """Get all languages for the current user."""
    user_id_actual = cast(int, current_user.id)
    languages = db.query(DBModelLanguage).filter(DBModelLanguage.user_id == user_id_actual).offset(skip).limit(limit).all()
    return languages

@router.get("/{language_id}", response_model=language_schemas.Language)
def get_language(
    language_id: int,
    current_user: DBModelUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific language by ID."""
    user_id_actual = cast(int, current_user.id)
    db_language = db.query(DBModelLanguage).filter(DBModelLanguage.id == language_id, DBModelLanguage.user_id == user_id_actual).first()
    if not db_language:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Language not found or not owned by user")
    return db_language

@router.put("/{language_id}", response_model=language_schemas.Language)
def update_language(
    language_id: int,
    language_update_in: language_schemas.LanguageUpdate,
    current_user: DBModelUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a specific language by ID."""
    user_id_actual = cast(int, current_user.id)
    db_language = db.query(DBModelLanguage).filter(DBModelLanguage.id == language_id, DBModelLanguage.user_id == user_id_actual).first()
    if not db_language:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Language not found or not owned by user")
    
    update_data = language_update_in.model_dump(exclude_unset=True)
    
    if 'name' in update_data and update_data['name'] != db_language.name:
        existing_language_with_new_name = get_language_by_name_for_user(db, name=update_data['name'], user_id=user_id_actual)
        if existing_language_with_new_name:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Another language with this name already exists for the current user"
            )

    for key, value in update_data.items():
        setattr(db_language, key, value)
    
    db.commit()
    db.refresh(db_language)
    return db_language

@router.delete("/{language_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_language(
    language_id: int,
    current_user: DBModelUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a specific language by ID."""
    user_id_actual = cast(int, current_user.id)
    db_language = db.query(DBModelLanguage).filter(DBModelLanguage.id == language_id, DBModelLanguage.user_id == user_id_actual).first()
    if not db_language:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Language not found or not owned by user")
    
    db.delete(db_language)
    db.commit()
    return None
