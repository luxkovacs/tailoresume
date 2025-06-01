import React, { useState, useEffect } from 'react';

interface TokenStatusProps {
  className?: string;
}

const TokenStatus: React.FC<TokenStatusProps> = ({ className = '' }) => {
  const [message, setMessage] = useState<string>('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleInvalidToken = () => {
      setMessage('Invalid authentication token detected. You have been logged out. Please log in again.');
      setIsVisible(true);
      
      // Hide message after 5 seconds
      setTimeout(() => {
        setIsVisible(false);
      }, 5000);
    };

    window.addEventListener('auth-token-invalid', handleInvalidToken);
    
    return () => {
      window.removeEventListener('auth-token-invalid', handleInvalidToken);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className={`fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg z-50 max-w-md ${className}`}>
      <div className="flex">
        <div className="py-1">
          <svg className="fill-current h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z"/>
          </svg>
        </div>
        <div>
          <p className="font-bold">Authentication Required</p>
          <p className="text-sm">{message}</p>
        </div>
        <div className="pl-4">
          <button 
            onClick={() => setIsVisible(false)}
            className="text-red-700 hover:text-red-900"
          >
            <svg className="fill-current h-6 w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TokenStatus;
