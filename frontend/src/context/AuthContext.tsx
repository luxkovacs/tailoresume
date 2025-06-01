import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  // GithubAuthProvider, // Commented out GithubAuthProvider
  OAuthProvider,
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { auth } from '../config/firebase';
import axios from 'axios';

// Define the shape of our authentication context
interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUp: (email: string, username: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  // signInWithGithub: () => Promise<void>; // Commented out signInWithGithub
  // signInWithMicrosoft: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Backend API URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // Sign in with email and password
  const signInWithEmail = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();
      // Sync with our backend and get our own JWT
      const backendResponse = await axios.post(`${API_URL}/api/auth/login`, 
        {}, // Empty body since backend expects Firebase token in Authorization header
        { headers: { Authorization: `Bearer ${idToken}` } }
      );
      // Store the backend-issued token
      if (backendResponse.data && backendResponse.data.access_token) {
        localStorage.setItem('auth_token', backendResponse.data.access_token);
        // Optionally, you can also store token_type if needed elsewhere
        // localStorage.setItem('token_type', backendResponse.data.token_type);
      } else {
        console.error('Backend token not found in response');
        throw new Error('Backend authentication failed to provide a token.');
      }
    } catch (error) {
      console.error('Email login error:', error);
      throw error;
    }
  };

  // Sign up with email, username and password
  const signUp = async (email: string, username: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: username });
        const idToken = await userCredential.user.getIdToken();
      // After Firebase signup, register with backend & get our JWT
      const backendResponse = await axios.post(`${API_URL}/api/auth/register`, {
        email: email,
        username: username
      });

      // If register endpoint returns a token (meaning user is also logged in)
      if (backendResponse.data && backendResponse.data.access_token) {
        localStorage.setItem('auth_token', backendResponse.data.access_token);
      } else {
        // If register doesn't auto-login, call login endpoint to get token
        console.log('Registration successful, now logging in...');
        const loginResponse = await axios.post(`${API_URL}/api/auth/login`, 
          {}, // Empty body
          { headers: { Authorization: `Bearer ${idToken}` } }
        );
        if (loginResponse.data && loginResponse.data.access_token) {
          localStorage.setItem('auth_token', loginResponse.data.access_token);
        } else {
          console.error('Login after registration failed to return token');
        }
      }

    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);      const idToken = await result.user.getIdToken();
      
      // Sync with our backend (social login) and get our own JWT
      const backendResponse = await axios.post(`${API_URL}/api/auth/login`, 
        {}, // Empty body since backend expects Firebase token in Authorization header
        { headers: { Authorization: `Bearer ${idToken}` } }
      );

      if (backendResponse.data && backendResponse.data.access_token) {
        localStorage.setItem('auth_token', backendResponse.data.access_token);
      } else {
        console.error('Backend token not found in social login response');
        throw new Error('Backend authentication failed to provide a token for social login.');
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  };

  // Sign in with GitHub
  /* // Commented out signInWithGithub function
  const signInWithGithub = async () => {
    try {
      const provider = new GithubAuthProvider();
      const result = await signInWithPopup(auth, provider);
      // After successful Firebase auth, sync with our backend
      const idToken = await result.user.getIdToken();
      await axios.post(`${API_URL}/api/auth/social-login`, {
        provider: 'github',
        email: result.user.email,
        username: result.user.displayName
      }, {
        headers: { Authorization: `Bearer ${idToken}` }
      });
    } catch (error) {
      console.error('GitHub sign-in error:', error);
      throw error;
    }
  };
  */

  // Sign in with Microsoft
  /*
  const signInWithMicrosoft = async () => {
    try {
      const provider = new OAuthProvider('microsoft.com');
      const result = await signInWithPopup(auth, provider);
      // After successful Firebase auth, sync with our backend
      const idToken = await result.user.getIdToken();
      await axios.post(`${API_URL}/api/auth/social-login`, {
        provider: 'microsoft',
        email: result.user.email,
        username: result.user.displayName
      }, {
        headers: { Authorization: `Bearer ${idToken}` }
      });
    } catch (error) {
      console.error('Microsoft sign-in error:', error);
      throw error;
    }
  };
  */

  // Logout
  const logout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('auth_token'); // Clear backend token on logout
      // localStorage.removeItem('token_type'); // Clear token_type if stored
      setCurrentUser(null); // Explicitly set current user to null
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  // Observer for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in with Firebase.
        // Now, ensure we have a backend token. 
        // This handles cases where Firebase auth state persists (e.g. page refresh)
        // but we might need to re-fetch/validate our backend token.
        const existingBackendToken = localStorage.getItem('auth_token');        if (!existingBackendToken) {
          // If no backend token, try to get one. 
          // This assumes the user was previously logged into the backend.
          // This might require an endpoint that re-issues a backend token based on active Firebase session.
          try {
            const idToken = await user.getIdToken();
            const backendResponse = await axios.post(`${API_URL}/api/auth/login`, 
              {}, // Empty body
              { headers: { Authorization: `Bearer ${idToken}` } }
            );
            if (backendResponse.data && backendResponse.data.access_token) {
              localStorage.setItem('auth_token', backendResponse.data.access_token);
            } else {
              console.warn('Firebase user detected, but failed to refresh backend token. Logging out.');
              await logout(); // Call logout if token refresh fails
            }
          } catch (error) {
            console.error('Error refreshing backend token:', error, 'Logging out.');
            await logout(); // Call logout if token refresh fails due to an error
          }
        }
        // Only set current user if logout hasn't been called
        if (localStorage.getItem('auth_token')) { // Check if token was successfully set/retained
          setCurrentUser(user);
        }
      } else {
        // User is signed out from Firebase
        localStorage.removeItem('auth_token'); // Clear backend token
      }
      setLoading(false);
    });    return unsubscribe;
  }, []);

  // Listen for invalid token events from API calls
  useEffect(() => {
    const handleInvalidToken = () => {
      console.warn('Invalid token detected, logging out user');
      logout();
    };

    window.addEventListener('auth-token-invalid', handleInvalidToken);
    
    return () => {
      window.removeEventListener('auth-token-invalid', handleInvalidToken);
    };
  }, []);

  const value = {
    currentUser,
    loading,
    signInWithEmail,
    signUp,
    signInWithGoogle,
    // signInWithGithub, // Commented out signInWithGithub
    // signInWithMicrosoft,
    logout
  };
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};