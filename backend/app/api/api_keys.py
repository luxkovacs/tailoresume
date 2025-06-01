from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session

from ..models.models import User
from ..core.auth import get_current_user
from ..core.database import get_db

router = APIRouter()

class APIKeyUpdate(BaseModel):
    api_key_openai: Optional[str] = None
    api_key_anthropic: Optional[str] = None
    api_key_google: Optional[str] = None
    preferred_ai_provider: Optional[str] = None

class APIKeyResponse(BaseModel):
    preferred_ai_provider: Optional[str]
    has_openai_key: bool
    has_anthropic_key: bool
    has_google_key: bool

    class Config:
        orm_mode = True

@router.get("/", response_model=APIKeyResponse)
def get_api_keys(current_user: User = Depends(get_current_user)):
    """
    Get information about the user's API keys.
    For security reasons, we don't return the actual keys, just whether they exist.
    """
    return {
        "preferred_ai_provider": current_user.preferred_ai_provider,
        "has_openai_key": bool(current_user.api_key_openai),
        "has_anthropic_key": bool(current_user.api_key_anthropic),
        "has_google_key": bool(current_user.api_key_google)
    }

@router.put("/", response_model=APIKeyResponse)
def update_api_keys(
    api_keys: APIKeyUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update the user's API keys."""
    # Update only the fields that were provided
    if api_keys.api_key_openai is not None:
        current_user.api_key_openai = api_keys.api_key_openai

    if api_keys.api_key_anthropic is not None:
        current_user.api_key_anthropic = api_keys.api_key_anthropic

    if api_keys.api_key_google is not None:
        current_user.api_key_google = api_keys.api_key_google

    if api_keys.preferred_ai_provider is not None:
        valid_providers = ["openai", "anthropic", "google"]
        if api_keys.preferred_ai_provider not in valid_providers:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid AI provider. Must be one of: {', '.join(valid_providers)}"
            )
        current_user.preferred_ai_provider = api_keys.preferred_ai_provider

    db.commit()
    
    return {
        "preferred_ai_provider": current_user.preferred_ai_provider,
        "has_openai_key": bool(current_user.api_key_openai),
        "has_anthropic_key": bool(current_user.api_key_anthropic),
        "has_google_key": bool(current_user.api_key_google)
    }

@router.delete("/")
def delete_api_keys(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete all of the user's API keys."""
    current_user.api_key_openai = None
    current_user.api_key_anthropic = None
    current_user.api_key_google = None
    db.commit()
    
    return {"message": "All API keys have been deleted"}