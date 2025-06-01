from pydantic import BaseModel
from typing import Optional
from app.models.models import ExperienceLevel # Import the Enum

class SkillBase(BaseModel):
    name: str
    experience_level: ExperienceLevel
    category: Optional[str] = None
    years_of_experience: Optional[int] = None
    details: Optional[str] = None
    keywords: Optional[str] = None

class SkillCreate(SkillBase):
    pass

class SkillUpdate(SkillBase):
    name: Optional[str] = None # All fields optional for update
    experience_level: Optional[ExperienceLevel] = None
    category: Optional[str] = None
    years_of_experience: Optional[int] = None
    details: Optional[str] = None
    keywords: Optional[str] = None

class SkillInDBBase(SkillBase):
    id: int
    user_id: int

    class Config:
        orm_mode = True # Changed from from_attributes = True for Pydantic v1 compatibility if that's what the project uses

# For returning a skill from the API
class Skill(SkillInDBBase):
    pass

# For returning a list of skills
class SkillList(BaseModel):
    skills: list[Skill]

