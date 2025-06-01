import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PlusCircle, XCircle, Briefcase, Edit3, Save, Calendar, MapPin, AlertCircle, CheckCircle } from 'lucide-react';
import { workExperiencesService, WorkExperience, WorkExperienceCreate, WorkExperienceUpdate } from '../../services/api';
import { extractErrorMessage } from '../../utils/errorUtils';

interface WorkExperienceSectionProps {
  token: string;
  onUnauthorized: () => void;
}

const WorkExperienceSection: React.FC<WorkExperienceSectionProps> = ({ token, onUnauthorized }) => {
  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([]);
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isCurrent, setIsCurrent] = useState(false);
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [description, setDescription] = useState('');
  const [responsibilities, setResponsibilities] = useState('');
  const [achievements, setAchievements] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editingExperience, setEditingExperience] = useState<WorkExperience | null>(null);
  const [showForm, setShowForm] = useState(false);

  const apiConfig = useMemo(() => ({
    headers: { Authorization: `Bearer ${token}` },
  }), [token]);
  const handleApiError = useCallback((err: any, defaultMessage: string) => {
    console.error(defaultMessage, err);
    if (err.response?.status === 401) {
      onUnauthorized();
      setError('Session expired. Please log in again.');
    } else {
      setError(extractErrorMessage(err, defaultMessage));
    }
    setSuccessMessage(null);
  }, [onUnauthorized]);

  const fetchWorkExperiences = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const fetchedExperiences = await workExperiencesService.getAll<WorkExperience[]>({}, apiConfig);
      setWorkExperiences(fetchedExperiences || []);
    } catch (err: any) {
      handleApiError(err, 'Failed to load work experiences.');
    }
    setIsLoading(false);
  }, [token, apiConfig, handleApiError]);

  useEffect(() => {
    if (token) {
        fetchWorkExperiences();
    }
  }, [fetchWorkExperiences, token]);

  const resetForm = () => {
    setCompany('');
    setJobTitle('');
    setStartDate('');
    setEndDate('');
    setIsCurrent(false);
    setCity('');
    setState('');
    setCountry('');
    setDescription('');
    setResponsibilities('');
    setAchievements('');
    setError(null);
    setSuccessMessage(null);
    setEditingExperience(null);
    setShowForm(false);
    setIsSubmitting(false);
  };

  const handleSaveExperience = async () => {
    if (company.trim() === '' || jobTitle.trim() === '' || startDate === '') {
      setError('Company, job title, and start date are required.');
      return;
    }

    if (isCurrent && endDate) {
      setError('Current position should not have an end date.');
      return;
    }

    if (!isCurrent && !endDate) {
      setError('End date is required for past positions.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const experienceData = {
        company: company.trim(),
        job_title: jobTitle.trim(),
        start_date: startDate,
        end_date: isCurrent ? undefined : (endDate || undefined),
        is_current: isCurrent,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        country: country.trim() || undefined,
        description: description.trim() || undefined,
        responsibilities: responsibilities.trim() || undefined,
        achievements: achievements.trim() || undefined,
      };

      if (editingExperience) {
        const updatedExperience = await workExperiencesService.update<WorkExperience>(
          editingExperience.id, 
          experienceData as WorkExperienceUpdate,
          apiConfig
        );
        setWorkExperiences(workExperiences.map(exp => 
          exp.id === updatedExperience.id ? updatedExperience : exp
        ));
        setSuccessMessage('Work experience updated successfully!');
      } else {
        const createdExperience = await workExperiencesService.create<WorkExperience>(
          experienceData as WorkExperienceCreate,
          apiConfig
        );
        setWorkExperiences([...workExperiences, createdExperience]);
        setSuccessMessage('Work experience added successfully!');
      }
      resetForm();
    } catch (err: any) {
      handleApiError(err, editingExperience ? 'Failed to update experience.' : 'Failed to add experience.');
    }
    setIsSubmitting(false);
  };

  const handleEditExperience = (experienceToEdit: WorkExperience) => {
    setEditingExperience(experienceToEdit);
    setCompany(experienceToEdit.company);
    setJobTitle(experienceToEdit.job_title);
    setStartDate(experienceToEdit.start_date);
    setEndDate(experienceToEdit.end_date || '');
    setIsCurrent(experienceToEdit.is_current);
    setCity(experienceToEdit.city || '');
    setState(experienceToEdit.state || '');
    setCountry(experienceToEdit.country || '');
    setDescription(experienceToEdit.description || '');
    setResponsibilities(experienceToEdit.responsibilities || '');
    setAchievements(experienceToEdit.achievements || '');
    setShowForm(true);
    setError(null);
    setSuccessMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteExperience = async (experienceId: number) => {
    if (!window.confirm('Are you sure you want to delete this work experience?')) return;
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await workExperiencesService.delete(experienceId, apiConfig);
      setWorkExperiences(workExperiences.filter(exp => exp.id !== experienceId));
      setSuccessMessage('Work experience deleted successfully!');
      if (editingExperience && editingExperience.id === experienceId) {
        resetForm();
      }
    } catch (err: any) {
      handleApiError(err, 'Failed to delete experience.');
    }
    setIsSubmitting(false);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString + 'T00:00:00');
        return date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short' 
        });
    } catch {
        return 'Invalid Date';
    }
  };

  return (
    <section id="work-experience-section" className="py-8 mb-8 scroll-mt-20">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white flex items-center">
        <Briefcase className="w-7 h-7 mr-3 text-indigo-600 dark:text-indigo-400" />
        Work Experience
      </h2>
      
      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6 md:p-8">
        {!showForm && (
          <button
            onClick={() => {
              resetForm(); 
              setShowForm(true);
              setEditingExperience(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            disabled={isSubmitting}
            className="mb-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition duration-150 ease-in-out flex items-center justify-center w-72 disabled:opacity-50"
          >
            <PlusCircle size={20} className="mr-2" />
            Add Work Experience
          </button>
        )}

        {showForm && (
          <form onSubmit={(e) => { e.preventDefault(); handleSaveExperience(); }} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6 mb-6 shadow-md">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {editingExperience ? 'Edit Work Experience' : 'Add New Work Experience'}
            </h3>

            {error && (
              <div className="my-4 p-3 bg-red-100 dark:bg-red-700/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 rounded-md flex items-center text-sm">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}
            {successMessage && (
              <div className="my-4 p-3 bg-green-100 dark:bg-green-700/30 border border-green-400 dark:border-green-600 text-green-700 dark:text-green-300 rounded-md flex items-center text-sm">
                <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                <p>{successMessage}</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Company *
                </label>
                <input
                  id="company"
                  type="text"
                  name="company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g., Google, Microsoft"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Job Title *
                </label>
                <input
                  id="jobTitle"
                  type="text"
                  name="jobTitle"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g., Software Engineer, Product Manager"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date *</label>
                    <input 
                        id="startDate" 
                        type="date" 
                        name="startDate" 
                        value={startDate} 
                        onChange={(e) => setStartDate(e.target.value)} 
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                    <input 
                        id="endDate" 
                        type="date" 
                        name="endDate" 
                        value={endDate} 
                        onChange={(e) => setEndDate(e.target.value)} 
                        disabled={isCurrent} 
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-50"
                    />
                </div>
                <div className="flex items-end pb-1"> 
                    <div className="flex items-center">
                        <input 
                            id="is_current_work"
                            type="checkbox" 
                            name="isCurrent" 
                            checked={isCurrent} 
                            onChange={(e) => setIsCurrent(e.target.checked)} 
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-500 rounded"
                        />
                        <label htmlFor="is_current_work" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">Current position</label>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
                    <input id="city" type="text" name="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g., San Francisco" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500" />
                </div>
                <div>
                    <label htmlFor="state_province" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State/Province</label>
                    <input id="state_province" type="text" name="state" value={state} onChange={(e) => setState(e.target.value)} placeholder="e.g., CA" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500" />
                </div>
                <div>
                    <label htmlFor="country_work" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Country</label>
                    <input id="country_work" type="text" name="country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g., United States" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500" />
                </div>
            </div>

            <div className="mb-4">
              <label htmlFor="description_work" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                id="description_work"
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of your role..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="responsibilities_work" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Key Responsibilities
              </label>
              <textarea
                id="responsibilities_work"
                name="responsibilities"
                value={responsibilities}
                onChange={(e) => setResponsibilities(e.target.value)}
                placeholder="List your main responsibilities..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="achievements_work" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Key Achievements
              </label>
              <textarea
                id="achievements_work"
                name="achievements"
                value={achievements}
                onChange={(e) => setAchievements(e.target.value)}
                placeholder="Highlight your achievements and impact..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition duration-150 ease-in-out flex items-center disabled:opacity-50"
              >
                <Save size={20} className="mr-2" />
                {isSubmitting ? (editingExperience ? 'Updating...' : 'Saving...') : (editingExperience ? 'Update Experience' : 'Save Experience')}
              </button>
              
              <button
                type="button"
                onClick={resetForm}
                disabled={isSubmitting}
                className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition duration-150 ease-in-out flex items-center disabled:opacity-50"
              >
                <XCircle size={20} className="mr-2" />
                Cancel
              </button>
            </div>
          </form>
        )}

        {isLoading && workExperiences.length === 0 && !showForm && <p className="text-gray-600 dark:text-gray-400 text-left py-4">Loading work experiences...</p>}

        {!isLoading && workExperiences.length === 0 && !showForm && (
          <p className="text-gray-500 dark:text-gray-400 italic text-left py-4">No work experience added yet. Click "Add Work Experience" to get started.</p>
        )}

        {workExperiences.length > 0 && !showForm && (
          <div className="space-y-6">
            {workExperiences.map((experience) => (
              <div 
                key={experience.id}
                className="bg-gray-50 dark:bg-gray-700/60 rounded-lg p-4 md:p-6 border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition-shadow duration-150"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg md:text-xl font-semibold text-indigo-700 dark:text-indigo-400">
                      {experience.job_title}
                    </h3>
                    <p className="text-md text-gray-800 dark:text-gray-200 font-medium">
                      {experience.company}
                    </p>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mt-1">
                      <Calendar size={15} className="mr-1.5 flex-shrink-0" />
                      <span>
                        {formatDate(experience.start_date)} - {experience.is_current ? 'Present' : formatDate(experience.end_date)}
                      </span>
                      {(experience.city || experience.state || experience.country) && (
                        <>
                          <MapPin size={15} className="ml-3 mr-1.5 flex-shrink-0" />
                          <span>
                            {[experience.city, experience.state, experience.country].filter(Boolean).join(', ')}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 flex-shrink-0 ml-2">
                    <button
                      onClick={() => handleEditExperience(experience)}
                      className="p-1.5 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 rounded-md hover:bg-indigo-100 dark:hover:bg-gray-600 transition-colors"
                      title="Edit experience"
                      disabled={isSubmitting}
                    >
                      <Edit3 size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteExperience(experience.id)}
                      disabled={isSubmitting}
                      className="p-1.5 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 rounded-md hover:bg-red-100 dark:hover:bg-gray-600 transition-colors"
                      title="Delete experience"
                    >
                      <XCircle size={18} />
                    </button>
                  </div>
                </div>
                {experience.description && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 whitespace-pre-line">{experience.description}</p>
                )}
                {experience.responsibilities && (
                    <div className="mt-3">
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Responsibilities:</h4>
                        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 mt-1 space-y-1 whitespace-pre-line">
                            {experience.responsibilities.split(/\r?\n/).map((item, index) => item.trim() && <li key={index}>{item.trim()}</li>)}
                        </ul>
                    </div>
                )}
                {experience.achievements && (
                    <div className="mt-3">
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Achievements:</h4>
                        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 mt-1 space-y-1 whitespace-pre-line">
                            {experience.achievements.split(/\r?\n/).map((item, index) => item.trim() && <li key={index}>{item.trim()}</li>)}
                        </ul>
                    </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default WorkExperienceSection;
