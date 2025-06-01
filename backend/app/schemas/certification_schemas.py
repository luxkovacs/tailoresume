from pydantic import BaseModel
from typing import Optional
from datetime import date

class CertificationBase(BaseModel):
    name: str
    issuing_organization: str
    issue_date: date
    expiration_date: Optional[date] = None
    credential_id: Optional[str] = None
    credential_url: Optional[str] = None

class CertificationCreate(CertificationBase):
    pass

class CertificationUpdate(CertificationBase):
    name: Optional[str] = None
    issuing_organization: Optional[str] = None
    issue_date: Optional[date] = None
    expiration_date: Optional[date] = None
    credential_id: Optional[str] = None
    credential_url: Optional[str] = None

class CertificationInDBBase(CertificationBase):
    id: int
    user_id: int

    class Config:
        orm_mode = True

class Certification(CertificationInDBBase):
    pass

class CertificationList(BaseModel):
    certifications: list[Certification]
