import React, { useState, useEffect } from 'react';
import { apiKeysService } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface APIKeyState {
  api_key_openai: string;
  api_key_anthropic: string;
  api_key_google: string;
  preferred_ai_provider: string;
}

interface APIKeyInfo {
  preferred_ai_provider: string | null;
  has_openai_key: boolean;
  has_anthropic_key: boolean;
  has_google_key: boolean;
}

const ApiKeysPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [apiKeys, setApiKeys] = useState<APIKeyState>({
    api_key_openai: '',
    api_key_anthropic: '',
    api_key_google: '',
    preferred_ai_provider: 'openai'
  });
  const [apiKeyInfo, setApiKeyInfo] = useState<APIKeyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('openai');
  
  // Fetch API key information
  useEffect(() => {
    const fetchApiKeyInfo = async () => {
      try {
        setLoading(true);
        // Expect an array from getAll, even if it's a single-element array
        const response = await apiKeysService.getAll<APIKeyInfo[]>(); 
        
        if (response && Array.isArray(response) && response.length > 0) {
          const apiData: APIKeyInfo = response[0]; // Take the first element
          
          if (apiData && typeof apiData === 'object') {
            setApiKeyInfo(apiData);
            
            const preferredProvider = 
              apiData.preferred_ai_provider && 
              typeof apiData.preferred_ai_provider === 'string' 
                ? apiData.preferred_ai_provider 
                : 'openai';
            
            setApiKeys(prevState => ({
              ...prevState,
              preferred_ai_provider: preferredProvider
            }));
            
            setActiveTab(preferredProvider);
          } else {
            console.error('Invalid API key info data format in array', apiData);
            setError('Received invalid data format from server');
          }
        } else if (response && !Array.isArray(response)) {
          // This case handles if the backend *actually* returned a single object
          // despite getAll expecting an array. This is a fallback.
          console.warn('API returned a single object for getAll, expected array. Processing as single object.');
          const apiData: APIKeyInfo = response as unknown as APIKeyInfo; // Cast needed
           if (apiData && typeof apiData === 'object') {
            setApiKeyInfo(apiData);
            const preferredProvider = 
              apiData.preferred_ai_provider && 
              typeof apiData.preferred_ai_provider === 'string' 
                ? apiData.preferred_ai_provider 
                : 'openai';
            setApiKeys(prevState => ({
              ...prevState,
              preferred_ai_provider: preferredProvider
            }));
            setActiveTab(preferredProvider);
          } else {
            console.error('Invalid API key info data format (single object)', apiData);
            setError('Received invalid data format from server');
          }
        } else {
          setError('No API key information received or empty array from server');
        }
        
        // setError(null); // Error should be cleared only if successful
      } catch (err) {
        console.error('Error fetching API key information:', err);
        setError('Failed to fetch API key information. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if user is logged in
    if (currentUser) {
      fetchApiKeyInfo();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setApiKeys({
      ...apiKeys,
      [name]: value
    });

    // Clear messages when user starts typing
    setSuccessMessage(null);
    setError(null);
  };

  const handleProviderChange = (provider: string) => {
    setApiKeys({
      ...apiKeys,
      preferred_ai_provider: provider
    });
    setActiveTab(provider);
    
    // Clear messages when changing providers
    setSuccessMessage(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const payload: Partial<APIKeyState> = {
        preferred_ai_provider: apiKeys.preferred_ai_provider
      };
      
      if (activeTab === 'openai' && apiKeys.api_key_openai) {
        payload.api_key_openai = apiKeys.api_key_openai;
      } else if (activeTab === 'anthropic' && apiKeys.api_key_anthropic) {
        payload.api_key_anthropic = apiKeys.api_key_anthropic;
      } else if (activeTab === 'google' && apiKeys.api_key_google) {
        payload.api_key_google = apiKeys.api_key_google;
      }
      
      // The 'update' method in ApiService typically takes an ID. 
      // If your /api-keys/ endpoint for PUT/POST doesn't use an ID in the URL 
      // (e.g., it updates the keys for the authenticated user),
      // you might need a custom method or ensure your backend handles PUT to /api-keys/
      // For now, assuming update with an empty string ID might map to the base endpoint for PUT.
      await apiKeysService.update('', payload); // Or a more specific method if available
      
      // Refresh the API key info
      // Expect an array from getAll
      const data = await apiKeysService.getAll<APIKeyInfo[]>(); 
      if (data && Array.isArray(data) && data.length > 0) {
        setApiKeyInfo(data[0]);
      } else if (data && !Array.isArray(data)) {
        // Fallback if single object is returned
        setApiKeyInfo(data as unknown as APIKeyInfo);
      } else {
        console.warn("Failed to refresh API key info or got empty data after update.");
      }
      
      setApiKeys({
        ...apiKeys,
        api_key_openai: '',
        api_key_anthropic: '',
        api_key_google: ''
      });
      
      setSuccessMessage('API key updated successfully!');
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update API key');
      setSuccessMessage(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !apiKeyInfo) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Manage API Keys
      </h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          tailoresume uses a "Bring Your Own Key" (BYOK) approach for AI functionality. 
          Add your API keys below to enable job description analysis and resume generation.
        </p>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">Current API Keys</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg border ${apiKeyInfo?.has_openai_key ? 'border-green-500 bg-green-50 dark:bg-green-900 dark:bg-opacity-20' : 'border-gray-300 bg-gray-50 dark:bg-gray-700'}`}>
              <div className="font-medium">OpenAI</div>
              <div className="text-sm mt-1">
                {apiKeyInfo?.has_openai_key ? 'Key added ✓' : 'No key added'}
              </div>
            </div>
            <div className={`p-4 rounded-lg border ${apiKeyInfo?.has_anthropic_key ? 'border-green-500 bg-green-50 dark:bg-green-900 dark:bg-opacity-20' : 'border-gray-300 bg-gray-50 dark:bg-gray-700'}`}>
              <div className="font-medium">Anthropic</div>
              <div className="text-sm mt-1">
                {apiKeyInfo?.has_anthropic_key ? 'Key added ✓' : 'No key added'}
              </div>
            </div>
            <div className={`p-4 rounded-lg border ${apiKeyInfo?.has_google_key ? 'border-green-500 bg-green-50 dark:bg-green-900 dark:bg-opacity-20' : 'border-gray-300 bg-gray-50 dark:bg-gray-700'}`}>
              <div className="font-medium">Google</div>
              <div className="text-sm mt-1">
                {apiKeyInfo?.has_google_key ? 'Key added ✓' : 'No key added'}
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Preferred AI Provider: <span className="font-semibold">
                {apiKeyInfo && apiKeyInfo.preferred_ai_provider 
                  ? typeof apiKeyInfo.preferred_ai_provider === 'string' 
                    ? apiKeyInfo.preferred_ai_provider 
                    : JSON.stringify(apiKeyInfo.preferred_ai_provider)
                  : 'None selected'}
              </span>
            </p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          {/* API Provider Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
            <ul className="flex flex-wrap -mb-px">
              <li className="mr-2">
                <button
                  type="button"
                  className={`inline-block p-4 border-b-2 rounded-t-lg ${
                    activeTab === 'openai'
                      ? 'text-blue-600 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                      : 'hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
                  }`}
                  onClick={() => handleProviderChange('openai')}
                >
                  OpenAI
                </button>
              </li>
              <li className="mr-2">
                <button
                  type="button"
                  className={`inline-block p-4 border-b-2 rounded-t-lg ${
                    activeTab === 'anthropic'
                      ? 'text-blue-600 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                      : 'hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
                  }`}
                  onClick={() => handleProviderChange('anthropic')}
                >
                  Anthropic
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className={`inline-block p-4 border-b-2 rounded-t-lg ${
                    activeTab === 'google'
                      ? 'text-blue-600 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                      : 'hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
                  }`}
                  onClick={() => handleProviderChange('google')}
                >
                  Google
                </button>
              </li>
            </ul>
          </div>
          
          {/* OpenAI Tab Content */}
          {activeTab === 'openai' && (
            <div className="mb-6">
              <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="api_key_openai">
                OpenAI API Key
              </label>
              <input
                id="api_key_openai"
                name="api_key_openai"
                type="password"
                value={apiKeys.api_key_openai}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="sk-..."
              />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">OpenAI's website</a>
              </p>
            </div>
          )}
          
          {/* Anthropic Tab Content */}
          {activeTab === 'anthropic' && (
            <div className="mb-6">
              <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="api_key_anthropic">
                Anthropic API Key
              </label>
              <input
                id="api_key_anthropic"
                name="api_key_anthropic"
                type="password"
                value={apiKeys.api_key_anthropic}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="sk-ant-..."
              />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Get your API key from <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Anthropic's console</a>
              </p>
            </div>
          )}
          
          {/* Google Tab Content */}
          {activeTab === 'google' && (
            <div className="mb-6">
              <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="api_key_google">
                Google AI API Key
              </label>
              <input
                id="api_key_google"
                name="api_key_google"
                type="password"
                value={apiKeys.api_key_google}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="AIza..."
              />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Get your API key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Google AI Studio</a>
              </p>
            </div>
          )}
          
          {/* Preferred Provider Selection */}
          <div className="mb-6">
            <label className="block text-gray-700 dark:text-gray-300 mb-2">
              Set as Preferred Provider
            </label>
            <div className="flex items-center">
              <input
                id="preferred_provider"
                name="preferred_provider"
                type="checkbox"
                checked={apiKeys.preferred_ai_provider === activeTab}
                onChange={() => handleProviderChange(activeTab)}
                className="h-4 w-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              />
              <label htmlFor="preferred_provider" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Make {activeTab === 'openai' ? 'OpenAI' : activeTab === 'anthropic' ? 'Anthropic' : 'Google'} your preferred AI provider
              </label>
            </div>
          </div>
          
          {/* Success/Error Messages */}
          {successMessage && (
            <div className="p-4 mb-6 text-sm text-green-700 bg-green-100 rounded-lg dark:bg-green-900 dark:bg-opacity-20 dark:text-green-400">
              {successMessage}
            </div>
          )}
          
          {error && (
            <div className="p-4 mb-6 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900 dark:bg-opacity-20 dark:text-red-400">
              {error}
            </div>
          )}
          
          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-md shadow-sm disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save API Key'}
            </button>
          </div>
        </form>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">About BYOK (Bring Your Own Key)</h2>
        <div className="prose dark:prose-invert">
          <p>
            tailoresume uses your own API keys to provide AI-powered resume tailoring. This approach offers several benefits:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Your data remains under your control</li>
            <li>You can choose your preferred AI provider</li>
            <li>You get the best performance from the latest models</li>
            <li>No additional subscription fees beyond what you pay to the AI provider</li>
          </ul>
          <p>
            The application needs these keys to analyze job descriptions, match your skills to job requirements, 
            and generate tailored resumes. Your API keys are securely stored and never shared.
          </p>
          <h3 className="text-lg font-medium mt-4 mb-2">Usage Costs</h3>
          <p>
            Each AI provider has different pricing models. Typically, analyzing a job description and generating 
            a resume will cost a few cents. Most providers offer free credits for new users.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ApiKeysPage;