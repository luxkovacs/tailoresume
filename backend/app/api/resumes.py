from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
from datetime import datetime

from ..models.models import Resume, User
from ..core.auth import get_current_user
from ..core.database import get_db
from ..services.resume_generator import ResumeGenerator, ResumeFormat

router = APIRouter()

class ResumeBase(BaseModel):
    title: str
    job_description: str
    format: str  # "pdf", "word", "latex", or "html"
    job_title: Optional[str] = None
    company_name: Optional[str] = None
    
    # Selected items for the resume
    selected_skill_ids: Optional[List[int]] = None
    selected_experience_ids: Optional[List[int]] = None
    selected_education_ids: Optional[List[int]] = None
    selected_project_ids: Optional[List[int]] = None
    selected_certification_ids: Optional[List[int]] = None
    selected_language_ids: Optional[List[int]] = None
    
    # Resume section controls
    include_summary: bool = True
    include_skills: bool = True
    include_experience: bool = True
    include_education: bool = True
    include_projects: bool = False
    include_certifications: bool = False
    include_languages: bool = False

class ResumeCreate(ResumeBase):
    pass

class ResumeUpdate(BaseModel):
    title: Optional[str] = None
    format: Optional[str] = None
    
    # Selected items for the resume
    selected_skill_ids: Optional[List[int]] = None
    selected_experience_ids: Optional[List[int]] = None
    selected_education_ids: Optional[List[int]] = None
    selected_project_ids: Optional[List[int]] = None
    selected_certification_ids: Optional[List[int]] = None
    selected_language_ids: Optional[List[int]] = None
    
    # Resume section controls
    include_summary: Optional[bool] = None
    include_skills: Optional[bool] = None
    include_experience: Optional[bool] = None
    include_education: Optional[bool] = None
    include_projects: Optional[bool] = None
    include_certifications: Optional[bool] = None
    include_languages: Optional[bool] = None

class ResumeResponse(BaseModel):
    id: int
    title: str
    created_at: str
    last_modified: str
    format: str
    job_title: Optional[str] = None
    company_name: Optional[str] = None
    ats_score: Optional[int] = None
    ats_feedback: Optional[str] = None
    
    # Resume section controls
    include_summary: bool
    include_skills: bool
    include_experience: bool
    include_education: bool
    include_projects: bool
    include_certifications: bool
    include_languages: bool

    class Config:
        orm_mode = True

@router.post("/", response_model=ResumeResponse)
def create_resume(
    resume: ResumeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new tailored resume from a job description."""
    # Validate the resume format
    if resume.format not in [ResumeFormat.PDF, ResumeFormat.WORD, ResumeFormat.LATEX, ResumeFormat.HTML]:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid format. Must be one of: {ResumeFormat.PDF}, {ResumeFormat.WORD}, {ResumeFormat.LATEX}, {ResumeFormat.HTML}"
        )
    
    # Create a resume generator and create the resume
    resume_generator = ResumeGenerator(db)
    try:
        new_resume = resume_generator.create_resume(
            user_id=current_user.id,
            title=resume.title,
            job_description=resume.job_description,
            format=resume.format,
            job_title=resume.job_title,
            company_name=resume.company_name,
            selected_skill_ids=resume.selected_skill_ids,
            selected_experience_ids=resume.selected_experience_ids,
            selected_education_ids=resume.selected_education_ids,
            selected_project_ids=resume.selected_project_ids,
            selected_certification_ids=resume.selected_certification_ids,
            selected_language_ids=resume.selected_language_ids,
            include_summary=resume.include_summary,
            include_skills=resume.include_skills,
            include_experience=resume.include_experience,
            include_education=resume.include_education,
            include_projects=resume.include_projects,
            include_certifications=resume.include_certifications,
            include_languages=resume.include_languages
        )
        return new_resume
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[ResumeResponse])
def get_resumes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """Get all resumes for the current user."""
    resumes = db.query(Resume)\
        .filter(Resume.user_id == current_user.id)\
        .order_by(Resume.created_at.desc())\
        .offset(skip).limit(limit).all()
    return resumes

@router.get("/{resume_id}", response_model=ResumeResponse)
def get_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific resume by ID."""
    resume_generator = ResumeGenerator(db)
    resume = resume_generator.get_resume(resume_id)
    
    if not resume or resume.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    return resume

@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a specific resume by ID."""
    resume_generator = ResumeGenerator(db)
    success = resume_generator.delete_resume(resume_id, current_user.id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    return None

@router.get("/{resume_id}/download")
def download_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Download a resume in the specified format.
    This is a placeholder endpoint. In a production environment, 
    this would generate and return the actual file in the specified format.
    """
    resume_generator = ResumeGenerator(db)
    resume = resume_generator.get_resume(resume_id)
    
    if not resume or resume.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    # In a real implementation, this would return a file response with the actual resume file
    # For now, return a placeholder response
    return {
        "message": f"Download endpoint for resume {resume_id} in {resume.format} format",
        "resume_id": resume_id,
        "format": resume.format,
        "download_url": f"/api/resumes/{resume_id}/file" 
    }