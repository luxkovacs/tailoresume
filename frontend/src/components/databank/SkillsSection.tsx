import React, { useState, useEffect, useCallback, FormEvent, useMemo } from 'react'; // Added useMemo
import { PlusCircle, Wrench, Save, XCircle, Edit3, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { skillsService, Skill as ApiSkill, SkillCreate as ApiSkillCreate, SkillUpdate as ApiSkillUpdate, ExperienceLevel } from '../../services/api';
import { extractErrorMessage } from '../../utils/errorUtils';

// Use the API's ExperienceLevel directly
const experienceLevelOptions = Object.values(ExperienceLevel);

// Use API types directly
interface Skill extends ApiSkill {}
interface SkillCreate extends ApiSkillCreate {}
interface SkillUpdate extends ApiSkillUpdate {}

interface SkillsSectionProps {
  token: string;
  onUnauthorized: () => void;
}

const SkillsSection: React.FC<SkillsSectionProps> = ({ token, onUnauthorized }) => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<SkillCreate>({
    name: '',
    experience_level: ExperienceLevel.BEGINNER, // Default value
  });
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [isLoading, setIsLoading] = useState(false); // For fetching data
  const [isSubmitting, setIsSubmitting] = useState(false); // For form submission (create/update)
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const getProficiencyColor = (proficiency: string) => {
    switch (proficiency.toLowerCase()) {
      case 'expert':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'advanced':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'beginner':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const apiConfig = useMemo(() => ({ // Memoize apiConfig
    headers: { Authorization: `Bearer ${token}` },
  }), [token]);

  const fetchSkills = useCallback(async () => {
    setIsLoading(true);
    setError(null);    try {
      const fetchedSkills = await skillsService.getAll<Skill[]>({}, apiConfig); // Use memoized apiConfig
      setSkills(fetchedSkills || []); // Ensure skills is always an array
    } catch (err: any) {
      console.error("Failed to load skills:", err);
      setError(extractErrorMessage(err, 'Failed to load skills.'));
      if (err.response?.status === 401) {
        onUnauthorized();
      }
    }
    setIsLoading(false);
  }, [token, onUnauthorized, apiConfig]); // Added apiConfig to dependencies

  useEffect(() => {
    if (token) { // Only fetch if token is present
      fetchSkills();
    }
  }, [fetchSkills, token]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({ name: '', experience_level: ExperienceLevel.BEGINNER });
    setEditingSkill(null);
    setShowForm(false);
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (formData.name.trim() === '') {
      setError('Skill name cannot be empty.');
      return;
    }

    const trimmedName = formData.name.trim();
    const skillPayload = { ...formData, name: trimmedName };

    // Check for duplicate skill name, excluding the current skill being edited
    const duplicateExists = skills.some(
      (skill) =>
        skill.name.toLowerCase() === trimmedName.toLowerCase() &&
        (!editingSkill || skill.id !== editingSkill.id)
    );

    if (duplicateExists) {
      setError('A skill with this name already exists.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (editingSkill) {
        const skillToUpdate: SkillUpdate = {
          name: skillPayload.name,
          experience_level: skillPayload.experience_level,
          // Include other fields from SkillUpdate if they exist and are managed by the form
        };
        const updatedSkill = await skillsService.update<Skill>(editingSkill.id, skillToUpdate, apiConfig); // Use memoized apiConfig
        setSkills(skills.map(s => s.id === updatedSkill.id ? updatedSkill : s));
        setSuccessMessage("Skill updated successfully!");
      } else {
        const createdSkill = await skillsService.create<Skill>(skillPayload, apiConfig); // Use memoized apiConfig
        setSkills([...skills, createdSkill]);
        setSuccessMessage("Skill added successfully!");      }
      resetForm();
      // Optionally, re-fetch all skills to ensure data consistency, though optimistic updates are often sufficient.
      // await fetchSkills(); 
    } catch (err: any) {
      console.error(editingSkill ? "Failed to update skill:" : "Failed to add skill:", err);
      setError(extractErrorMessage(err, editingSkill ? 'Failed to update skill.' : 'Failed to add skill.'));
      if (err.response?.status === 401) {
        onUnauthorized();
      }
    }
    setIsSubmitting(false);
  };

  const handleEditSkill = (skillToEdit: Skill) => {
    setEditingSkill(skillToEdit);
    setFormData({ name: skillToEdit.name, experience_level: skillToEdit.experience_level });
    setError(null);
    setSuccessMessage(null);
    setShowForm(true);
  };

  const handleDeleteSkill = async (skillIdToDelete: number) => {
    if (!window.confirm('Are you sure you want to delete this skill?')) return;

    // Consider using a specific loading state for delete if it can happen while other things are loading/submitting
    // For simplicity, we use isSubmitting here to disable buttons during delete as well.
    setIsSubmitting(true); 
    setError(null);
    setSuccessMessage(null);
    try {
      await skillsService.delete(skillIdToDelete, apiConfig); // Use memoized apiConfig
      setSkills(skills.filter(skill => skill.id !== skillIdToDelete));
      setSuccessMessage("Skill deleted successfully!");
      if (editingSkill && editingSkill.id === skillIdToDelete) {
        resetForm(); // Reset form if the skill being edited was deleted
      }    } catch (err: any) {
      console.error("Failed to delete skill:", err);
      setError(extractErrorMessage(err, 'Failed to delete skill.'));
      if (err.response?.status === 401) {
        onUnauthorized();
      }
    }
    setIsSubmitting(false);
  };

  return (
    <section id="skills-section" className="py-8 mb-8 scroll-mt-20">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white flex items-center">
        <Wrench className="w-7 h-7 mr-3 text-indigo-600 dark:text-indigo-400" />
        Skills
      </h2>

      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6 md:p-8">
        {!showForm && (
          <button
            onClick={() => {
              resetForm(); // Ensure form is clean before showing
              setShowForm(true);
              setEditingSkill(null); // Ensure not in edit mode
            }}
            className="mb-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition duration-150 ease-in-out flex items-center justify-center w-72 disabled:opacity-50"
          >
            <PlusCircle size={20} className="mr-2" />
            Add Skill
          </button>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 p-6 bg-gray-50 dark:bg-gray-700/50 shadow-md rounded-lg">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {editingSkill ? 'Edit Skill' : 'Add New Skill'}
            </h3>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Skill Name
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Python, React, Project Management"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 italic"
                  required
                />
              </div>
              <div>
                <label htmlFor="experience_level" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Proficiency Level
                </label>
                <select
                  name="experience_level"
                  id="experience_level"
                  value={formData.experience_level}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="" disabled>Select proficiency</option>
                  {experienceLevelOptions.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-start">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition duration-150 ease-in-out flex items-center disabled:opacity-50"
              >
                <Save size={20} className="mr-2" />
                {isSubmitting ? (editingSkill ? 'Updating...' : 'Saving...') : (editingSkill ? 'Update Skill' : 'Save Skill')}
              </button>
              <button
                type="button"
                onClick={resetForm}
                disabled={isSubmitting}
                className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition duration-150 ease-in-out flex items-center disabled:opacity-50 ml-3"
              >
                <XCircle size={20} className="mr-2" />
                Cancel
              </button>
            </div>
          </form>
        )}

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

        {/* Display loading message only when fetching and no skills are yet shown and form is not open */} 
        {isLoading && skills.length === 0 && !showForm && (
          <p className="py-4 text-gray-600 dark:text-gray-400 text-left italic">Loading skills...</p>
        )}
        {/* Display no skills message if not loading, no error, no skills, and form is not open */}
        {!isLoading && !error && skills.length === 0 && !showForm && (
          <p className="text-gray-500 dark:text-gray-400 italic text-left py-4">
            No skills added yet. Click "Add Skill" to get started.
          </p>
        )}

        {skills.length > 0 && !showForm && (
          <div className="mt-6 flex flex-wrap gap-3">            {skills.map((skill) => (
              <div
                key={skill.id}
                className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-sm font-medium pl-3 pr-1 py-2 rounded-lg shadow-sm group relative hover:shadow-md transition-shadow"
              >
                <span
                  className="cursor-pointer group-hover:text-gray-900 dark:group-hover:text-gray-50"
                  onClick={() => handleEditSkill(skill)}
                  title="Edit skill"
                >
                  {skill.name}
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${getProficiencyColor(skill.experience_level)}`}>
                    {skill.experience_level}
                  </span>
                </span>
                <button
                  onClick={() => handleDeleteSkill(skill.id)}
                  disabled={isSubmitting}
                  className="ml-2 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 focus:outline-none opacity-50 group-hover:opacity-100 transition-all disabled:opacity-30"
                  aria-label={`Remove ${skill.name}`}
                  title={`Remove ${skill.name}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default SkillsSection;
