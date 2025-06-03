from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from ..models.models import User, Skill, WorkExperience, Education, Certification, Language, Project
from ..core.auth import get_current_user
from ..core.database import get_db
from ..services.ai_service import AIService, AIProvider, DatabankCoverage, GapRecommendation

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

# New models for anti-hallucination functionality
class DatabankValidationRequest(BaseModel):
    job_description: str

class DatabankValidationResponse(BaseModel):
    coverage_summary: Dict[str, Dict[str, Any]]
    critical_gaps: List[str]
    transferable_skills: List[Dict[str, str]]
    databank_utilization_percentage: float

class GapRecommendationResponse(BaseModel):
    category: str
    item_type: str
    suggestion: str
    priority: str
    reasoning: str

class DatabankEnhancementRequest(BaseModel):
    job_description: str

class DatabankEnhancementResponse(BaseModel):
    recommendations: List[GapRecommendationResponse]
    priority_order: List[str]
    estimated_improvement: Dict[str, float]

class AntiHallucinationResumeRequest(BaseModel):
    job_description: str
    max_databank_utilization: bool = True

class AntiHallucinationResumeResponse(BaseModel):
    resume_content: Dict[str, Any]
    databank_utilization_report: Dict[str, Any]
    coverage_analysis: DatabankValidationResponse
    enhancement_suggestions: List[GapRecommendationResponse]

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

def _get_complete_user_databank(user: User, db: Session) -> Dict[str, Any]:
    """Helper function to gather complete user databank for anti-hallucination analysis."""
    # Get all user data
    skills = db.query(Skill).filter(Skill.user_id == user.id).all()
    work_experiences = db.query(WorkExperience).filter(WorkExperience.user_id == user.id).all()
    educations = db.query(Education).filter(Education.user_id == user.id).all()
    certifications = db.query(Certification).filter(Certification.user_id == user.id).all()
    languages = db.query(Language).filter(Language.user_id == user.id).all()
    projects = db.query(Project).filter(Project.user_id == user.id).all()
    
    # Convert to dictionaries for AI processing
    databank = {
        "user_profile": {
            "full_name": user.full_name,
            "email": user.email,
            "phone": user.phone,
            "city": user.city,
            "state": user.state,
            "country": user.country,
            "summary": user.summary,
            "linkedin": user.linkedin,
            "github": user.github,
            "website": user.website
        },
        "skills": [
            {
                "id": skill.id,
                "name": skill.name,
                "category": skill.category,
                "experience_level": skill.experience_level.value if skill.experience_level else None,
                "years_of_experience": skill.years_of_experience,
                "details": skill.details,
                "keywords": skill.keywords
            }
            for skill in skills
        ],
        "work_experiences": [
            {
                "id": exp.id,
                "company": exp.company,
                "job_title": exp.job_title,
                "start_date": exp.start_date.isoformat() if exp.start_date else None,
                "end_date": exp.end_date.isoformat() if exp.end_date else None,
                "is_current": exp.is_current,
                "city": exp.city,
                "state": exp.state,
                "country": exp.country,
                "description": exp.description,
                "achievements": exp.achievements,
                "technologies_used": exp.technologies_used,
                "years": getattr(exp, 'years', 0)  # Calculate if needed
            }
            for exp in work_experiences
        ],
        "educations": [
            {
                "id": edu.id,
                "institution": edu.institution,
                "degree": edu.degree,
                "field_of_study": edu.field_of_study,
                "start_date": edu.start_date.isoformat() if edu.start_date else None,
                "end_date": edu.end_date.isoformat() if edu.end_date else None,
                "is_current": edu.is_current,
                "city": edu.city,
                "state": edu.state,
                "country": edu.country,
                "gpa": str(edu.gpa) if edu.gpa else None,
                "achievements": edu.achievements,
                "activities": edu.activities
            }
            for edu in educations
        ],
        "certifications": [
            {
                "id": cert.id,
                "name": cert.name,
                "issuing_organization": cert.issuing_organization,
                "issue_date": cert.issue_date.isoformat() if cert.issue_date else None,
                "expiration_date": cert.expiration_date.isoformat() if cert.expiration_date else None,
                "credential_id": cert.credential_id,
                "credential_url": cert.credential_url,
                "description": cert.description
            }
            for cert in certifications
        ],
        "languages": [
            {
                "id": lang.id,
                "name": lang.name,
                "proficiency": lang.proficiency.value if lang.proficiency else None,
                "details": lang.details
            }
            for lang in languages
        ],
        "projects": [
            {
                "id": proj.id,
                "name": proj.name,
                "description": proj.description,
                "start_date": proj.start_date.isoformat() if proj.start_date else None,
                "end_date": proj.end_date.isoformat() if proj.end_date else None,
                "is_current": proj.is_current,
                "project_url": proj.project_url,
                "github_url": proj.github_url,
                "technologies_used": proj.technologies_used,
                "achievements": proj.achievements,
                "project_type": proj.project_type
            }
            for proj in projects
        ]
    }
    
    return databank

@router.post("/validate-databank-coverage", response_model=DatabankValidationResponse)
def validate_databank_coverage(
    request: DatabankValidationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Validate user's databank coverage against job requirements.
    Core anti-hallucination endpoint that identifies gaps before generation.
    """
    try:
        # Get user's AI configuration
        api_key = None
        provider = current_user.preferred_ai_provider or "openai"
        
        if provider == "openai":
            api_key = current_user.api_key_openai
        elif provider == "anthropic":
            api_key = current_user.api_key_anthropic
        elif provider == "google":
            api_key = current_user.api_key_google
        
        if not api_key:
            raise HTTPException(
                status_code=400,
                detail=f"No API key configured for {provider}. Please add your API key in settings."
            )
        
        # Initialize AI service
        ai_service = AIService(api_key=api_key, provider=provider)
        
        # Analyze job description
        job_analysis = ai_service.analyze_job_description(request.job_description)
        
        if "error" in job_analysis:
            raise HTTPException(
                status_code=500,
                detail=f"Error analyzing job: {job_analysis['error']}"
            )
        
        # Get complete user databank
        user_databank = _get_complete_user_databank(current_user, db)
        
        # Validate databank coverage
        coverage_analysis = ai_service.validate_databank_coverage(job_analysis, user_databank)
        
        return DatabankValidationResponse(
            coverage_summary=coverage_analysis.coverage_summary,
            critical_gaps=coverage_analysis.critical_gaps,
            transferable_skills=coverage_analysis.transferable_skills,
            databank_utilization_percentage=coverage_analysis.databank_utilization_percentage
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to validate databank coverage: {str(e)}"
        )

@router.post("/suggest-databank-enhancements", response_model=DatabankEnhancementResponse)
def suggest_databank_enhancements(
    request: DatabankEnhancementRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate specific suggestions for databank enhancement based on job requirements.
    """
    try:
        # Get user's AI configuration
        api_key = None
        provider = current_user.preferred_ai_provider or "openai"
        
        if provider == "openai":
            api_key = current_user.api_key_openai
        elif provider == "anthropic":
            api_key = current_user.api_key_anthropic
        elif provider == "google":
            api_key = current_user.api_key_google
        
        if not api_key:
            raise HTTPException(
                status_code=400,
                detail=f"No API key configured for {provider}. Please add your API key in settings."
            )
        
        # Initialize AI service
        ai_service = AIService(api_key=api_key, provider=provider)
        
        # Analyze job description
        job_analysis = ai_service.analyze_job_description(request.job_description)
        
        if "error" in job_analysis:
            raise HTTPException(
                status_code=500,
                detail=f"Error analyzing job: {job_analysis['error']}"
            )
        
        # Get complete user databank
        user_databank = _get_complete_user_databank(current_user, db)
        
        # Validate databank coverage first
        coverage_analysis = ai_service.validate_databank_coverage(job_analysis, user_databank)
        
        # Get gap recommendations
        gap_recommendations = ai_service.identify_databank_gaps(coverage_analysis, job_analysis)
        
        # Convert to response format
        recommendations = [
            GapRecommendationResponse(
                category=rec.category,
                item_type=rec.item_type,
                suggestion=rec.suggestion,
                priority=rec.priority,
                reasoning=rec.reasoning
            )
            for rec in gap_recommendations
        ]
        
        # Calculate priority order and estimated improvement
        priority_order = [rec.category for rec in gap_recommendations if rec.priority == "high"]
        estimated_improvement = {
            "skills_coverage": min(100.0, coverage_analysis.databank_utilization_percentage + len([r for r in gap_recommendations if r.category == "skills" and r.priority == "high"]) * 10),
            "overall_match": min(100.0, coverage_analysis.databank_utilization_percentage + len(gap_recommendations) * 5)
        }
        
        return DatabankEnhancementResponse(
            recommendations=recommendations,
            priority_order=priority_order,
            estimated_improvement=estimated_improvement
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to suggest databank enhancements: {str(e)}"
        )

@router.post("/generate-anti-hallucination-resume", response_model=AntiHallucinationResumeResponse)
def generate_anti_hallucination_resume(
    request: AntiHallucinationResumeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate resume content using ONLY verified databank information.
    This is the core anti-hallucination resume generation endpoint.
    """
    try:
        # Get user's AI configuration
        api_key = None
        provider = current_user.preferred_ai_provider or "openai"
        
        if provider == "openai":
            api_key = current_user.api_key_openai
        elif provider == "anthropic":
            api_key = current_user.api_key_anthropic
        elif provider == "google":
            api_key = current_user.api_key_google
        
        if not api_key:
            raise HTTPException(
                status_code=400,
                detail=f"No API key configured for {provider}. Please add your API key in settings."
            )
        
        # Initialize AI service
        ai_service = AIService(api_key=api_key, provider=provider)
        
        # Analyze job description
        job_analysis = ai_service.analyze_job_description(request.job_description)
        
        if "error" in job_analysis:
            raise HTTPException(
                status_code=500,
                detail=f"Error analyzing job: {job_analysis['error']}"
            )
        
        # Get complete user databank
        user_databank = _get_complete_user_databank(current_user, db)
        
        # Validate databank coverage
        coverage_analysis = ai_service.validate_databank_coverage(job_analysis, user_databank)
        
        # Generate gap recommendations
        gap_recommendations = ai_service.identify_databank_gaps(coverage_analysis, job_analysis)
        
        # Generate anti-hallucination resume
        resume_result = ai_service.generate_anti_hallucination_resume(
            user_databank, 
            job_analysis, 
            coverage_analysis,
            request.max_databank_utilization
        )
        
        if "error" in resume_result:
            raise HTTPException(
                status_code=500,
                detail=f"Error generating resume: {resume_result['error']}"
            )
        
        # Convert recommendations to response format
        enhancement_suggestions = [
            GapRecommendationResponse(
                category=rec.category,
                item_type=rec.item_type,
                suggestion=rec.suggestion,
                priority=rec.priority,
                reasoning=rec.reasoning
            )
            for rec in gap_recommendations
        ]
        
        return AntiHallucinationResumeResponse(
            resume_content=resume_result,
            databank_utilization_report=resume_result.get("databank_utilization_report", {}),
            coverage_analysis=DatabankValidationResponse(
                coverage_summary=coverage_analysis.coverage_summary,
                critical_gaps=coverage_analysis.critical_gaps,
                transferable_skills=coverage_analysis.transferable_skills,
                databank_utilization_percentage=coverage_analysis.databank_utilization_percentage
            ),
            enhancement_suggestions=enhancement_suggestions
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate anti-hallucination resume: {str(e)}"
        )