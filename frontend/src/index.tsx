import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; 
import './App.css'; 
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary'; // Added import for ErrorBoundary

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter> {/* Ensure App is wrapped with providers as in App.tsx or here */}
        <ThemeProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
