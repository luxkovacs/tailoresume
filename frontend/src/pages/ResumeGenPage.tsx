import React, { useState, useEffect } from 'react';
import { jobAnalysisService, resumesService, skillsService, workExperiencesService, educationsService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import AntiHallucinationResume from '../components/AntiHallucinationResume';
import { Brain, FileText } from 'lucide-react';

interface Skill { id: number; name: string; level: string; category?: string; }
interface WorkExperience { id: number; title: string; company: string; start_date: string; end_date?: string; description?: string; }
interface Education { id: number; degree: string; institution: string; start_date: string; end_date?: string; }

const ResumeGenPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [mode, setMode] = useState<'traditional' | 'anti-hallucination'>('anti-hallucination');
  const [jobDescription, setJobDescription] = useState('');
  const [analysis, setAnalysis] = useState<{ matched_skills: Skill[]; missing_skills: string[] } | null>(null);  const [selectedSkillIds, setSelectedSkillIds] = useState<number[]>([]);
  const [selectedExperienceIds, setSelectedExperienceIds] = useState<number[]>([]);  const [selectedEducationIds, setSelectedEducationIds] = useState<number[]>([]);
  // Skills loaded from API - used for future enhancements and validation
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [skills, setSkills] = useState<Skill[]>([]);
  const [experiences, setExperiences] = useState<WorkExperience[]>([]);
  const [educations, setEducations] = useState<Education[]>([]);
  const [atsScore, setAtsScore] = useState<number | null>(null);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  // Fetch user data on mount
  useEffect(() => {
    if (!currentUser) {
      setDataLoading(false);
      return;
    }
    
    const fetchData = async () => {
      setDataLoading(true);
      
      try {
        // Fetch skills with error handling
        try {
          const skillsData = await skillsService.getAll<Skill[]>();
          if (Array.isArray(skillsData)) {
            setSkills(skillsData);
          } else {
            console.warn('Skills data is not an array:', skillsData);
            setSkills([]);
          }
        } catch (skillsError) {
          console.error('Error fetching skills:', skillsError);
          setSkills([]);
        }
        
        // Fetch work experiences with error handling
        try {
          const experiencesData = await workExperiencesService.getAll<WorkExperience[]>();
          if (Array.isArray(experiencesData)) {
            setExperiences(experiencesData);
          } else {
            console.warn('Experiences data is not an array:', experiencesData);
            setExperiences([]);
          }
        } catch (experiencesError) {
          console.error('Error fetching work experiences:', experiencesError);
          setExperiences([]);
        }
        
        // Fetch educations with error handling
        try {
          const educationsData = await educationsService.getAll<Education[]>();
          if (Array.isArray(educationsData)) {
            setEducations(educationsData);
          } else {
            console.warn('Educations data is not an array:', educationsData);
            setEducations([]);
          }
        } catch (educationsError) {
          console.error('Error fetching educations:', educationsError);
          setEducations([]);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load your profile data. Please refresh the page.');
      } finally {
        setDataLoading(false);
      }
    };
    
    fetchData();
  }, [currentUser]);
  // Analyze job description
  const handleAnalyze = async () => {
    if (!jobDescription.trim()) {
      setError('Please enter a job description to analyze.');
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysis(null);
    setAtsScore(null);
    setResumeUrl(null);
    
    try {
      const result = await jobAnalysisService.create<{ matched_skills: Skill[]; missing_skills: string[] }>({ 
        job_description: jobDescription 
      });
      
      // Defensive coding - ensure response has expected format
      if (result && typeof result === 'object') {
        const matchedSkills = Array.isArray(result.matched_skills) ? result.matched_skills : [];
        const missingSkills = Array.isArray(result.missing_skills) ? result.missing_skills : [];
        
        setAnalysis({
          matched_skills: matchedSkills,
          missing_skills: missingSkills
        });
        
        // Only select skills that are valid (have an id and exist in our skills array)
        const validSkillIds = matchedSkills
          .filter(skill => typeof skill === 'object' && 'id' in skill && typeof skill.id === 'number')
          .map(skill => skill.id);
          
        setSelectedSkillIds(validSkillIds);
      } else {
        throw new Error('Invalid response format from job analysis service');
      }
    } catch (err) {
      console.error('Job analysis error:', err);
      setError('Failed to analyze job description. Please try again or check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  // Generate resume
  const handleGenerateResume = async () => {
    if (selectedSkillIds.length === 0) {
      setError('Please select at least one skill to include in your resume.');
      return;
    }
    
    setLoading(true);
    setError(null);
    setAtsScore(null);
    setResumeUrl(null);
    try {
      const result = await resumesService.create<{ resume_url: string; ats_score: number }>({
        job_description: jobDescription,
        selected_skill_ids: selectedSkillIds,
        selected_experience_ids: selectedExperienceIds,
        selected_education_ids: selectedEducationIds
      });
      
      // Defensive coding - ensure response has expected format
      if (result && typeof result === 'object') {
        // Check for resume_url property and ensure it's a string
        const url = typeof result.resume_url === 'string' ? result.resume_url : null;
        
        // Check for ats_score property and ensure it's a number
        let score: number | null = null;
        if ('ats_score' in result) {
          const rawScore = result.ats_score;
          if (typeof rawScore === 'number') {
            score = rawScore;
          } else if (typeof rawScore === 'string') {
            // Try to parse string to number
            const parsedScore = parseFloat(rawScore);
            score = isNaN(parsedScore) ? null : parsedScore;
          }
        }
        
        setResumeUrl(url);
        setAtsScore(score);
        
        if (!url) {
          setError('Resume was generated but the download URL is missing.');
        }
      } else {
        throw new Error('Invalid response format from resume generation service');
      }
    } catch (err) {
      console.error('Resume generation error:', err);
      setError('Failed to generate resume. Please try again or check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle skill selection
  const toggleSkill = (id: number) => {
    setSelectedSkillIds(ids => ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]);
  };
  
  // Toggle experience selection
  const toggleExperience = (id: number) => {
    setSelectedExperienceIds(ids => ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]);
  };
  
  // Toggle education selection
  const toggleEducation = (id: number) => {
    setSelectedEducationIds(ids => ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]);
  };
  const handleUnauthorized = () => {
    // Handle unauthorized access - could redirect to login or show message
    setError('Session expired. Please log in again.');
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">Generate Tailored Resume</h1>
          {/* Mode Selection */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mb-6">
          <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">Choose Generation Mode</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setMode('anti-hallucination')}
              className={`p-4 border-2 rounded-lg text-left transition-all ${
                mode === 'anti-hallucination'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <Brain className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <h3 className="font-semibold text-blue-600 dark:text-blue-400">Anti-Hallucination Mode</h3>
                <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs px-2 py-1 rounded-full">Recommended</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Uses ONLY your verified databank information. Zero fabrication guaranteed. 
                Identifies gaps and suggests databank improvements.
              </p>
            </button>
            
            <button
              onClick={() => setMode('traditional')}
              className={`p-4 border-2 rounded-lg text-left transition-all ${
                mode === 'traditional'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <FileText className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                <h3 className="font-semibold text-gray-600 dark:text-gray-300">Traditional Mode</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Classic resume generation with manual skill and experience selection. 
                May include AI-enhanced content.
              </p>
            </button>
          </div>
        </div>
      </div>
        {!currentUser ? (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300 px-4 py-3 rounded mb-4">
          Please log in to generate a resume.
        </div>      ) : dataLoading && mode === 'traditional' ? (
        <div className="text-center py-8 text-gray-600 dark:text-gray-300">Loading your profile data...</div>
      ) : mode === 'anti-hallucination' ? (
        <AntiHallucinationResume onUnauthorized={handleUnauthorized} />
      ) : (        <>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Paste Job Description</h2>
            <textarea
              className="w-full min-h-[120px] p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 dark:placeholder-gray-400"
              value={jobDescription}
              onChange={e => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
            />
            <button
              onClick={handleAnalyze}
              disabled={loading || !jobDescription.trim()}
              className="mt-3 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md shadow hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
            >
              {loading ? 'Analyzing...' : 'Analyze Job Description'}
            </button>
          </div>          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3 mb-6">
              <span className="text-red-700 dark:text-red-300">{error}</span>
            </div>
          )}          {analysis && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Skill Match</h2>
              
              <div className="mb-4">
                <span className="font-medium text-gray-900 dark:text-gray-100">Matched Skills:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {Array.isArray(analysis.matched_skills) && analysis.matched_skills.map(skill => (
                    typeof skill === 'object' && skill !== null && 'id' in skill && 'name' in skill ? (
                      <button
                        key={skill.id}
                        onClick={() => toggleSkill(skill.id)}
                        className={`px-3 py-1 rounded-full border transition-colors ${selectedSkillIds.includes(skill.id) ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-transparent' : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                      >
                        {typeof skill.name === 'string' ? skill.name : `Skill ${skill.id}`}
                      </button>
                    ) : null
                  ))}
                    {(!Array.isArray(analysis.matched_skills) || analysis.matched_skills.length === 0) && (
                    <div className="text-gray-500 dark:text-gray-400">No matching skills found.</div>
                  )}
                </div>
              </div>
              
              {Array.isArray(analysis.missing_skills) && analysis.missing_skills.length > 0 && (
                <div className="mb-4">
                  <span className="font-medium text-gray-900 dark:text-gray-100">Missing Skills:</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {analysis.missing_skills.map((skill, index) => (
                      <span key={index} className="px-3 py-1 rounded-full bg-yellow-200 dark:bg-yellow-900/30 text-yellow-900 dark:text-yellow-300">
                        {typeof skill === 'string' ? skill : JSON.stringify(skill)}
                      </span>
                    ))}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Add missing skills to your profile if you have them!
                  </div>
                </div>              )}
            </div>
          )}          {/* Experience selection */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Select Work Experience</h2>
            <div className="flex flex-wrap gap-2">
              {Array.isArray(experiences) && experiences.map(exp => (
                <button
                  key={exp.id}
                  onClick={() => toggleExperience(exp.id)}
                  className={`px-3 py-1 rounded-full border transition-colors ${selectedExperienceIds.includes(exp.id) ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-transparent' : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                >
                  {exp.title} @ {exp.company}
                </button>
              ))}              {(!Array.isArray(experiences) || experiences.length === 0) && (
                <div className="text-gray-500 dark:text-gray-400">No work experiences found. Add some to your profile first.</div>
              )}
            </div>
          </div>

          {/* Education selection */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Select Education</h2>
            <div className="flex flex-wrap gap-2">
              {Array.isArray(educations) && educations.map(edu => (
                <button
                  key={edu.id}
                  onClick={() => toggleEducation(edu.id)}
                  className={`px-3 py-1 rounded-full border transition-colors ${selectedEducationIds.includes(edu.id) ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-transparent' : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                >
                  {edu.degree} @ {edu.institution}
                </button>              ))}
              {(!Array.isArray(educations) || educations.length === 0) && (
                <div className="text-gray-500 dark:text-gray-400">No education records found. Add some to your profile first.</div>
              )}
            </div>
          </div>

          <button
            onClick={handleGenerateResume}
            disabled={loading || !selectedSkillIds.length || !selectedExperienceIds.length}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md shadow hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 text-lg font-semibold"
          >
            {loading ? 'Generating Resume...' : 'Generate Resume'}
          </button>

          {/* ATS Score and Download */}
          {atsScore !== null && (
            <div className="mt-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow flex items-center gap-4">
              <div>
                <span className="block text-lg font-bold text-gray-900 dark:text-white">ATS Score:</span>
                <span className="block text-3xl font-extrabold text-blue-600 dark:text-blue-400">{atsScore}</span>
              </div>
              <div className="flex-1">
                <div className="text-gray-700 dark:text-gray-300">A higher score means your resume is more likely to be parsed correctly by Applicant Tracking Systems (ATS).</div>
              </div>
              {resumeUrl && typeof resumeUrl === 'string' && (
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md shadow hover:from-blue-700 hover:to-purple-700"
                >
                  Download Resume
                </a>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ResumeGenPage;