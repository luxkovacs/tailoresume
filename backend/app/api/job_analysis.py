from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from ..models.models import User, Skill
from ..core.auth import get_current_user
from ..core.database import get_db
from ..services.ai_service import AIService, AIProvider

router = APIRouter()

class JobAnalysisRequest(BaseModel):
    job_description: str

class JobAnalysisResponse(BaseModel):
    job_title: str
    required_skills: List[str]
    preferred_skills: List[str]
    experience_level: str
    education_requirements: List[str]
    key_responsibilities: List[str]
    industry: str
    keywords: List[str]
    
class SkillMatchRequest(BaseModel):
    job_description: str
    skill_ids: Optional[List[int]] = None  # If not provided, use all user skills

class SkillMatch(BaseModel):
    skill: str
    relevance: str
    notes: str

class SkillMatchResponse(BaseModel):
    matching_skills: List[SkillMatch]
    missing_required_skills: List[str]
    missing_preferred_skills: List[str]
    overall_match_percentage: int
    recommendations: List[str]

@router.post("/analyze", response_model=JobAnalysisResponse)
def analyze_job_description(
    request: JobAnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Analyze a job description to extract key information like required skills,
    experience level, and responsibilities.
    """
    # Check if user has API keys
    provider = current_user.preferred_ai_provider or AIProvider.OPENAI
    api_key = None
    
    if provider == AIProvider.OPENAI:
        api_key = current_user.api_key_openai
    elif provider == AIProvider.ANTHROPIC:
        api_key = current_user.api_key_anthropic
    elif provider == AIProvider.GOOGLE:
        api_key = current_user.api_key_google
    
    if not api_key:
        raise HTTPException(
            status_code=400,
            detail=f"No API key found for {provider}. Please add your API key in the settings."
        )
    
    # Initialize AI service with the user's API key
    ai_service = AIService(api_key=api_key, provider=provider)
    
    try:
        # Analyze the job description
        result = ai_service.analyze_job_description(request.job_description)
        
        if "error" in result:
            raise HTTPException(
                status_code=500,
                detail=f"Error analyzing job description: {result['error']}"
            )
        
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze job description: {str(e)}"
        )

@router.post("/match-skills", response_model=SkillMatchResponse)
def match_skills_to_job(
    request: SkillMatchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Match the user's skills to a job description and identify gaps.
    """
    # Check if user has API keys
    provider = current_user.preferred_ai_provider or AIProvider.OPENAI
    api_key = None
    
    if provider == AIProvider.OPENAI:
        api_key = current_user.api_key_openai
    elif provider == AIProvider.ANTHROPIC:
        api_key = current_user.api_key_anthropic
    elif provider == AIProvider.GOOGLE:
        api_key = current_user.api_key_google
    
    if not api_key:
        raise HTTPException(
            status_code=400,
            detail=f"No API key found for {provider}. Please add your API key in the settings."
        )
    
    # Get the user's skills
    if request.skill_ids:
        skills = db.query(Skill).filter(
            Skill.user_id == current_user.id,
            Skill.id.in_(request.skill_ids)
        ).all()
    else:
        skills = db.query(Skill).filter(
            Skill.user_id == current_user.id
        ).all()
    
    if not skills:
        raise HTTPException(
            status_code=400,
            detail="No skills found. Please add skills to your profile first."
        )
    
    # Initialize AI service with the user's API key
    ai_service = AIService(api_key=api_key, provider=provider)
    
    try:
        # First analyze the job description
        job_analysis = ai_service.analyze_job_description(request.job_description)
        
        if "error" in job_analysis:
            raise HTTPException(
                status_code=500,
                detail=f"Error analyzing job description: {job_analysis['error']}"
            )
        
        # Convert skills to dictionary format for the AI service
        skills_data = [
            {
                "name": skill.name,
                "category": skill.category,
                "experience_level": skill.experience_level.value if skill.experience_level else "Not specified",
                "years_of_experience": skill.years_of_experience,
                "details": skill.details
            }
            for skill in skills
        ]
        
        # Match skills to the job
        match_result = ai_service.match_skills_to_job(job_analysis, skills_data)
        
        if "error" in match_result:
            raise HTTPException(
                status_code=500,
                detail=f"Error matching skills: {match_result['error']}"
            )
        
        return match_result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to match skills to job: {str(e)}"
        )