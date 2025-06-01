from sqlalchemy import Column, Integer, String, ForeignKey, Table, Enum, Text, Date, Boolean
from sqlalchemy.orm import relationship
from enum import Enum as PyEnum

from ..core.database import Base

# Enum for experience levels
class ExperienceLevel(str, PyEnum):
    BEGINNER = "Beginner"
    INTERMEDIATE = "Intermediate"
    ADVANCED = "Advanced"
    EXPERT = "Expert"

# Association table for many-to-many relationship between skills and resumes
skill_resume_association = Table(
    'skill_resume',
    Base.metadata,
    Column('skill_id', Integer, ForeignKey('skills.id')),
    Column('resume_id', Integer, ForeignKey('resumes.id'))
)

# Association table for work experiences and resumes
work_experience_resume_association = Table(
    'work_experience_resume',
    Base.metadata,
    Column('work_experience_id', Integer, ForeignKey('work_experiences.id')),
    Column('resume_id', Integer, ForeignKey('resumes.id'))
)

# Association table for educations and resumes
education_resume_association = Table(
    'education_resume',
    Base.metadata,
    Column('education_id', Integer, ForeignKey('educations.id')),
    Column('resume_id', Integer, ForeignKey('resumes.id'))
)

# Association table for projects and resumes
project_resume_association = Table(
    'project_resume',
    Base.metadata,
    Column('project_id', Integer, ForeignKey('projects.id')),
    Column('resume_id', Integer, ForeignKey('resumes.id'))
)

# Association table for certifications and resumes
certification_resume_association = Table(
    'certification_resume',
    Base.metadata,
    Column('certification_id', Integer, ForeignKey('certifications.id')),
    Column('resume_id', Integer, ForeignKey('resumes.id'))
)

# Association table for languages and resumes
language_resume_association = Table(
    'language_resume',
    Base.metadata,
    Column('language_id', Integer, ForeignKey('languages.id')),
    Column('resume_id', Integer, ForeignKey('resumes.id'))
)

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    
    # Personal information for resume-standard
    full_name = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    website = Column(String, nullable=True)
    linkedin = Column(String, nullable=True)
    github = Column(String, nullable=True)
    twitter = Column(String, nullable=True)
    
    # Location information
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    country = Column(String, nullable=True)
    postal_code = Column(String, nullable=True)
    
    # Profile information
    summary = Column(Text, nullable=True)
    
    # API key management (BYOK model)
    api_key_openai = Column(String, nullable=True)
    api_key_anthropic = Column(String, nullable=True)
    api_key_google = Column(String, nullable=True)
    preferred_ai_provider = Column(String, nullable=True, default="openai")  # 'openai', 'anthropic', 'google'
    
    # Relationships
    skills = relationship("Skill", back_populates="user")
    resumes = relationship("Resume", back_populates="user")
    work_experiences = relationship("WorkExperience", back_populates="user")
    educations = relationship("Education", back_populates="user")
    projects = relationship("Project", back_populates="user")
    certifications = relationship("Certification", back_populates="user")
    languages = relationship("Language", back_populates="user")

class Skill(Base):
    __tablename__ = "skills"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    category = Column(String, index=True)  # e.g., programming language, software, methodology
    experience_level = Column(Enum(ExperienceLevel, values_callable=lambda obj: [e.value for e in obj]))
    years_of_experience = Column(Integer, nullable=True)
    details = Column(Text, nullable=True)
    keywords = Column(String, nullable=True)  # Comma-separated keywords for better ATS matching
    user_id = Column(Integer, ForeignKey("users.id"))
    
    # Relationships
    user = relationship("User", back_populates="skills")
    resumes = relationship("Resume", secondary=skill_resume_association, back_populates="skills")

class WorkExperience(Base):
    __tablename__ = "work_experiences"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    # Required fields
    company = Column(String)
    job_title = Column(String)
    start_date = Column(Date)
    end_date = Column(Date, nullable=True)  # Null for current positions
    is_current = Column(Boolean, default=False)
    
    # Location information
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    country = Column(String, nullable=True)
    
    # Details
    description = Column(Text, nullable=True)
    responsibilities = Column(Text, nullable=True)  # Could be JSON list or text
    achievements = Column(Text, nullable=True)  # Could be JSON list or text
    
    # Relationships
    user = relationship("User", back_populates="work_experiences")
    resumes = relationship("Resume", secondary=work_experience_resume_association, back_populates="work_experiences")

class Education(Base):
    __tablename__ = "educations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    # Required fields
    institution = Column(String)
    degree = Column(String)
    field_of_study = Column(String)
    start_date = Column(Date)
    end_date = Column(Date, nullable=True)  # Null for current education
    is_current = Column(Boolean, default=False)
    
    # Location information
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    country = Column(String, nullable=True)
    
    # Additional details
    gpa = Column(String, nullable=True)
    achievements = Column(Text, nullable=True)  # Could be JSON list or text
    activities = Column(Text, nullable=True)  # Could be JSON list or text
    
    # Relationships
    user = relationship("User", back_populates="educations")
    resumes = relationship("Resume", secondary=education_resume_association, back_populates="educations")

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    # Project details
    name = Column(String)
    description = Column(Text)
    url = Column(String, nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    is_current = Column(Boolean, default=False)
    
    # Technologies/skills used
    technologies = Column(Text, nullable=True)  # Could be JSON list or comma-separated
    
    # Relationships
    user = relationship("User", back_populates="projects")
    resumes = relationship("Resume", secondary=project_resume_association, back_populates="projects")

class Certification(Base):
    __tablename__ = "certifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    # Certification details
    name = Column(String)
    issuing_organization = Column(String)
    issue_date = Column(Date)
    expiration_date = Column(Date, nullable=True)
    credential_id = Column(String, nullable=True)
    credential_url = Column(String, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="certifications")
    resumes = relationship("Resume", secondary=certification_resume_association, back_populates="certifications")

class Language(Base):
    __tablename__ = "languages"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    # Language details
    name = Column(String)
    proficiency = Column(String)  # e.g., Native, Fluent, Intermediate, Basic
    
    # Relationships
    user = relationship("User", back_populates="languages")
    resumes = relationship("Resume", secondary=language_resume_association, back_populates="languages")

class Resume(Base):
    __tablename__ = "resumes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    # Resume metadata
    title = Column(String, index=True)
    created_at = Column(String)  # Will store ISO format datetime
    last_modified = Column(String)  # Will store ISO format datetime
    
    # Job targeting
    job_description = Column(Text, nullable=True)
    job_title = Column(String, nullable=True)
    company_name = Column(String, nullable=True)
    
    # Output format and content
    format = Column(String)  # e.g., PDF, Word, LaTeX
    content = Column(Text)  # Could be JSON or formatted template data
    
    # ATS compatibility score and metadata
    ats_score = Column(Integer, nullable=True)
    ats_feedback = Column(Text, nullable=True)
    
    # Resume sections configuration (what to include)
    include_summary = Column(Boolean, default=True)
    include_skills = Column(Boolean, default=True)
    include_experience = Column(Boolean, default=True)
    include_education = Column(Boolean, default=True)
    include_projects = Column(Boolean, default=False)
    include_certifications = Column(Boolean, default=False)
    include_languages = Column(Boolean, default=False)
    
    # Resume Schema JSON-LD data
    schema_jsonld = Column(Text, nullable=True)  # Store the JSON-LD for ATS compatibility
    
    # Relationships
    user = relationship("User", back_populates="resumes")
    skills = relationship("Skill", secondary=skill_resume_association, back_populates="resumes")
    work_experiences = relationship("WorkExperience", secondary=work_experience_resume_association, back_populates="resumes")
    educations = relationship("Education", secondary=education_resume_association, back_populates="resumes")
    projects = relationship("Project", secondary=project_resume_association, back_populates="resumes")
    certifications = relationship("Certification", secondary=certification_resume_association, back_populates="resumes")
    languages = relationship("Language", secondary=language_resume_association, back_populates="resumes")