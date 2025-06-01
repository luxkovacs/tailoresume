import json
from datetime import datetime
from typing import Dict, List, Optional, Any

from ..models.models import User, Resume, Skill, WorkExperience, Education, Project, Certification, Language

def generate_jsonld_schema(
    user: User,
    resume: Resume,
    skills: List[Skill],
    work_experiences: List[WorkExperience],
    educations: List[Education],
    projects: Optional[List[Project]] = None,
    certifications: Optional[List[Certification]] = None,
    languages: Optional[List[Language]] = None
) -> Dict[str, Any]:
    """
    Generate JSON-LD schema for a resume following the resume-standard.
    This makes the resume more ATS-friendly.
    """
    # Base schema
    schema = {
        "@context": "https://schema.org/",
        "@type": "Resume",
        "identifier": f"resume-{resume.id}",
        "dateCreated": resume.created_at,
        "dateModified": resume.last_modified or resume.created_at,
        "name": resume.title,
    }
    
    # Add person information
    schema["person"] = {
        "@type": "Person",
        "name": user.full_name or user.username,
        "email": user.email,
    }
    
    # Add optional person information if available
    if user.phone:
        schema["person"]["telephone"] = user.phone
    
    if user.website:
        schema["person"]["url"] = user.website
    
    if any([user.city, user.state, user.country, user.postal_code]):
        schema["person"]["address"] = {
            "@type": "PostalAddress",
        }
        if user.city:
            schema["person"]["address"]["addressLocality"] = user.city
        if user.state:
            schema["person"]["address"]["addressRegion"] = user.state
        if user.country:
            schema["person"]["address"]["addressCountry"] = user.country
        if user.postal_code:
            schema["person"]["address"]["postalCode"] = user.postal_code
    
    # Add social profiles if available
    social_profiles = []
    if user.linkedin:
        social_profiles.append({
            "@type": "ProfilePage",
            "name": "LinkedIn",
            "url": user.linkedin
        })
    if user.github:
        social_profiles.append({
            "@type": "ProfilePage",
            "name": "GitHub",
            "url": user.github
        })
    if user.twitter:
        social_profiles.append({
            "@type": "ProfilePage",
            "name": "Twitter",
            "url": user.twitter
        })
    
    if social_profiles:
        schema["person"]["sameAs"] = social_profiles
    
    # Add summary if available and included
    if user.summary and resume.include_summary:
        schema["description"] = user.summary
    
    # Add skills if included
    if resume.include_skills and skills:
        schema["skills"] = []
        for skill in skills:
            skill_obj = {
                "@type": "DefinedTerm",
                "name": skill.name,
                "termCode": skill.category
            }
            
            # Add additional skill metadata if available
            if skill.experience_level:
                skill_obj["competencyLevel"] = skill.experience_level.value
            
            if skill.years_of_experience:
                skill_obj["experienceYears"] = skill.years_of_experience
                
            if skill.keywords:
                skill_obj["keywords"] = skill.keywords.split(",")
                
            schema["skills"].append(skill_obj)
    
    # Add work experiences if included
    if resume.include_experience and work_experiences:
        schema["workExperience"] = []
        for exp in work_experiences:
            exp_obj = {
                "@type": "OrganizationRole",
                "name": exp.job_title,
                "startDate": exp.start_date.isoformat(),
                "memberOf": {
                    "@type": "Organization",
                    "name": exp.company
                }
            }
            
            # Add end date if not current position
            if not exp.is_current and exp.end_date:
                exp_obj["endDate"] = exp.end_date.isoformat()
            
            # Add location if available
            if any([exp.city, exp.state, exp.country]):
                exp_obj["location"] = {
                    "@type": "Place",
                    "address": {
                        "@type": "PostalAddress"
                    }
                }
                if exp.city:
                    exp_obj["location"]["address"]["addressLocality"] = exp.city
                if exp.state:
                    exp_obj["location"]["address"]["addressRegion"] = exp.state
                if exp.country:
                    exp_obj["location"]["address"]["addressCountry"] = exp.country
            
            # Add description and responsibilities
            if exp.description:
                exp_obj["description"] = exp.description
                
            if exp.responsibilities:
                # Handle responsibilities as a list if it's stored as JSON
                try:
                    responsibilities = json.loads(exp.responsibilities)
                    if isinstance(responsibilities, list):
                        exp_obj["responsibilities"] = responsibilities
                    else:
                        exp_obj["responsibilities"] = [exp.responsibilities]
                except json.JSONDecodeError:
                    # If it's not valid JSON, treat it as a single string
                    exp_obj["responsibilities"] = [exp.responsibilities]
            
            # Add achievements if available
            if exp.achievements:
                try:
                    achievements = json.loads(exp.achievements)
                    if isinstance(achievements, list):
                        exp_obj["achievements"] = achievements
                    else:
                        exp_obj["achievements"] = [exp.achievements]
                except json.JSONDecodeError:
                    exp_obj["achievements"] = [exp.achievements]
            
            schema["workExperience"].append(exp_obj)
    
    # Add education if included
    if resume.include_education and educations:
        schema["education"] = []
        for edu in educations:
            edu_obj = {
                "@type": "EducationalOccupationalCredential",
                "name": edu.degree,
                "credentialCategory": edu.field_of_study,
                "startDate": edu.start_date.isoformat(),
                "educationalInstitution": {
                    "@type": "EducationalOrganization",
                    "name": edu.institution
                }
            }
            
            # Add end date if not current education
            if not edu.is_current and edu.end_date:
                edu_obj["endDate"] = edu.end_date.isoformat()
            
            # Add location if available
            if any([edu.city, edu.state, edu.country]):
                edu_obj["location"] = {
                    "@type": "Place",
                    "address": {
                        "@type": "PostalAddress"
                    }
                }
                if edu.city:
                    edu_obj["location"]["address"]["addressLocality"] = edu.city
                if edu.state:
                    edu_obj["location"]["address"]["addressRegion"] = edu.state
                if edu.country:
                    edu_obj["location"]["address"]["addressCountry"] = edu.country
            
            # Add GPA if available
            if edu.gpa:
                edu_obj["gpa"] = edu.gpa
                
            # Add achievements and activities if available
            if edu.achievements:
                try:
                    achievements = json.loads(edu.achievements)
                    if isinstance(achievements, list):
                        edu_obj["achievements"] = achievements
                    else:
                        edu_obj["achievements"] = [edu.achievements]
                except json.JSONDecodeError:
                    edu_obj["achievements"] = [edu.achievements]
                    
            if edu.activities:
                try:
                    activities = json.loads(edu.activities)
                    if isinstance(activities, list):
                        edu_obj["activities"] = activities
                    else:
                        edu_obj["activities"] = [edu.activities]
                except json.JSONDecodeError:
                    edu_obj["activities"] = [edu.activities]
            
            schema["education"].append(edu_obj)
    
    # Add projects if included
    if resume.include_projects and projects:
        schema["projects"] = []
        for project in projects:
            project_obj = {
                "@type": "CreativeWork",
                "name": project.name,
                "description": project.description
            }
            
            # Add URL if available
            if project.url:
                project_obj["url"] = project.url
            
            # Add dates if available
            if project.start_date:
                project_obj["startDate"] = project.start_date.isoformat()
                
            if not project.is_current and project.end_date:
                project_obj["endDate"] = project.end_date.isoformat()
            
            # Add technologies if available
            if project.technologies:
                try:
                    technologies = json.loads(project.technologies)
                    if isinstance(technologies, list):
                        project_obj["keywords"] = technologies
                    else:
                        project_obj["keywords"] = project.technologies.split(",")
                except json.JSONDecodeError:
                    project_obj["keywords"] = project.technologies.split(",")
            
            schema["projects"].append(project_obj)
    
    # Add certifications if included
    if resume.include_certifications and certifications:
        schema["certifications"] = []
        for cert in certifications:
            cert_obj = {
                "@type": "EducationalOccupationalCredential",
                "name": cert.name,
                "credentialCategory": "certification",
                "validFrom": cert.issue_date.isoformat(),
                "educationalInstitution": {
                    "@type": "Organization",
                    "name": cert.issuing_organization
                }
            }
            
            # Add expiration date if available
            if cert.expiration_date:
                cert_obj["validUntil"] = cert.expiration_date.isoformat()
            
            # Add credential ID and URL if available
            if cert.credential_id:
                cert_obj["credentialId"] = cert.credential_id
                
            if cert.credential_url:
                cert_obj["url"] = cert.credential_url
            
            schema["certifications"].append(cert_obj)
    
    # Add languages if included
    if resume.include_languages and languages:
        schema["knowsLanguage"] = []
        for lang in languages:
            lang_obj = {
                "@type": "Language",
                "name": lang.name,
                "proficiencyLevel": lang.proficiency
            }
            schema["knowsLanguage"].append(lang_obj)
    
    return schema

def generate_html_with_jsonld(
    resume: Resume,
    jsonld_schema: Dict[str, Any]
) -> str:
    """
    Generate HTML document with embedded JSON-LD metadata.
    This is critical for ATS compatibility.
    """
    # Convert JSON-LD to string
    jsonld_str = json.dumps(jsonld_schema, indent=2)
    
    # Create basic HTML structure with embedded JSON-LD
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{resume.title}</title>
    <script type="application/ld+json">
{jsonld_str}
    </script>
</head>
<body>
    <!-- 
    This document contains structured data in JSON-LD format that follows the resume-standard.
    This makes it more compatible with Applicant Tracking Systems (ATS).
    The visual content of the resume would be rendered here based on the selected template.
    -->
    <div class="resume-content">
        <!-- Content would be inserted here based on the resume template -->
    </div>
</body>
</html>"""
    
    return html