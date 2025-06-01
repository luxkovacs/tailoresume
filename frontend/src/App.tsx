import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout'; // Import the Layout component
import TokenStatus from './components/TokenStatus'; // Import TokenStatus component

// Pages
import HomePage from './pages/HomePage';
import ResumeGenPage from './pages/ResumeGenPage';
import LoginPage from './pages/LoginPage';
import ApiKeysPage from './pages/ApiKeysPage';
import ProfilePage from './pages/ProfilePage'; // Added ProfilePage
import AccountSettingsPage from './pages/AccountSettingsPage'; // Added AccountSettingsPage
import ExperienceDatabankPage from './pages/ExperienceDatabankPage'; // Added ExperienceDatabankPage
import KnowledgeBasePage from './pages/KnowledgeBasePage'; // Added KnowledgeBasePage
import ExamplesPage from './pages/ExamplesPage'; // Added ExamplesPage

// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
};

function AppContent() {
  return (
    <div className="app-container">
      <main className="app-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/resume-builder" element={
            <ProtectedRoute>
              <ResumeGenPage />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          <Route path="/profile/account-settings" element={
            <ProtectedRoute>
              <AccountSettingsPage />
            </ProtectedRoute>
          } />
          <Route path="/profile/api-keys" element={
            <ProtectedRoute>
              <ApiKeysPage />
            </ProtectedRoute>
          } />
          <Route path="/profile/experience-databank" element={
            <ProtectedRoute>
              <ExperienceDatabankPage />
            </ProtectedRoute>
          } />
          <Route path="/knowledge-base" element={
            <KnowledgeBasePage />
          } />
          <Route path="/examples" element={
            <ExamplesPage />
          } />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Layout> {/* Wrap Routes with Layout */}
          <AppContent />
          <TokenStatus /> {/* Add TokenStatus component for auth notifications */}
        </Layout>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;