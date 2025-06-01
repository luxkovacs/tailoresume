from pydantic import BaseModel
from typing import Optional
from datetime import date

class ProjectBase(BaseModel):
    name: str
    description: str
    url: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_current: bool = False
    technologies: Optional[str] = None  # JSON string or comma-separated

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(ProjectBase):
    name: Optional[str] = None
    description: Optional[str] = None
    url: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_current: Optional[bool] = None
    technologies: Optional[str] = None

class ProjectInDBBase(ProjectBase):
    id: int
    user_id: int

    class Config:
        orm_mode = True

class Project(ProjectInDBBase):
    pass

class ProjectList(BaseModel):
    projects: list[Project]
