from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional, cast
from sqlalchemy.orm import Session

from ..schemas import project_schemas
from ..models.models import Project as DBModelProject, User as DBModelUser
from ..core.auth import get_current_user
from ..core.database import get_db

router = APIRouter(
    tags=["Projects"]
)

def get_project_by_name_for_user(db: Session, name: str, user_id: int) -> Optional[DBModelProject]:
    return db.query(DBModelProject).filter(DBModelProject.name == name, DBModelProject.user_id == user_id).first()

@router.post("/", response_model=project_schemas.Project, status_code=status.HTTP_201_CREATED)
def create_project(
    project_in: project_schemas.ProjectCreate,
    current_user: DBModelUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new project for the current user."""
    user_id_actual = cast(int, current_user.id)
    existing_project = get_project_by_name_for_user(db, name=project_in.name, user_id=user_id_actual)
    if existing_project:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Project with this name already exists for the current user"
        )
    
    db_project_data = project_in.model_dump()
    db_project = DBModelProject(**db_project_data, user_id=user_id_actual)
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

@router.get("/", response_model=List[project_schemas.Project])
def get_projects(
    current_user: DBModelUser = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """Get all projects for the current user."""
    user_id_actual = cast(int, current_user.id)
    projects = db.query(DBModelProject).filter(DBModelProject.user_id == user_id_actual).offset(skip).limit(limit).all()
    return projects

@router.get("/{project_id}", response_model=project_schemas.Project)
def get_project(
    project_id: int,
    current_user: DBModelUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific project by ID."""
    user_id_actual = cast(int, current_user.id)
    db_project = db.query(DBModelProject).filter(DBModelProject.id == project_id, DBModelProject.user_id == user_id_actual).first()
    if not db_project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found or not owned by user")
    return db_project

@router.put("/{project_id}", response_model=project_schemas.Project)
def update_project(
    project_id: int,
    project_update_in: project_schemas.ProjectUpdate,
    current_user: DBModelUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a specific project by ID."""
    user_id_actual = cast(int, current_user.id)
    db_project = db.query(DBModelProject).filter(DBModelProject.id == project_id, DBModelProject.user_id == user_id_actual).first()
    if not db_project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found or not owned by user")
    
    update_data = project_update_in.model_dump(exclude_unset=True)
    
    if 'name' in update_data and update_data['name'] != db_project.name:
        existing_project_with_new_name = get_project_by_name_for_user(db, name=update_data['name'], user_id=user_id_actual)
        if existing_project_with_new_name:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Another project with this name already exists for the current user"
            )

    for key, value in update_data.items():
        setattr(db_project, key, value)
    
    db.commit()
    db.refresh(db_project)
    return db_project

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    current_user: DBModelUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a specific project by ID."""
    user_id_actual = cast(int, current_user.id)
    db_project = db.query(DBModelProject).filter(DBModelProject.id == project_id, DBModelProject.user_id == user_id_actual).first()
    if not db_project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found or not owned by user")
    
    db.delete(db_project)
    db.commit()
    return None
