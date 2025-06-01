import React from 'react';

const KnowledgeBasePage: React.FC = () => {
  return (
    <div className="container mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Knowledge Base</h1>
      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6">
        <p className="text-gray-700 dark:text-gray-300">
          Find helpful articles, tips, and guides on resume writing, job searching, and using Tailoresume effectively.
        </p>
        {/* Placeholder for knowledge base content */}
      </div>
    </div>
  );
};

export default KnowledgeBasePage;
