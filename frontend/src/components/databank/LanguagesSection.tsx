import React, { useState, useEffect, useCallback } from 'react';
import { PlusCircle, Save, XCircle, Globe, Edit3, Trash2, Languages as LanguagesIcon } from 'lucide-react';
import { languagesService, Language, LanguageCreate, LanguageUpdate } from '../../services/api'; // Assuming Language, LanguageCreate, LanguageUpdate are exported from api.ts
import { AxiosError } from 'axios';
import { extractErrorMessage } from '../../utils/errorUtils';

const PROFICIENCY_LEVELS = [
  'Native',
  'Fluent',
  'Advanced',
  'Intermediate',
  'Basic'
];

interface LanguagesSectionProps {
  token: string | null;
  onUnauthorized: () => void;
}

const LanguagesSection: React.FC<LanguagesSectionProps> = ({ token, onUnauthorized }) => {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingLanguage, setEditingLanguage] = useState<Language | null>(null);
  
  const [formData, setFormData] = useState<LanguageCreate>({
    name: '',
    proficiency: 'Intermediate'
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchLanguages = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedLanguages = await languagesService.getAll<Language[]>({}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLanguages(fetchedLanguages);
    } catch (err: any) {
      console.error("Failed to load languages:", err);
      if (err.isAxiosError && (err as AxiosError).response?.status === 401) {      onUnauthorized();
      }
      setError(extractErrorMessage(err, 'Failed to load languages. Please try again later.'));
    }
    setIsLoading(false);
  }, [token, onUnauthorized]);

  useEffect(() => {
    if (token) {
      fetchLanguages();
    }
  }, [fetchLanguages, token]);

  const resetFormAndHide = () => {
    setFormData({ name: '', proficiency: 'Intermediate' });
    setEditingLanguage(null);
    setShowForm(false);
    setError(null);
    setSuccessMessage(null);
  };

  const handleAddNewClick = () => {
    resetFormAndHide();
    setShowForm(true);
  };

  const handleEditClick = (language: Language) => {
    setEditingLanguage(language);
    setFormData({
      name: language.name,
      proficiency: language.proficiency,
    });
    setShowForm(true);
    setError(null);
    setSuccessMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim() === '') {
      setError('Language name cannot be empty.');
      return;
    }
    
    // Check for duplicate language name before submitting
    if (!editingLanguage || (editingLanguage && editingLanguage.name.toLowerCase() !== formData.name.toLowerCase())) {
        const duplicate = languages.find(lang => lang.name.toLowerCase() === formData.name.toLowerCase());
        if (duplicate) {
            setError(`A language named "${formData.name}" already exists.`);
            return;
        }
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const headers = { Authorization: `Bearer ${token}` };
      if (editingLanguage) {
        const updatedLanguage = await languagesService.update<Language>(
          editingLanguage.id,
          formData as LanguageUpdate,
          { headers }
        );
        setLanguages(languages.map(l => l.id === editingLanguage.id ? updatedLanguage : l));
        setSuccessMessage('Language updated successfully!');
      } else {
        const newLanguage = await languagesService.create<Language>(
          formData as LanguageCreate,
          { headers }
        );
        setLanguages([...languages, newLanguage]);
        setSuccessMessage('Language added successfully!');
      }
      resetFormAndHide();
      fetchLanguages(); // Re-fetch to ensure data consistency
    } catch (err: any) {
      console.error('Error saving language:', err);
      if (err.isAxiosError && (err as AxiosError).response?.status === 401) {
        onUnauthorized();
      }      const apiError = extractErrorMessage(err, editingLanguage ? 'Failed to update language.' : 'Failed to add language.');
      setError(apiError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this language?')) return;

    setIsSubmitting(true); // Use isSubmitting to disable buttons during delete
    setError(null);
    setSuccessMessage(null);
    try {
      await languagesService.delete(id, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLanguages(languages.filter(l => l.id !== id));
      setSuccessMessage('Language deleted successfully!');
      if (editingLanguage && editingLanguage.id === id) {
        resetFormAndHide();
      }
    } catch (err: any) {
      console.error('Error deleting language:', err);
      if (err.isAxiosError && (err as AxiosError).response?.status === 401) {      onUnauthorized();
      }
      setError(extractErrorMessage(err, 'Failed to delete language.'));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getProficiencyColor = (proficiency: string) => {
    switch (proficiency.toLowerCase()) {
      case 'native':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'fluent':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'advanced':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'basic':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'; // Adjusted dark mode for basic
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <section id="languages-section" className="py-8 mb-8 scroll-mt-20">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white flex items-center">
        <LanguagesIcon className="w-7 h-7 mr-3 text-indigo-600 dark:text-indigo-400" />
        Languages
      </h2>

      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6 md:p-8">
        {!showForm && (
          <button
            onClick={handleAddNewClick}
            className="mb-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition duration-150 ease-in-out flex items-center justify-center w-72 disabled:opacity-50"
            disabled={isSubmitting || isLoading}
          >
            <PlusCircle size={20} className="mr-2" />
            Add Language
          </button>
        )}

        {successMessage && !showForm && (
          <div className="mb-4 p-3 bg-green-100 dark:bg-green-900 border border-green-400 text-green-700 dark:text-green-300 rounded-md text-sm">
            {successMessage}
          </div>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-gray-50 dark:bg-gray-700/50 shadow-md rounded-lg p-6 mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {editingLanguage ? 'Edit Language' : 'Add New Language'}
            </h3>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-300 rounded-md text-sm">
                {error}
              </div>
            )}
             {successMessage && (
              <div className="mb-4 p-3 bg-green-100 dark:bg-green-900 border border-green-400 text-green-700 dark:text-green-300 rounded-md text-sm">
                {successMessage}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="languageName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Language Name *
                </label>
                <input
                  id="languageName"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., English, Spanish"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label htmlFor="proficiency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Proficiency Level *
                </label>
                <select
                  id="proficiency"
                  value={formData.proficiency}
                  onChange={(e) => setFormData({ ...formData, proficiency: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  required
                  disabled={isSubmitting}
                >
                  {PROFICIENCY_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition duration-150 ease-in-out flex items-center disabled:opacity-50"
                disabled={isSubmitting}
              >
                <Save size={20} className="mr-2" />
                {editingLanguage ? 'Save Changes' : 'Save Language'}
              </button>
              <button
                type="button"
                onClick={resetFormAndHide}
                className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition duration-150 ease-in-out flex items-center disabled:opacity-50 ml-3"
                disabled={isSubmitting}
              >
                <XCircle size={20} className="mr-2" />
                Cancel
              </button>
            </div>
          </form>
        )}

        {isLoading && <p className="text-gray-600 dark:text-gray-400">Loading languages...</p>}

        {!isLoading && !showForm && languages.length === 0 && (
          <p className="text-gray-500 dark:text-gray-400 italic text-left py-4">
            No languages added yet. Click "Add Language" to get started.
          </p>
        )}

        {!showForm && languages.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {languages.map((language) => (
              <div key={language.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-150 bg-gray-50 dark:bg-gray-700/50">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Globe size={18} className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                    <h3 className="text-md font-semibold text-gray-800 dark:text-white truncate" title={language.name}>
                      {language.name}
                    </h3>
                  </div>
                  
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleEditClick(language)}
                      title="Edit Language"
                      className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 p-1 rounded-full hover:bg-indigo-100 dark:hover:bg-gray-600 disabled:opacity-50"
                      disabled={isSubmitting}
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(language.id)}
                      title="Delete Language"
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1 rounded-full hover:bg-red-100 dark:hover:bg-gray-600 disabled:opacity-50"
                      disabled={isSubmitting}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${getProficiencyColor(language.proficiency)}`}>
                  {language.proficiency}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default LanguagesSection;
