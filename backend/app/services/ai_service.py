import json
import os
from typing import Dict, List, Optional, Tuple, Any
import requests
from pydantic import BaseModel

class AIProvider:
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GOOGLE = "google"

class AIService:
    """
    Service for AI-powered analysis of job descriptions and resume content.
    Uses a BYOK (Bring Your Own Key) model where users provide their own API keys.
    """
    
    def __init__(self, api_key: str = None, provider: str = AIProvider.OPENAI):
        self.api_key = api_key
        self.provider = provider
    
    def analyze_job_description(self, job_description: str) -> Dict[str, Any]:
        """
        Analyzes a job description to extract key skills, requirements, and other relevant information.
        
        Args:
            job_description: The job description text to analyze
            
        Returns:
            A dictionary containing extracted information like required skills, experience level, etc.
        """
        if not self.api_key:
            raise ValueError("API key is required for job description analysis")
        
        # Prepare prompt for the AI
        prompt = f"""
        Analyze the following job description and extract key information.
        Focus on required skills, experience levels, education requirements, and job responsibilities.
        
        Job Description:
        {job_description}
        
        Extract and categorize the information in JSON format with the following structure:
        {{
            "job_title": "The primary job title",
            "required_skills": ["skill1", "skill2", ...],
            "preferred_skills": ["skill1", "skill2", ...],
            "experience_level": "Entry/Mid/Senior level",
            "education_requirements": ["requirement1", "requirement2", ...],
            "key_responsibilities": ["responsibility1", "responsibility2", ...],
            "industry": "The industry of the job",
            "keywords": ["keyword1", "keyword2", ...]
        }}
        
        Provide only the JSON response without any additional text or explanations.
        """
        
        # Call the appropriate AI provider
        if self.provider == AIProvider.OPENAI:
            return self._call_openai(prompt)
        elif self.provider == AIProvider.ANTHROPIC:
            return self._call_anthropic(prompt)
        elif self.provider == AIProvider.GOOGLE:
            return self._call_google(prompt)
        else:
            raise ValueError(f"Unsupported AI provider: {self.provider}")
    
    def match_skills_to_job(
        self, 
        job_analysis: Dict[str, Any], 
        user_skills: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Match a user's skills to a job's requirements and identify gaps.
        
        Args:
            job_analysis: The analyzed job description data
            user_skills: List of the user's skills with metadata
            
        Returns:
            A dictionary with matching skills, missing skills, and relevance scores
        """
        if not self.api_key:
            raise ValueError("API key is required for skill matching")
        
        # Format the user's skills for the prompt
        user_skills_text = "\n".join([
            f"- {skill['name']} (Category: {skill['category']}, " +
            f"Level: {skill['experience_level']}, " +
            f"Years: {skill['years_of_experience'] or 'Not specified'})" +
            (f", Details: {skill['details']}" if skill.get('details') else "")
            for skill in user_skills
        ])
        
        # Prepare prompt for the AI
        prompt = f"""
        Compare the following job requirements with the user's skills and identify matches and gaps.
        
        Job Requirements:
        Required Skills: {', '.join(job_analysis.get('required_skills', []))}
        Preferred Skills: {', '.join(job_analysis.get('preferred_skills', []))}
        Experience Level: {job_analysis.get('experience_level', 'Not specified')}
        
        User's Skills:
        {user_skills_text}
        
        Analyze the match between the job requirements and user skills. Provide your analysis in JSON format with the following structure:
        {{
            "matching_skills": [
                {{
                    "skill": "skill name",
                    "relevance": "high/medium/low",
                    "notes": "brief note on why this skill is relevant"
                }}
            ],
            "missing_required_skills": ["skill1", "skill2", ...],
            "missing_preferred_skills": ["skill1", "skill2", ...],
            "overall_match_percentage": 85,
            "recommendations": [
                "recommendation1 to improve match",
                "recommendation2 to improve match"
            ]
        }}
        
        Provide only the JSON response without any additional text or explanations.
        """
        
        # Call the appropriate AI provider
        if self.provider == AIProvider.OPENAI:
            return self._call_openai(prompt)
        elif self.provider == AIProvider.ANTHROPIC:
            return self._call_anthropic(prompt)
        elif self.provider == AIProvider.GOOGLE:
            return self._call_google(prompt)
        else:
            raise ValueError(f"Unsupported AI provider: {self.provider}")
    
    def generate_resume_content(
        self,
        user_data: Dict[str, Any],
        job_analysis: Dict[str, Any],
        skill_match: Dict[str, Any]
    ) -> str:
        """
        Generate resume content optimized for the specific job.
        
        Args:
            user_data: The user's profile data including experiences, education, etc.
            job_analysis: The analyzed job description
            skill_match: The skill matching analysis
            
        Returns:
            Optimized resume content as a string
        """
        if not self.api_key:
            raise ValueError("API key is required for resume generation")
        
        # Create a detailed prompt with all the necessary information
        # This would be a long, detailed prompt in a real implementation
        prompt = "Generate resume content based on user data and job analysis..."
        
        # Call the appropriate AI provider
        if self.provider == AIProvider.OPENAI:
            result = self._call_openai(prompt)
        elif self.provider == AIProvider.ANTHROPIC:
            result = self._call_anthropic(prompt)
        elif self.provider == AIProvider.GOOGLE:
            result = self._call_google(prompt)
        else:
            raise ValueError(f"Unsupported AI provider: {self.provider}")
        
        # Process and return the result
        # In a real implementation, this would format the content appropriately
        return result.get("resume_content", "")
    
    def _call_openai(self, prompt: str) -> Dict[str, Any]:
        """Call OpenAI API with the given prompt."""
        try:
            import openai
            openai.api_key = self.api_key
            
            response = openai.ChatCompletion.create(
                model="gpt-4",  # Or another appropriate model
                messages=[
                    {"role": "system", "content": "You are a resume analysis assistant."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2  # Lower temperature for more consistent, factual responses
            )
            
            # Extract and parse the JSON response
            content = response.choices[0].message.content
            return json.loads(content)
        except Exception as e:
            # In production, we'd have more sophisticated error handling
            return {"error": str(e)}
    
    def _call_anthropic(self, prompt: str) -> Dict[str, Any]:
        """Call Anthropic API with the given prompt."""
        try:
            headers = {
                "Content-Type": "application/json",
                "X-API-Key": self.api_key
            }
            
            data = {
                "prompt": f"\n\nHuman: {prompt}\n\nAssistant:",
                "model": "claude-2",  # Or another appropriate model
                "max_tokens_to_sample": 1000,
                "temperature": 0.2
            }
            
            response = requests.post(
                "https://api.anthropic.com/v1/complete",
                headers=headers,
                json=data
            )
            
            if response.status_code == 200:
                content = response.json().get("completion", "")
                return json.loads(content)
            else:
                return {"error": f"API error: {response.status_code}"}
        except Exception as e:
            return {"error": str(e)}
    
    def _call_google(self, prompt: str) -> Dict[str, Any]:
        """Call Google PaLM API with the given prompt."""
        try:
            # This is a placeholder for Google's Generative AI API
            # The actual implementation would use Google's latest API
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}"
            }
            
            data = {
                "prompt": prompt,
                "temperature": 0.2,
                "max_output_tokens": 1000
            }
            
            # This URL would be replaced with the actual Google AI API endpoint
            response = requests.post(
                "https://api.google.ai/v1/models/text-bison:generateText",
                headers=headers,
                json=data
            )
            
            if response.status_code == 200:
                content = response.json().get("candidates", [{}])[0].get("output", "")
                return json.loads(content)
            else:
                return {"error": f"API error: {response.status_code}"}
        except Exception as e:
            return {"error": str(e)}