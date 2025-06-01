import json
from typing import Dict, List, Tuple, Any, Optional

class ATSValidator:
    """
    A service to validate resume JSON-LD against ATS standards and provide feedback.
    This helps users understand how to improve their resume's ATS compatibility.
    """
    
    def __init__(self):
        # Define the essential JSON-LD properties for ATS compatibility
        self.essential_properties = {
            "base": ["@context", "@type", "identifier", "name"],
            "person": ["name", "email"],
            "sections": ["skills", "workExperience", "education"]
        }
        
        # Define recommended properties that improve ATS compatibility
        self.recommended_properties = {
            "person": ["telephone", "address", "url"],
            "workExperience": ["startDate", "endDate", "description", "responsibilities"],
            "education": ["startDate", "endDate", "credentialCategory"]
        }
    
    def validate_schema(self, schema_json: str) -> Tuple[int, List[str], List[str]]:
        """
        Validate the JSON-LD schema against ATS best practices.
        Returns a score, a list of critical issues, and a list of recommendations.
        """
        try:
            # Parse JSON-LD
            schema = json.loads(schema_json)
        except json.JSONDecodeError:
            return 0, ["Invalid JSON-LD schema"], []
        
        # Validate schema and gather feedback
        score = 100
        critical_issues = []
        recommendations = []
        
        # Check base properties
        for prop in self.essential_properties["base"]:
            if prop not in schema:
                score -= 10
                critical_issues.append(f"Missing essential property: {prop}")
        
        # Check person information
        person = schema.get("person", {})
        for prop in self.essential_properties["person"]:
            if prop not in person:
                score -= 15
                critical_issues.append(f"Missing essential person property: {prop}")
        
        for prop in self.recommended_properties["person"]:
            if prop not in person:
                score -= 5
                recommendations.append(f"Add {prop} to improve ATS compatibility")
        
        # Check essential sections
        for section in self.essential_properties["sections"]:
            if section not in schema or not schema.get(section):
                score -= 15
                critical_issues.append(f"Missing or empty {section} section")
        
        # Check work experience details
        work_experiences = schema.get("workExperience", [])
        if work_experiences:
            for i, exp in enumerate(work_experiences):
                for prop in self.recommended_properties["workExperience"]:
                    if prop not in exp:
                        score -= 2
                        recommendations.append(f"Add {prop} to work experience #{i+1}")
        
        # Check education details
        educations = schema.get("education", [])
        if educations:
            for i, edu in enumerate(educations):
                for prop in self.recommended_properties["education"]:
                    if prop not in edu:
                        score -= 2
                        recommendations.append(f"Add {prop} to education #{i+1}")
        
        # Check for job-specific keywords
        # This would be expanded in a real implementation
        
        # Cap score between 0 and 100
        score = max(0, min(100, score))
        
        return score, critical_issues, recommendations
    
    def analyze_resume_for_job(self, resume_schema_json: str, job_description: str) -> Dict[str, Any]:
        """
        Analyze how well a resume matches a specific job description.
        This is a placeholder for NLP-based analysis.
        """
        # In a real implementation, this would use NLP to analyze the match
        # between resume content and job description
        
        # Placeholder result
        return {
            "match_score": 70,
            "missing_keywords": ["team leadership", "agile development"],
            "suggestions": [
                "Consider highlighting team leadership experience more prominently",
                "Add details about agile development methodology experience"
            ]
        }
    
    def get_improvement_steps(self, score: int, critical_issues: List[str], recommendations: List[str]) -> List[str]:
        """
        Generate actionable steps to improve resume ATS compatibility based on validation results.
        """
        steps = []
        
        # Add critical issues as high-priority steps
        for issue in critical_issues:
            steps.append(f"CRITICAL: {issue}")
        
        # Add recommendations as medium-priority steps
        for rec in recommendations:
            steps.append(f"RECOMMENDED: {rec}")
        
        # Add general advice based on score
        if score < 50:
            steps.append("Your resume needs significant improvements for ATS compatibility")
        elif score < 75:
            steps.append("Your resume meets basic ATS requirements but could be improved")
        else:
            steps.append("Your resume has good ATS compatibility")
        
        return steps