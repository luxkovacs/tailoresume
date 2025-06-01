import json
import os
from datetime import datetime
from typing import Dict, List, Optional, Any, Union
from sqlalchemy.orm import Session

from ..models.models import User, Resume, Skill, WorkExperience, Education, Project, Certification, Language
from .resume_schema import generate_jsonld_schema, generate_html_with_jsonld

class ResumeFormat:
    PDF = "pdf"
    WORD = "word"
    LATEX = "latex"
    HTML = "html"

class ResumeGenerator:
    def __init__(self, db: Session):
        self.db = db
    
    def create_resume(
        self,
        user_id: int,
        title: str,
        job_description: str,
        format: str,
        selected_skill_ids: List[int] = None,
        selected_experience_ids: List[int] = None,
        selected_education_ids: List[int] = None,
        selected_project_ids: List[int] = None,
        selected_certification_ids: List[int] = None,
        selected_language_ids: List[int] = None,
        include_summary: bool = True,
        include_skills: bool = True,
        include_experience: bool = True,
        include_education: bool = True,
        include_projects: bool = False,
        include_certifications: bool = False,
        include_languages: bool = False,
        job_title: Optional[str] = None,
        company_name: Optional[str] = None,
    ) -> Resume:
        """
        Create a new resume for a user with selected information.
        """
        # Get the user
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError(f"User with ID {user_id} not found")
        
        # Create timestamps
        now = datetime.utcnow().isoformat()
        
        # Create new resume record
        new_resume = Resume(
            user_id=user_id,
            title=title,
            job_description=job_description,
            job_title=job_title,
            company_name=company_name,
            format=format,
            created_at=now,
            last_modified=now,
            content="",  # Will be populated later
            include_summary=include_summary,
            include_skills=include_skills,
            include_experience=include_experience,
            include_education=include_education,
            include_projects=include_projects,
            include_certifications=include_certifications,
            include_languages=include_languages,
        )
        
        self.db.add(new_resume)
        self.db.flush()  # Get the new resume ID without committing transaction
        
        # Get selected items
        skills = []
        work_experiences = []
        educations = []
        projects = []
        certifications = []
        languages = []
        
        if selected_skill_ids and include_skills:
            skills = self.db.query(Skill).filter(
                Skill.user_id == user_id,
                Skill.id.in_(selected_skill_ids)
            ).all()
            new_resume.skills = skills
        
        if selected_experience_ids and include_experience:
            work_experiences = self.db.query(WorkExperience).filter(
                WorkExperience.user_id == user_id,
                WorkExperience.id.in_(selected_experience_ids)
            ).all()
            new_resume.work_experiences = work_experiences
        
        if selected_education_ids and include_education:
            educations = self.db.query(Education).filter(
                Education.user_id == user_id,
                Education.id.in_(selected_education_ids)
            ).all()
            new_resume.educations = educations
        
        if selected_project_ids and include_projects:
            projects = self.db.query(Project).filter(
                Project.user_id == user_id,
                Project.id.in_(selected_project_ids)
            ).all()
            new_resume.projects = projects
        
        if selected_certification_ids and include_certifications:
            certifications = self.db.query(Certification).filter(
                Certification.user_id == user_id,
                Certification.id.in_(selected_certification_ids)
            ).all()
            new_resume.certifications = certifications
        
        if selected_language_ids and include_languages:
            languages = self.db.query(Language).filter(
                Language.user_id == user_id,
                Language.id.in_(selected_language_ids)
            ).all()
            new_resume.languages = languages
        
        # Generate JSON-LD schema
        jsonld_schema = generate_jsonld_schema(
            user=user,
            resume=new_resume,
            skills=skills,
            work_experiences=work_experiences,
            educations=educations,
            projects=projects,
            certifications=certifications,
            languages=languages
        )
        
        # Store the schema in the resume
        new_resume.schema_jsonld = json.dumps(jsonld_schema)
        
        # Generate the resume content based on format
        content = self._generate_resume_content(
            user=user,
            resume=new_resume,
            jsonld_schema=jsonld_schema,
            skills=skills,
            work_experiences=work_experiences,
            educations=educations,
            projects=projects,
            certifications=certifications,
            languages=languages
        )
        
        new_resume.content = content
        
        # Calculate ATS score
        ats_score, ats_feedback = self._calculate_ats_score(jsonld_schema, job_description)
        new_resume.ats_score = ats_score
        new_resume.ats_feedback = ats_feedback
        
        # Commit the changes
        self.db.commit()
        self.db.refresh(new_resume)
        
        return new_resume
    
    def _generate_resume_content(
        self,
        user: User,
        resume: Resume,
        jsonld_schema: Dict[str, Any],
        skills: List[Skill],
        work_experiences: List[WorkExperience],
        educations: List[Education],
        projects: Optional[List[Project]] = None,
        certifications: Optional[List[Certification]] = None,
        languages: Optional[List[Language]] = None
    ) -> str:
        """
        Generate the resume content based on the selected format.
        For now, returns a placeholder. Will be extended to generate actual content.
        """
        if resume.format == ResumeFormat.HTML:
            # For HTML, we'll generate the HTML with embedded JSON-LD
            return generate_html_with_jsonld(resume, jsonld_schema)
        elif resume.format == ResumeFormat.PDF:
            # For PDF, we'll need to generate the content that will be used to create the PDF
            # This is a placeholder - actual implementation would use a PDF library
            return json.dumps({
                "format": "pdf",
                "schema": jsonld_schema,
                "template": "default"
            })
        elif resume.format == ResumeFormat.WORD:
            # For Word, we'll need to generate the content that will be used to create the document
            # This is a placeholder - actual implementation would use a Word document library
            return json.dumps({
                "format": "word",
                "schema": jsonld_schema,
                "template": "default"
            })
        elif resume.format == ResumeFormat.LATEX:
            # For LaTeX, we'll need to generate the LaTeX code
            # This is a placeholder - actual implementation would generate LaTeX code
            return json.dumps({
                "format": "latex",
                "schema": jsonld_schema,
                "template": "default"
            })
        else:
            # Default to JSON if format is not recognized
            return json.dumps(jsonld_schema, indent=2)
    
    def _calculate_ats_score(
        self,
        jsonld_schema: Dict[str, Any],
        job_description: str
    ) -> tuple[int, str]:
        """
        Calculate an ATS compatibility score based on the resume schema and job description.
        This is a simplified version - a real implementation would use more sophisticated analysis.
        """
        # Initialize score and feedback
        score = 100
        feedback = []
        
        # Check basic structure
        if not jsonld_schema.get("@context"):
            score -= 10
            feedback.append("Missing schema context")
        
        if not jsonld_schema.get("@type"):
            score -= 10
            feedback.append("Missing schema type")
        
        # Check for essential person information
        person = jsonld_schema.get("person", {})
        if not person.get("name"):
            score -= 15
            feedback.append("Missing person name")
        
        if not person.get("email"):
            score -= 10
            feedback.append("Missing email contact")
        
        if not person.get("telephone"):
            score -= 5
            feedback.append("Missing phone contact")
        
        # Check for professional presence
        if not person.get("sameAs"):
            score -= 5
            feedback.append("No professional profiles linked (LinkedIn, GitHub, etc.)")
        
        # Check sections
        if not jsonld_schema.get("description"):
            score -= 5
            feedback.append("No professional summary included")
        
        if not jsonld_schema.get("skills") or len(jsonld_schema.get("skills", [])) == 0:
            score -= 15
            feedback.append("No skills listed")
        
        if not jsonld_schema.get("workExperience") or len(jsonld_schema.get("workExperience", [])) == 0:
            score -= 15
            feedback.append("No work experience listed")
        
        if not jsonld_schema.get("education") or len(jsonld_schema.get("education", [])) == 0:
            score -= 10
            feedback.append("No education history listed")
        
        # Ensure the score stays within 0-100 range
        score = max(0, min(100, score))
        
        # If no issues found, provide positive feedback
        if not feedback:
            feedback.append("Great job! Your resume has excellent ATS compatibility.")
        
        return score, "\n".join(feedback)
    
    def get_resume(self, resume_id: int) -> Optional[Resume]:
        """
        Get a resume by ID.
        """
        return self.db.query(Resume).filter(Resume.id == resume_id).first()
    
    def delete_resume(self, resume_id: int, user_id: int) -> bool:
        """
        Delete a resume by ID if it belongs to the user.
        """
        resume = self.db.query(Resume).filter(
            Resume.id == resume_id,
            Resume.user_id == user_id
        ).first()
        
        if not resume:
            return False
        
        self.db.delete(resume)
        self.db.commit()
        return True