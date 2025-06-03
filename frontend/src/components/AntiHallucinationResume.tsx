import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle, TrendingUp, Brain, FileText, Users, Award, Briefcase, GraduationCap } from 'lucide-react';
import { antiHallucinationService, DatabankCoverage, GapRecommendation, AntiHallucinationResumeResponse } from '../services/api';

interface AntiHallucinationResumeProps {
  onUnauthorized: () => void;
}

const AntiHallucinationResume: React.FC<AntiHallucinationResumeProps> = ({ onUnauthorized }) => {
  const [jobDescription, setJobDescription] = useState('');
  const [coverage, setCoverage] = useState<DatabankCoverage | null>(null);
  const [recommendations, setRecommendations] = useState<GapRecommendation[]>([]);
  const [resumeResult, setResumeResult] = useState<AntiHallucinationResumeResponse | null>(null);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'analysis' | 'recommendations' | 'resume'>('analysis');

  const handleAnalyzeDatabank = async () => {
    if (!jobDescription.trim()) {
      setError('Please enter a job description to analyze.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      // Validate databank coverage
      const coverageResult = await antiHallucinationService.validateDatabankCoverage({
        job_description: jobDescription
      });
      setCoverage(coverageResult);

      // Get enhancement recommendations
      const enhancementResult = await antiHallucinationService.suggestDatabankEnhancements({
        job_description: jobDescription
      });
      setRecommendations(enhancementResult.recommendations);

      setActiveTab('analysis');
    } catch (err: any) {
      if (err.response?.status === 401) {
        onUnauthorized();
        setError('Session expired. Please log in again.');
      } else {
        setError(err.response?.data?.detail || 'Failed to analyze databank coverage. Please check your API key configuration.');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateResume = async () => {
    if (!coverage) {
      setError('Please analyze your databank first.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const result = await antiHallucinationService.generateAntiHallucinationResume({
        job_description: jobDescription,
        max_databank_utilization: true
      });
      setResumeResult(result);
      setActiveTab('resume');
    } catch (err: any) {
      if (err.response?.status === 401) {
        onUnauthorized();
        setError('Session expired. Please log in again.');
      } else {
        setError(err.response?.data?.detail || 'Failed to generate resume. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  };
  const getCoverageColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 dark:text-green-400';
    if (percentage >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800';
      case 'medium': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
      case 'low': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'skills': return <Users className="w-4 h-4" />;
      case 'experience': return <Briefcase className="w-4 h-4" />;
      case 'education': return <GraduationCap className="w-4 h-4" />;
      case 'certifications': return <Award className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
        <div className="flex items-center gap-3 mb-2">
          <Brain className="w-8 h-8" />
          <h1 className="text-2xl font-bold">AI Anti-Hallucination Resume Generator</h1>
        </div>
        <p className="text-blue-100">
          Generate resume content using ONLY your verified databank information. Zero fabrication guaranteed.
        </p>
      </div>{/* Job Description Input */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Job Description Analysis</h2>
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the job description here to analyze your databank coverage..."
          className="w-full h-40 p-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 dark:placeholder-gray-400"
        />
        <div className="flex gap-4 mt-4">
          <button
            onClick={handleAnalyzeDatabank}
            disabled={isAnalyzing || !jobDescription.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Analyzing...
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4" />
                Analyze Databank Coverage
              </>
            )}
          </button>
          
          {coverage && (
            <button
              onClick={handleGenerateResume}
              disabled={isGenerating}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  Generate Anti-Hallucination Resume
                </>
              )}
            </button>
          )}
        </div>
      </div>      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
          <XCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0" />
          <span className="text-red-700 dark:text-red-300">{error}</span>
        </div>
      )}

      {/* Results Section */}
      {coverage && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('analysis')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'analysis'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                Coverage Analysis
              </button>
              <button
                onClick={() => setActiveTab('recommendations')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'recommendations'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                Enhancement Suggestions ({recommendations.length})
              </button>
              {resumeResult && (
                <button
                  onClick={() => setActiveTab('resume')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'resume'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  Generated Resume
                </button>
              )}
            </nav>
          </div>          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'analysis' && (
              <div className="space-y-6">
                {/* Overall Coverage */}
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Overall Databank Utilization</h3>
                  <div className="flex items-center gap-4">                    <div className="flex-1">
                      <div className="bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full ${
                            coverage.databank_utilization_percentage >= 80 ? 'bg-green-500' :
                            coverage.databank_utilization_percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${coverage.databank_utilization_percentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <span className={`font-bold ${getCoverageColor(coverage.databank_utilization_percentage)}`}>
                      {coverage.databank_utilization_percentage}%
                    </span>
                  </div>
                </div>                {/* Category Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Skills */}
                  <div className="border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">Skills</h4>
                    </div>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {coverage.coverage_summary.skills.covered}/{coverage.coverage_summary.skills.required}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {coverage.coverage_summary.skills.percentage}% coverage
                    </p>
                  </div>

                  {/* Experience */}
                  <div className="border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Briefcase className="w-5 h-5 text-green-500 dark:text-green-400" />
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">Experience</h4>
                    </div>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {coverage.coverage_summary.experience.meets_requirements ? (
                        <CheckCircle className="w-8 h-8" />
                      ) : (
                        <XCircle className="w-8 h-8" />
                      )}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {coverage.coverage_summary.experience.user_years} years
                    </p>
                  </div>

                  {/* Education */}
                  <div className="border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <GraduationCap className="w-5 h-5 text-purple-500 dark:text-purple-400" />
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">Education</h4>
                    </div>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {coverage.coverage_summary.education.meets_requirements ? (
                        <CheckCircle className="w-8 h-8" />
                      ) : (
                        <XCircle className="w-8 h-8" />                    )}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {coverage.coverage_summary.education.gaps.length} gaps
                    </p>
                  </div>

                  {/* Certifications */}
                  <div className="border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">Certifications</h4>
                    </div>
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {coverage.coverage_summary.certifications.relevant_count}/{coverage.coverage_summary.certifications.preferred_count}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {coverage.coverage_summary.certifications.missing.length} missing
                    </p>
                  </div>
                </div>                {/* Critical Gaps */}
                {coverage.critical_gaps.length > 0 && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400" />
                      <h4 className="font-semibold text-red-800 dark:text-red-300">Critical Gaps</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {coverage.critical_gaps.map((gap, index) => (
                        <span key={index} className="px-3 py-1 bg-red-200 dark:bg-red-800/50 text-red-800 dark:text-red-200 rounded-full text-sm">
                          {gap}
                        </span>
                      ))}
                    </div>
                  </div>
                )}                {/* Transferable Skills */}
                {coverage.transferable_skills.length > 0 && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400" />
                      <h4 className="font-semibold text-green-800 dark:text-green-300">Transferable Skills Found</h4>
                    </div>
                    <div className="space-y-2">
                      {coverage.transferable_skills.map((transfer, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-green-100 dark:bg-green-800/30 rounded">
                          <span className="font-medium text-gray-900 dark:text-gray-100">{transfer.user_skill}</span>
                          <span className="text-green-600 dark:text-green-400">→</span>
                          <span className="text-green-700 dark:text-green-300">{transfer.target_skill}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}            {activeTab === 'recommendations' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Databank Enhancement Recommendations</h3>
                {recommendations.length > 0 ? (
                  <div className="space-y-3">
                    {recommendations.map((rec, index) => (
                      <div key={index} className="border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            {getCategoryIcon(rec.category)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold capitalize text-gray-900 dark:text-gray-100">{rec.category}</h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(rec.priority)}`}>
                                {rec.priority} priority
                              </span>
                            </div>
                            <p className="text-gray-800 dark:text-gray-200 mb-2">{rec.suggestion}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{rec.reasoning}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500 dark:text-green-400" />
                    <p>Your databank appears to have excellent coverage for this job!</p>
                  </div>
                )}
              </div>
            )}            {activeTab === 'resume' && resumeResult && (
              <div className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                    <h4 className="font-semibold text-blue-800 dark:text-blue-300">Anti-Hallucination Guarantee</h4>
                  </div>
                  <p className="text-blue-700 dark:text-blue-300 text-sm">
                    This resume contains ONLY information from your verified databank. 
                    Utilization: {resumeResult.databank_utilization_report.utilization_percentage || 0}%
                  </p>
                </div>

                {/* Resume Content Display */}
                <div className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-6 max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-900 dark:text-gray-100">
                    {JSON.stringify(resumeResult.resume_content, null, 2)}
                  </pre>
                </div>

                {/* Utilization Report */}
                {resumeResult.databank_utilization_report && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Databank Utilization Report</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {resumeResult.databank_utilization_report.content_sources && (
                        <div>
                          <p className="font-medium mb-1 text-gray-900 dark:text-gray-100">Content Sources:</p>
                          <ul className="text-gray-600 dark:text-gray-300 space-y-1">
                            {resumeResult.databank_utilization_report.content_sources.map((source, idx) => (
                              <li key={idx}>• {source}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {resumeResult.databank_utilization_report.unused_databank_content && (
                        <div>
                          <p className="font-medium mb-1 text-gray-900 dark:text-gray-100">Unused Databank Content:</p>
                          <ul className="text-gray-600 dark:text-gray-300 space-y-1">
                            {resumeResult.databank_utilization_report.unused_databank_content.map((item, idx) => (
                              <li key={idx}>• {item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AntiHallucinationResume;
