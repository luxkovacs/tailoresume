import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PlusCircle, XCircle, GraduationCap, Edit3, Save, Calendar, MapPin, AlertCircle, CheckCircle, Trash2 } from 'lucide-react';
import { educationsService, Education, EducationCreate, EducationUpdate } from '../../services/api';
import { extractErrorMessage } from '../../utils/errorUtils';

interface EducationSectionProps {
  token: string;
  onUnauthorized: () => void;
}

const EducationSection: React.FC<EducationSectionProps> = ({ token, onUnauthorized }) => {
  const [educations, setEducations] = useState<Education[]>([]);
  const [institution, setInstitution] = useState('');
  const [degree, setDegree] = useState('');
  const [fieldOfStudy, setFieldOfStudy] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isCurrent, setIsCurrent] = useState(false);
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [gpa, setGpa] = useState('');
  const [achievements, setAchievements] = useState('');
  const [activities, setActivities] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editingEducation, setEditingEducation] = useState<Education | null>(null);
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

  const fetchEducations = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const fetchedEducations = await educationsService.getAll<Education[]>({}, apiConfig);
      setEducations(fetchedEducations || []);
    } catch (err: any) {
      handleApiError(err, 'Failed to load education records.');
    }
    setIsLoading(false);
  }, [token, apiConfig, handleApiError]);

  useEffect(() => {
    if (token) {
        fetchEducations();
    }
  }, [fetchEducations, token]);

  const resetForm = () => {
    setInstitution('');
    setDegree('');
    setFieldOfStudy('');
    setStartDate('');
    setEndDate('');
    setIsCurrent(false);
    setCity('');
    setState('');
    setCountry('');
    setGpa('');
    setAchievements('');
    setActivities('');
    setError(null);
    setSuccessMessage(null);
    setEditingEducation(null);
    setShowForm(false);
    setIsSubmitting(false);
  };

  const handleSaveEducation = async () => {
    if (institution.trim() === '' || degree.trim() === '' || fieldOfStudy.trim() === '' || startDate === '') {
      setError('Institution, degree, field of study, and start date are required.');
      return;
    }

    if (isCurrent && endDate) {
      setError('Current education should not have an end date.');
      return;
    }

    if (!isCurrent && !endDate) {
      setError('End date is required for completed education.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const educationData = {
        institution: institution.trim(),
        degree: degree.trim(),
        field_of_study: fieldOfStudy.trim(),
        start_date: startDate,
        end_date: isCurrent ? undefined : (endDate || undefined),
        is_current: isCurrent,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        country: country.trim() || undefined,
        gpa: gpa.trim() || undefined,
        achievements: achievements.trim() || undefined,
        activities: activities.trim() || undefined,
      };

      if (editingEducation) {
        const updatedEducation = await educationsService.update<Education>(
          editingEducation.id, 
          educationData as EducationUpdate,
          apiConfig
        );
        setEducations(educations.map(edu => 
          edu.id === updatedEducation.id ? updatedEducation : edu
        ));
        setSuccessMessage('Education record updated successfully!');
      } else {
        const createdEducation = await educationsService.create<Education>(
          educationData as EducationCreate,
          apiConfig
        );
        setEducations([...educations, createdEducation]);
        setSuccessMessage('Education record added successfully!');
      }
      resetForm();
    } catch (err: any) {
      handleApiError(err, editingEducation ? 'Failed to update education.' : 'Failed to add education.');
    }
    setIsSubmitting(false);
  };

  const handleEditEducation = (educationToEdit: Education) => {
    setEditingEducation(educationToEdit);
    setInstitution(educationToEdit.institution);
    setDegree(educationToEdit.degree);
    setFieldOfStudy(educationToEdit.field_of_study);
    setStartDate(educationToEdit.start_date);
    setEndDate(educationToEdit.end_date || '');
    setIsCurrent(educationToEdit.is_current);
    setCity(educationToEdit.city || '');
    setState(educationToEdit.state || '');
    setCountry(educationToEdit.country || '');
    setGpa(String(educationToEdit.gpa || ''));
    setAchievements(educationToEdit.achievements || '');
    setActivities(educationToEdit.activities || '');
    setShowForm(true);
    setError(null);
    setSuccessMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteEducation = async (educationId: number) => {
    if (!window.confirm('Are you sure you want to delete this education record?')) return;
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await educationsService.delete(educationId, apiConfig);
      setEducations(educations.filter(edu => edu.id !== educationId));
      setSuccessMessage('Education record deleted successfully!');
      if (editingEducation && editingEducation.id === educationId) {
        resetForm();
      }
    } catch (err: any) {
      handleApiError(err, 'Failed to delete education.');
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
    <section id="education-section" className="py-8 mb-8 scroll-mt-20">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white flex items-center">
        <GraduationCap className="w-7 h-7 mr-3 text-indigo-600 dark:text-indigo-400" />
        Education
      </h2>
      
      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6 md:p-8">
        {!showForm && (
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
              setEditingEducation(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            disabled={isSubmitting}
            className="mb-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition duration-150 ease-in-out flex items-center justify-center w-72 disabled:opacity-50"
          >
            <PlusCircle size={20} className="mr-2" />
            Add Education
          </button>
        )}

        {showForm && (
          <form onSubmit={(e) => { e.preventDefault(); handleSaveEducation(); }} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6 mb-6 shadow-md">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {editingEducation ? 'Edit Education' : 'Add New Education'}
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
                <label htmlFor="institution" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Institution *
                </label>
                <input
                  id="institution"
                  type="text"
                  name="institution"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="e.g., Harvard University, MIT"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="degree" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Degree *
                </label>
                <input
                  id="degree"
                  type="text"
                  name="degree"
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
                  placeholder="e.g., Bachelor of Science, Master of Arts"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="fieldOfStudy" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Field of Study *
              </label>
              <input
                id="fieldOfStudy"
                type="text"
                name="fieldOfStudy"
                value={fieldOfStudy}
                onChange={(e) => setFieldOfStudy(e.target.value)}
                placeholder="e.g., Computer Science, Business Administration"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                    <label htmlFor="startDateEdu" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date *</label>
                    <input 
                        id="startDateEdu" 
                        type="date" 
                        name="startDate" 
                        value={startDate} 
                        onChange={(e) => setStartDate(e.target.value)} 
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="endDateEdu" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                    <input 
                        id="endDateEdu" 
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
                            id="is_current_education" 
                            type="checkbox" 
                            name="isCurrentEducation" 
                            checked={isCurrent} 
                            onChange={(e) => setIsCurrent(e.target.checked)} 
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-500 rounded"
                        />
                        <label htmlFor="is_current_education" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">Currently enrolled</label>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                    <label htmlFor="cityEdu" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
                    <input id="cityEdu" type="text" name="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g., Cambridge" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500" />
                </div>
                <div>
                    <label htmlFor="stateEdu" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State/Province</label>
                    <input id="stateEdu" type="text" name="state" value={state} onChange={(e) => setState(e.target.value)} placeholder="e.g., MA" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500" />
                </div>
                <div>
                    <label htmlFor="countryEdu" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Country</label>
                    <input id="countryEdu" type="text" name="country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g., United States" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500" />
                </div>
                <div>
                    <label htmlFor="gpa" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">GPA</label>
                    <input 
                        id="gpa" 
                        type="text" // Changed to text to allow format like 3.8/4.0
                        name="gpa" 
                        value={gpa} 
                        onChange={(e) => setGpa(e.target.value)} 
                        placeholder="e.g., 3.8 or 3.8/4.0"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    />
                </div>
            </div>

            <div className="mb-4">
              <label htmlFor="achievementsEdu" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Achievements/Honors
              </label>
              <textarea
                id="achievementsEdu"
                name="achievements"
                value={achievements}
                onChange={(e) => setAchievements(e.target.value)}
                placeholder="Academic honors, awards, relevant coursework..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="activitiesEdu" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Activities/Societies
              </label>
              <textarea
                id="activitiesEdu"
                name="activities"
                value={activities}
                onChange={(e) => setActivities(e.target.value)}
                placeholder="Clubs, organizations, leadership roles..."
                rows={3}
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
                {isSubmitting ? (editingEducation ? 'Updating...' : 'Saving...') : (editingEducation ? 'Update Education' : 'Save Education')}
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

        {isLoading && educations.length === 0 && !showForm && <p className="text-gray-600 dark:text-gray-400 text-left py-4">Loading education records...</p>}

        {!isLoading && educations.length === 0 && !showForm && (
          <p className="text-gray-500 dark:text-gray-400 italic text-left py-4">No education records added yet. Click "Add Education" to get started.</p>
        )}

        {educations.length > 0 && !showForm && (
          <div className="space-y-6">
            {educations.map((education) => (
              <div 
                key={education.id}
                className="bg-gray-50 dark:bg-gray-700/60 rounded-lg p-4 md:p-6 border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition-shadow duration-150"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg md:text-xl font-semibold text-indigo-700 dark:text-indigo-400">
                      {education.degree} <span className="text-gray-700 dark:text-gray-300 font-normal">in</span> {education.field_of_study}
                    </h3>
                    <p className="text-md text-gray-800 dark:text-gray-200 font-medium">
                      {education.institution}
                    </p>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mt-1">
                      <Calendar size={15} className="mr-1.5 flex-shrink-0" />
                      <span>
                        {formatDate(education.start_date)} - {education.is_current ? 'Present' : formatDate(education.end_date)}
                      </span>
                      {(education.city || education.state || education.country) && (
                        <>
                          <MapPin size={15} className="ml-3 mr-1.5 flex-shrink-0" />
                          <span>
                            {[education.city, education.state, education.country].filter(Boolean).join(', ')}
                          </span>
                        </>
                      )}
                    </div>
                    {education.gpa && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">GPA: {education.gpa}</p>
                    )}
                  </div>
                  
                  <div className="flex gap-2 flex-shrink-0 ml-2">
                    <button
                      onClick={() => handleEditEducation(education)}
                      className="p-1.5 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 rounded-md hover:bg-indigo-100 dark:hover:bg-gray-600 transition-colors"
                      title="Edit education"
                      disabled={isSubmitting}
                    >
                      <Edit3 size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteEducation(education.id)}
                      disabled={isSubmitting}
                      className="p-1.5 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 rounded-md hover:bg-red-100 dark:hover:bg-gray-600 transition-colors"
                      title="Delete education"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                {education.achievements && (
                    <div className="mt-3">
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Achievements/Honors:</h4>
                        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 mt-1 space-y-1 whitespace-pre-line">
                            {education.achievements.split(/\r?\n/).map((item, index) => item.trim() && <li key={index}>{item.trim()}</li>)}
                        </ul>
                    </div>
                )}
                {education.activities && (
                    <div className="mt-3">
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Activities/Societies:</h4>
                        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 mt-1 space-y-1 whitespace-pre-line">
                            {education.activities.split(/\r?\n/).map((item, index) => item.trim() && <li key={index}>{item.trim()}</li>)}
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

export default EducationSection;
