import json
import os
from typing import Dict, List, Optional, Tuple, Any
import requests
from pydantic import BaseModel
from sqlalchemy.orm import Session

class AIProvider:
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GOOGLE = "google"

class DatabankCoverage(BaseModel):
    """Databank coverage analysis result"""
    coverage_summary: Dict[str, Dict[str, Any]]
    critical_gaps: List[str]
    transferable_skills: List[Dict[str, str]]
    databank_utilization_percentage: float

class GapRecommendation(BaseModel):
    """Recommendation for filling databank gaps"""
    category: str  # skills, experience, education, certifications
    item_type: str
    suggestion: str
    priority: str  # high, medium, low
    reasoning: str

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

    def validate_databank_coverage(
        self, 
        job_analysis: Dict[str, Any], 
        user_databank: Dict[str, Any]
    ) -> DatabankCoverage:
        """
        Validate databank coverage against job requirements.
        Core anti-hallucination function that identifies gaps before generation.
        
        Args:
            job_analysis: Analyzed job description with requirements
            user_databank: Complete user databank (skills, experience, education, etc.)
            
        Returns:
            DatabankCoverage object with detailed analysis
        """
        if not self.api_key:
            raise ValueError("API key is required for databank validation")
        
        # Extract user databank summary
        user_skills = [skill['name'] for skill in user_databank.get('skills', [])]
        user_experience_years = sum([exp.get('years', 0) for exp in user_databank.get('work_experiences', [])])
        user_education = [edu.get('degree', '') for edu in user_databank.get('educations', [])]
        user_certifications = [cert['name'] for cert in user_databank.get('certifications', [])]
        
        # Prepare anti-hallucination validation prompt
        prompt = f"""
        CRITICAL: Perform strict databank coverage validation. Do NOT suggest any content that isn't explicitly in the user's databank.
        
        Job Requirements:
        - Required Skills: {job_analysis.get('required_skills', [])}
        - Preferred Skills: {job_analysis.get('preferred_skills', [])}
        - Experience Level: {job_analysis.get('experience_level', 'Not specified')}
        - Education Requirements: {job_analysis.get('education_requirements', [])}
        
        User's Verified Databank:
        - Skills: {user_skills}
        - Total Experience Years: {user_experience_years}
        - Education: {user_education}
        - Certifications: {user_certifications}
        
        Analyze coverage and identify gaps. Return JSON with this exact structure:
        {{
            "coverage_summary": {{
                "skills": {{
                    "covered": 0,
                    "required": 0,
                    "percentage": 0,
                    "missing_required": [],
                    "missing_preferred": []
                }},
                "experience": {{
                    "meets_requirements": false,
                    "user_years": 0,
                    "required_years": 0,
                    "gap_analysis": ""
                }},
                "education": {{
                    "meets_requirements": false,
                    "user_education": [],
                    "required_education": [],
                    "gaps": []
                }},
                "certifications": {{
                    "relevant_count": 0,
                    "preferred_count": 0,
                    "missing": []
                }}
            }},
            "critical_gaps": [],
            "transferable_skills": [],
            "databank_utilization_percentage": 0
        }}
        
        ONLY analyze what EXISTS in the databank. Do NOT suggest fabricated content.
        """
        
        # Call AI provider
        result = self._call_ai_provider(prompt)
        
        # Parse and validate response
        try:
            coverage_data = result if isinstance(result, dict) else json.loads(result)
            return DatabankCoverage(**coverage_data)
        except Exception as e:
            # Return safe default if parsing fails
            return DatabankCoverage(
                coverage_summary={
                    "skills": {"covered": 0, "required": len(job_analysis.get('required_skills', [])), "percentage": 0, "missing_required": job_analysis.get('required_skills', []), "missing_preferred": job_analysis.get('preferred_skills', [])},
                    "experience": {"meets_requirements": False, "user_years": user_experience_years, "required_years": 0, "gap_analysis": "Unable to analyze"},
                    "education": {"meets_requirements": False, "user_education": user_education, "required_education": job_analysis.get('education_requirements', []), "gaps": []},
                    "certifications": {"relevant_count": 0, "preferred_count": 0, "missing": []}
                },
                critical_gaps=[],
                transferable_skills=[],
                databank_utilization_percentage=0.0
            )

    def identify_databank_gaps(
        self, 
        coverage_analysis: DatabankCoverage, 
        job_analysis: Dict[str, Any]
    ) -> List[GapRecommendation]:
        """
        Generate specific, actionable recommendations for databank improvement.
        
        Args:
            coverage_analysis: Results from validate_databank_coverage
            job_analysis: Original job analysis data
            
        Returns:
            List of prioritized recommendations for databank enhancement
        """
        if not self.api_key:
            raise ValueError("API key is required for gap identification")
        
        prompt = f"""
        Based on the databank coverage analysis, generate specific recommendations for databank enhancement.
        
        Coverage Analysis:
        {coverage_analysis.dict()}
        
        Job Analysis:
        {job_analysis}
        
        Generate actionable recommendations in JSON format:
        {{
            "recommendations": [
                {{
                    "category": "skills|experience|education|certifications",
                    "item_type": "specific type of item to add",
                    "suggestion": "specific item to add to databank",
                    "priority": "high|medium|low",
                    "reasoning": "why this addition would improve job match"
                }}
            ]
        }}
        
        Focus on SPECIFIC, ACTIONABLE items the user can add to their databank.
        Do NOT suggest fabricating experience - only suggest documenting existing skills/experience.
        """
        
        result = self._call_ai_provider(prompt)
        
        try:
            gap_data = result if isinstance(result, dict) else json.loads(result)
            recommendations = []
            for rec in gap_data.get('recommendations', []):
                recommendations.append(GapRecommendation(**rec))
            return recommendations
        except Exception as e:
            return []

    def suggest_transferable_skills(
        self, 
        user_databank: Dict[str, Any], 
        job_requirements: List[str]
    ) -> List[Dict[str, str]]:
        """
        Identify transferable skills from existing databank content.
        
        Args:
            user_databank: User's complete databank
            job_requirements: Required skills from job analysis
            
        Returns:
            List of transferable skill mappings
        """
        if not self.api_key:
            raise ValueError("API key is required for transferable skill analysis")
        
        # Extract detailed user experience for transferable skill analysis
        work_experiences = user_databank.get('work_experiences', [])
        user_skills = user_databank.get('skills', [])
        
        prompt = f"""
        Analyze the user's existing databank to identify transferable skills that match job requirements.
        
        User's Work Experience:
        {json.dumps(work_experiences, indent=2)}
        
        User's Documented Skills:
        {json.dumps(user_skills, indent=2)}
        
        Job Requirements:
        {job_requirements}
        
        Identify transferable skills in JSON format:
        {{
            "transferable_skills": [
                {{
                    "user_skill": "existing skill/experience from databank",
                    "target_skill": "required job skill",
                    "transferability_strength": "high|medium|low",
                    "reasoning": "why this skill transfers"
                }}
            ]
        }}
        
        ONLY identify transfers from EXISTING databank content. Do NOT suggest skills the user doesn't have.
        """
        
        result = self._call_ai_provider(prompt)
        
        try:
            transfer_data = result if isinstance(result, dict) else json.loads(result)
            return transfer_data.get('transferable_skills', [])
        except Exception as e:
            return []

    def generate_anti_hallucination_resume(
        self,
        user_databank: Dict[str, Any],
        job_analysis: Dict[str, Any],
        coverage_analysis: DatabankCoverage,
        max_databank_utilization: bool = True
    ) -> Dict[str, Any]:
        """
        Generate resume content using ONLY verified databank information.
        Enhanced version of generate_resume_content with anti-hallucination enforcement.
        
        Args:
            user_databank: Complete user databank
            job_analysis: Analyzed job description
            coverage_analysis: Databank coverage validation results
            max_databank_utilization: Whether to maximize use of available databank content
            
        Returns:
            Dictionary with resume content and utilization metrics
        """
        if not self.api_key:
            raise ValueError("API key is required for resume generation")
        
        # Create anti-hallucination system prompt
        system_prompt = """
        You are a resume generator with STRICT anti-hallucination protocols.
        
        CRITICAL RULES:
        1. NEVER fabricate or assume any skills, experience, or qualifications
        2. ONLY use information explicitly provided in the user's databank
        3. If required information is missing, note the gap but do NOT create content
        4. Highlight transferable skills from existing databank entries
        5. When gaps exist, provide specific guidance on databank additions needed
        6. Every piece of content must be traceable to a databank entry
        
        Your goal is to create the best possible resume using ONLY verified information.
        """
        
        user_prompt = f"""
        Create a resume using ONLY the following verified databank information:
        
        USER DATABANK:
        {json.dumps(user_databank, indent=2)}
        
        JOB REQUIREMENTS:
        {json.dumps(job_analysis, indent=2)}
        
        COVERAGE ANALYSIS:
        {coverage_analysis.dict()}
        
        Generate resume content in JSON format:
        {{
            "professional_summary": "summary using only databank info",
            "skills_section": {{
                "technical_skills": [],
                "soft_skills": [],
                "tools_technologies": []
            }},
            "experience_section": [
                {{
                    "company": "from databank",
                    "title": "from databank",
                    "duration": "from databank",
                    "achievements": ["only from databank"]
                }}
            ],
            "education_section": [],
            "certifications_section": [],
            "databank_utilization_report": {{
                "content_sources": "list of databank entries used",
                "utilization_percentage": 0,
                "unused_databank_content": [],
                "identified_gaps": []
            }}
        }}
        
        Remember: Every sentence must be traceable to the provided databank.
        """
        
        # Use system prompt for better anti-hallucination enforcement
        result = self._call_ai_provider_with_system(system_prompt, user_prompt)
        
        try:
            resume_data = result if isinstance(result, dict) else json.loads(result)
            return resume_data
        except Exception as e:
            return {
                "error": f"Failed to generate anti-hallucination resume: {str(e)}",
                "databank_utilization_report": {
                    "utilization_percentage": 0,
                    "error": "Generation failed"
                }
            }

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

    def _call_ai_provider(self, prompt: str) -> Dict[str, Any]:
        """Helper method to call the configured AI provider"""
        if self.provider == AIProvider.OPENAI:
            return self._call_openai(prompt)
        elif self.provider == AIProvider.ANTHROPIC:
            return self._call_anthropic(prompt)
        elif self.provider == AIProvider.GOOGLE:
            return self._call_google(prompt)
        else:
            raise ValueError(f"Unsupported AI provider: {self.provider}")

    def _call_ai_provider_with_system(self, system_prompt: str, user_prompt: str) -> Dict[str, Any]:
        """Helper method to call AI provider with system prompt for better anti-hallucination"""
        if self.provider == AIProvider.OPENAI:
            return self._call_openai_with_system(system_prompt, user_prompt)
        elif self.provider == AIProvider.ANTHROPIC:
            return self._call_anthropic_with_system(system_prompt, user_prompt)
        elif self.provider == AIProvider.GOOGLE:
            return self._call_google_with_system(system_prompt, user_prompt)
        else:
            raise ValueError(f"Unsupported AI provider: {self.provider}")

    def _call_openai_with_system(self, system_prompt: str, user_prompt: str) -> Dict[str, Any]:
        """Call OpenAI API with system and user prompts for anti-hallucination."""
        try:
            import openai
            openai.api_key = self.api_key
            
            response = openai.ChatCompletion.create(
                model="gpt-4",  # Or another appropriate model
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.1  # Very low temperature for factual, non-creative responses
            )
            
            # Extract and parse the JSON response
            content = response.choices[0].message.content
            return json.loads(content)
        except Exception as e:
            return {"error": str(e)}

    def _call_anthropic_with_system(self, system_prompt: str, user_prompt: str) -> Dict[str, Any]:
        """Call Anthropic API with system prompt for anti-hallucination."""
        try:
            headers = {
                "Content-Type": "application/json",
                "X-API-Key": self.api_key
            }
            
            # Combine system and user prompts for Anthropic
            combined_prompt = f"{system_prompt}\n\n{user_prompt}"
            
            data = {
                "prompt": f"\n\nHuman: {combined_prompt}\n\nAssistant:",
                "model": "claude-2",  # Or another appropriate model
                "max_tokens_to_sample": 2000,
                "temperature": 0.1  # Very low temperature for factual responses
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

    def _call_google_with_system(self, system_prompt: str, user_prompt: str) -> Dict[str, Any]:
        """Call Google PaLM API with system prompt for anti-hallucination."""
        try:
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}"
            }
            
            # Combine system and user prompts for Google
            combined_prompt = f"{system_prompt}\n\n{user_prompt}"
            
            data = {
                "prompt": combined_prompt,
                "temperature": 0.1,  # Very low temperature for factual responses
                "max_output_tokens": 2000
            }
            
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