from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Use absolute imports instead of relative imports
from app.api import auth, users, skills, work_experiences, educations, resumes, api_keys, job_analysis, projects, certifications, languages
from app.core.firebase_auth import init_firebase # Import init_firebase

app = FastAPI(
    title="tailoresume API",
    description="API for managing skills and generating tailored resumes",
    version="0.1.0",
)

# Call init_firebase on startup
@app.on_event("startup")
async def startup_event():
    init_firebase()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(skills.router, prefix="/api/skills", tags=["Skills"])
app.include_router(work_experiences.router, prefix="/api/work-experiences", tags=["Work Experiences"])
app.include_router(educations.router, prefix="/api/educations", tags=["Education"])
app.include_router(projects.router, prefix="/api/projects", tags=["Projects"])
app.include_router(certifications.router, prefix="/api/certifications", tags=["Certifications"])
app.include_router(languages.router, prefix="/api/languages", tags=["Languages"])
app.include_router(resumes.router, prefix="/api/resumes", tags=["Resumes"])
app.include_router(api_keys.router, prefix="/api/api-keys", tags=["API Keys"])
app.include_router(job_analysis.router, prefix="/api/job-analysis", tags=["Job Analysis"])

@app.get("/")
async def root():
    return {"message": "Welcome to tailoresume API!"}