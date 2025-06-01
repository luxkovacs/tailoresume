import React, { useEffect, useState } from 'react';
import SkillsSection from '../components/databank/SkillsSection';
import WorkExperienceSection from '../components/databank/WorkExperienceSection';
import EducationSection from '../components/databank/EducationSection';
import ProjectsSection from '../components/databank/ProjectsSection';
import CertificationsSection from '../components/databank/CertificationsSection';
import LanguagesSection from '../components/databank/LanguagesSection';
import { BookUser, Briefcase, GraduationCap, Lightbulb, Award, Languages as LanguagesIcon, Settings, LogOut, UserCircle, FileText, Brain, Database } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const sectionComponents: Record<string, React.ElementType> = {
  skills: SkillsSection,
  experience: WorkExperienceSection,
  education: EducationSection,
  projects: ProjectsSection,
  certifications: CertificationsSection,
  languages: LanguagesSection,
};

const sectionIcons: Record<string, React.ElementType> = {
  skills: Lightbulb,
  experience: Briefcase,
  education: GraduationCap,
  projects: BookUser,
  certifications: Award,
  languages: LanguagesIcon,
};

const sectionNames: Record<string, string> = {
  skills: 'Skills',
  experience: 'Work Experience',
  education: 'Education',
  projects: 'Projects',
  certifications: 'Certifications',
  languages: 'Languages',
};

const ExperienceDatabankPage: React.FC = () => {
  const { currentUser, loading, logout } = useAuth(); // Changed user to currentUser
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const handleUnauthorized = () => {
    logout();
    navigate('/login');
  };

  const authToken = localStorage.getItem('auth_token');

  useEffect(() => {
    if (!loading && !currentUser && !authToken) {
      navigate('/login');
    }
    // Determine initial active section from URL hash or default to 'skills'
    const hash = window.location.hash.replace('#', '');
    if (hash && sectionComponents[hash]) {
      setActiveSection(hash);
    } else {
      // setActiveSection(Object.keys(sectionComponents)[0]); // Optionally default to first section
      setActiveSection(null); // Or no default section
    }

    const handleHashChange = () => {
      const newHash = window.location.hash.replace('#', '');
      if (newHash && sectionComponents[newHash]) {
        setActiveSection(newHash);
      } else {
        setActiveSection(null);
      }
    };

    window.addEventListener('hashchange', handleHashChange, false);
    return () => {
      window.removeEventListener('hashchange', handleHashChange, false);
    };
  }, [currentUser, loading, navigate, authToken]);

  const renderActiveSection = () => {
    if (!activeSection) {
      return (
        <div className="text-center py-10">
          <Database size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">Welcome to Your Experience Databank</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Select a category from the sidebar to view or add your professional information.
          </p>
        </div>
      );
    }
    const Component = sectionComponents[activeSection];
    if (!Component) return <p className="text-red-500">Section not found.</p>;

    // All sections now expect token and onUnauthorized props
    if (!authToken) {
      // This check might be redundant if all components handle token presence internally,
      // but good as a safeguard or for a generic message.
      return <p className="text-red-500">Authentication token is missing. Please log in.</p>;
    }
    return <Component token={authToken} onUnauthorized={handleUnauthorized} />;
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><p>Loading...</p></div>;
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white dark:bg-gray-800 p-4 md:p-6 shadow-lg md:min-h-screen flex flex-col">
        <div>
          <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-8">CV Tailor</h1>
          <nav className="space-y-2">
            {Object.keys(sectionComponents).map((key) => {
              const Icon = sectionIcons[key];
              return (
                <a
                  key={key}
                  href={`#${key}`}
                  onClick={(e) => {
                    e.preventDefault(); // Prevent default anchor behavior
                    setActiveSection(key);
                    window.location.hash = key; // Manually update hash
                  }}
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors duration-150 ease-in-out 
                              ${
                                activeSection === key
                                  ? 'bg-indigo-100 dark:bg-indigo-700 text-indigo-700 dark:text-indigo-100 font-semibold'
                                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                              }`}
                >
                  <Icon className={`w-5 h-5 mr-3 ${activeSection === key ? 'text-indigo-600 dark:text-indigo-300' : 'text-gray-400 dark:text-gray-500'}`} />
                  {sectionNames[key]}
                </a>
              );
            })}
          </nav>
        </div>
        <div className="mt-auto pt-6 border-t border-gray-200 dark:border-gray-700">
          <Link to="/profile" className="flex items-center px-4 py-3 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white">
            <UserCircle className="w-5 h-5 mr-3 text-gray-400 dark:text-gray-500" /> Profile
          </Link>
          <Link to="/account-settings" className="flex items-center px-4 py-3 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white">
            <Settings className="w-5 h-5 mr-3 text-gray-400 dark:text-gray-500" /> Account Settings
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center px-4 py-3 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-700 hover:text-red-700 dark:hover:text-red-100 transition-colors duration-150 ease-in-out mt-2 text-left"
          >
            <LogOut className="w-5 h-5 mr-3" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {renderActiveSection()}
      </main>
    </div>
  );
};

export default ExperienceDatabankPage;
