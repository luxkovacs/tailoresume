import React, { useState, useEffect, useCallback, useMemo } from 'react'; // Added useMemo
import {
  BookUser,
  PlusCircle,
  Save,
  XCircle,
  Edit3,
  Trash2,
  AlertCircle,
  CheckCircle,
  Link as LinkIcon,
  Calendar,
  Tag,
} from 'lucide-react';
import {
  projectsService,
  Project,
  ProjectCreate,
  ProjectUpdate,
} from '../../services/api';
import { extractErrorMessage } from '../../utils/errorUtils';

interface ProjectsSectionProps {
  token: string;
  onUnauthorized: () => void;
}

const ProjectsSection: React.FC<ProjectsSectionProps> = ({ token, onUnauthorized }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [formData, setFormData] = useState<ProjectCreate>({
    name: '',
    description: '',
    url: '',
    start_date: '',
    end_date: '',
    is_current: false,
    technologies: '', // Comma-separated string
  });
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const apiConfig = useMemo(() => ({ // Memoize apiConfig
    headers: { Authorization: `Bearer ${token}` },
  }), [token]);  const handleApiError = useCallback((err: any, defaultMessage: string) => {
    if (err.response?.status === 401) {
      onUnauthorized();
      setError('Session expired. Please log in again.');
    } else {
      setError(extractErrorMessage(err, defaultMessage));
    }
    setSuccessMessage(null);
  }, [onUnauthorized]);

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedProjects = await projectsService.getAll<Project[]>(undefined, apiConfig); // Use memoized apiConfig
      setProjects(fetchedProjects);
    } catch (err: any) {
      handleApiError(err, 'Failed to load projects.');
    }
    setIsLoading(false);
  }, [token, apiConfig, handleApiError]); // Added apiConfig to dependencies

  useEffect(() => {
    if (token) {
      fetchProjects();
    }
  }, [fetchProjects, token]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      url: '',
      start_date: '',
      end_date: '',
      is_current: false,
      technologies: '',
    });
    setEditingProject(null);
    setShowForm(false);
    setError(null);
    setSuccessMessage(null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.description) {
      setError('Project name and description are required.');
      return;
    }
    if (formData.is_current && formData.end_date) {
        setError('A current project cannot have an end date.');
        return;
    }
    if (!formData.is_current && !formData.end_date) {
        setError('An end date is required if the project is not current.');
        return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    const projectData = {
        ...formData,
        end_date: formData.is_current ? undefined : formData.end_date,
        technologies: formData.technologies?.trim() ? formData.technologies.split(',').map(t => t.trim()).join(',') : undefined,
    };

    try {
      if (editingProject) {
        const updatedProject = await projectsService.update<Project>(
          editingProject.id,
          projectData as ProjectUpdate,
          apiConfig // Use memoized apiConfig
        );
        setProjects(
          projects.map((p) => (p.id === updatedProject.id ? updatedProject : p))
        );
        setSuccessMessage('Project updated successfully!');
      } else {
        const newProject = await projectsService.create<Project>(
          projectData as ProjectCreate,
          apiConfig // Use memoized apiConfig
        );
        setProjects([...projects, newProject]);
        setSuccessMessage('Project added successfully!');
      }
      resetForm();
    } catch (err: any) {
      handleApiError(err, editingProject ? 'Failed to update project.' : 'Failed to add project.');
    }
    setIsSubmitting(false);
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description,
      url: project.url || '',
      start_date: project.start_date || '',
      end_date: project.end_date || '',
      is_current: project.is_current,
      technologies: project.technologies || '',
    });
    setShowForm(true);
    setError(null);
    setSuccessMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    setIsSubmitting(true); // Use isSubmitting to disable buttons during delete
    setError(null);
    setSuccessMessage(null);
    try {
      await projectsService.delete(id, apiConfig); // Use memoized apiConfig
      setProjects(projects.filter((p) => p.id !== id));
      setSuccessMessage('Project deleted successfully!');
      if (editingProject && editingProject.id === id) {
        resetForm();
      }
    } catch (err: any) {
      handleApiError(err, 'Failed to delete project.');
    }
    setIsSubmitting(false);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString + 'T00:00:00'); // Ensure date is parsed as local
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    } catch {
        return 'Invalid Date';
    }
  };
  
  const parseTechnologies = (techString?: string): string[] => {
    if (!techString) return [];
    return techString.split(',').map(t => t.trim()).filter(t => t);
  };

  return (
    <section id="projects-section" className="py-8 mb-8 scroll-mt-20">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white flex items-center">
        <BookUser className="w-7 h-7 mr-3 text-indigo-600 dark:text-indigo-400" />
        Projects
      </h2>

      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6 md:p-8">
        {!showForm && (
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="mb-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition duration-150 ease-in-out flex items-center justify-center w-72 disabled:opacity-50"
            disabled={isSubmitting}
          >
            <PlusCircle size={20} className="mr-2" />
            Add Project
          </button>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-gray-50 dark:bg-gray-700/50 shadow-md rounded-lg p-6 mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              {editingProject ? 'Edit Project' : 'Add New Project'}
            </h3>

            {error && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 rounded-md flex items-center">
                <AlertCircle size={20} className="mr-2" />
                {error}
              </div>
            )}
            {successMessage && (
              <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-600 text-green-700 dark:text-green-300 rounded-md flex items-center">
                <CheckCircle size={20} className="mr-2" />
                {successMessage}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Project Name *
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., My Awesome App"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Project URL
                </label>
                <input
                  type="url"
                  name="url"
                  id="url"
                  value={formData.url}
                  onChange={handleInputChange}
                  placeholder="e.g., https://myproject.com"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description *
              </label>
              <textarea
                name="description"
                id="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                placeholder="Describe your project, its purpose, and your role."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
              <div>
                <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Date*
                </label>
                <input
                  type="date"
                  name="start_date"
                  id="start_date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  name="end_date"
                  id="end_date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                  disabled={formData.is_current}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                />
              </div>
              <div className="flex items-end">
                <div className="flex items-center h-full">
                    <input
                    type="checkbox"
                    name="is_current"
                    id="is_current"
                    checked={formData.is_current}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-500 rounded"
                    />
                    <label htmlFor="is_current" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Currently working on
                    </label>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label htmlFor="technologies" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Technologies Used
              </label>
              <input
                type="text"
                name="technologies"
                id="technologies"
                value={formData.technologies}
                onChange={handleInputChange}
                placeholder="e.g., React, Node.js, Python (comma-separated)"
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
                {editingProject ? 'Save Changes' : 'Add Project'}
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

        {isLoading && <p className="text-gray-600 dark:text-gray-400 text-left py-4">Loading projects...</p>}
        
        {!isLoading && projects.length === 0 && !showForm && (
          <p className="text-gray-500 dark:text-gray-400 italic text-left py-4">
            No projects added yet. Click "Add Project" to get started.
          </p>
        )}

        {!isLoading && projects.length > 0 && !showForm && (
          <div className="space-y-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-gray-50 dark:bg-gray-700/60 rounded-lg p-6 border border-gray-200 dark:border-gray-600 shadow-sm"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-indigo-700 dark:text-indigo-400">
                      {project.name}
                    </h3>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mt-1">
                      <Calendar size={15} className="mr-1.5 flex-shrink-0" />
                      <span>
                        {formatDate(project.start_date)} - {project.is_current ? 'Present' : formatDate(project.end_date)}
                      </span>
                      {project.url && (
                        <>
                          <span className="mx-2 text-gray-300 dark:text-gray-500">|</span>
                          <a
                            href={project.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline"
                          >
                            <LinkIcon size={15} className="mr-1.5 flex-shrink-0" />
                            View Project
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0 ml-4">
                    <button
                      onClick={() => handleEdit(project)}
                      disabled={isSubmitting}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1 disabled:opacity-50"
                      title="Edit project"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(project.id)}
                      disabled={isSubmitting}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1 disabled:opacity-50"
                      title="Delete project"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <p className="text-gray-700 dark:text-gray-300 mb-3 whitespace-pre-wrap text-sm">
                  {project.description}
                </p>

                {project.technologies && parseTechnologies(project.technologies).length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 flex items-center">
                      <Tag size={14} className="mr-1.5" />
                      Technologies
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {parseTechnologies(project.technologies).map((tech) => (
                        <span
                          key={tech}
                          className="px-2.5 py-0.5 text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 rounded-full font-medium"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
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

export default ProjectsSection;
