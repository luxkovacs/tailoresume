import React from 'react';
import { Link } from 'react-router-dom';
import { User, KeyRound, Database, Settings, Briefcase, GraduationCap, Award, LanguagesIcon, Lightbulb } from 'lucide-react'; // Added more icons

interface DashboardCardProps {
  to: string;
  icon: React.ElementType;
  title: string;
  description: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ to, icon: Icon, title, description }) => {
  return (
    <Link 
      to={to}
      className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1"
    >
      <div className="flex items-center mb-4">
        <Icon className="w-8 h-8 text-indigo-600 dark:text-indigo-400 mr-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
      </div>
      <p className="text-gray-600 dark:text-gray-400 text-sm">{description}</p>
    </Link>
  );
};

const ProfilePage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <User className="w-24 h-24 mx-auto text-indigo-600 dark:text-indigo-400 mb-4" />
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Your Profile Dashboard</h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mt-2">Manage your account, API keys, and professional data.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <DashboardCard 
          to="/profile/account-settings"
          icon={Settings}
          title="Account Settings"
          description="Update your personal information, email, and password."
        />
        <DashboardCard 
          to="/profile/api-keys"
          icon={KeyRound}
          title="API Keys"
          description="Manage your API keys for integrating with third-party services."
        />
        <DashboardCard 
          to="/profile/experience-databank"
          icon={Database}
          title="Experience Databank"
          description="Curate your skills, work history, education, projects, and more."
        />
        {/* Optional: Direct links to specific databank sections for convenience */}
        {/* <DashboardCard 
          to="/profile/experience-databank#skills"
          icon={Lightbulb} // Changed from Briefcase to Lightbulb for Skills
          title="Skills Hub"
          description="Quickly access and update your skills inventory."
        />
        <DashboardCard 
          to="/profile/experience-databank#work-experience"
          icon={Briefcase}
          title="Work Experience"
          description="Detail your professional roles and accomplishments."
        />
        <DashboardCard 
          to="/profile/experience-databank#education"
          icon={GraduationCap}
          title="Education History"
          description="Log your academic achievements and qualifications."
        /> */}
      </div>
    </div>
  );
};

export default ProfilePage;
