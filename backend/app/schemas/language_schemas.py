from pydantic import BaseModel
from typing import Optional

class LanguageBase(BaseModel):
    name: str
    proficiency: str  # e.g., Native, Fluent, Intermediate, Basic

class LanguageCreate(LanguageBase):
    pass

class LanguageUpdate(LanguageBase):
    name: Optional[str] = None
    proficiency: Optional[str] = None

class LanguageInDBBase(LanguageBase):
    id: int
    user_id: int

    class Config:
        orm_mode = True

class Language(LanguageInDBBase):
    pass

class LanguageList(BaseModel):
    languages: list[Language]
