import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Moon, Sun, Menu, X, UserCircle, ChevronDown } from 'lucide-react';

const Navbar: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const mobileProfileDropdownRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    setIsProfileDropdownOpen(false);
  };

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
      if (mobileProfileDropdownRef.current && !mobileProfileDropdownRef.current.contains(event.target as Node)) {
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-slate-800 dark:to-purple-900 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 text-2xl font-bold">
              tailoresume
            </Link>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link to="/" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-500 hover:bg-opacity-30">
                  Home
                </Link>
                {currentUser && (
                  <>
                    <Link to="/resume-builder" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-500 hover:bg-opacity-30">
                      Resume Builder
                    </Link>
                    <Link to="/knowledge-base" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-500 hover:bg-opacity-30">
                      Knowledge Base
                    </Link>
                    {/* Profile Dropdown - Desktop */}
                    <div className="relative" ref={profileDropdownRef}>
                      <button
                        onClick={toggleProfileDropdown}
                        className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-500 hover:bg-opacity-30 flex items-center"
                      >
                        Profile <ChevronDown size={16} className={`ml-1 transform transition-transform duration-200 ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isProfileDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 ring-1 ring-black ring-opacity-5">
                          <Link to="/profile" onClick={() => setIsProfileDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">My Profile</Link>
                          <Link to="/profile/account-settings" onClick={() => setIsProfileDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Account Settings</Link>
                          <Link to="/profile/api-keys" onClick={() => setIsProfileDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">API Keys</Link>
                          <Link to="/profile/experience-databank" onClick={() => setIsProfileDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Experience Databank</Link>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-white hover:bg-blue-500 hover:bg-opacity-30 focus:outline-none"
                aria-label="Toggle dark mode"
              >
                {theme === 'dark' ? (
                  <Sun className="h-6 w-6" aria-hidden="true" />
                ) : (
                  <Moon className="h-6 w-6" aria-hidden="true" />
                )}
              </button>

              {currentUser ? (
                <div className="ml-3 relative flex items-center">
                  <div className="mx-3 text-sm">
                    <span className="sr-only">User</span>
                    {currentUser.displayName}
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="px-3 py-2 rounded-md text-sm font-medium bg-red-600 hover:bg-red-700"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="ml-3 px-3 py-2 rounded-md text-sm font-medium bg-blue-500 hover:bg-blue-600"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={toggleMenu}
              className="bg-blue-700 dark:bg-slate-700 inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-blue-600 focus:outline-none"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state. */}
      {isMenuOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/"
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-500 hover:bg-opacity-30"
              onClick={toggleMenu}
            >
              Home
            </Link>
            {currentUser && (
              <>
                <Link
                  to="/resume-builder"
                  className="block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-500 hover:bg-opacity-30"
                  onClick={toggleMenu}
                >
                  Resume Builder
                </Link>
                <Link
                  to="/knowledge-base"
                  className="block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-500 hover:bg-opacity-30"
                  onClick={toggleMenu}
                >
                  Knowledge Base
                </Link>
                {/* Profile Dropdown - Mobile */}
                <div className="relative" ref={mobileProfileDropdownRef}>
                  <button
                    onClick={toggleProfileDropdown}
                    className="w-full text-left block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-500 hover:bg-opacity-30 flex justify-between items-center"
                  >
                    Profile <ChevronDown size={20} className={`transform transition-transform duration-200 ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isProfileDropdownOpen && (
                    <div className="mt-1 space-y-1 pl-3">
                       <Link to="/profile" onClick={() => { toggleMenu(); setIsProfileDropdownOpen(false);}} className="block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-500 hover:bg-opacity-30">My Profile</Link>
                      <Link to="/profile/account-settings" onClick={() => { toggleMenu(); setIsProfileDropdownOpen(false);}} className="block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-500 hover:bg-opacity-30">Account Settings</Link>
                      <Link to="/profile/api-keys" onClick={() => { toggleMenu(); setIsProfileDropdownOpen(false);}} className="block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-500 hover:bg-opacity-30">API Keys</Link>
                      <Link to="/profile/experience-databank" onClick={() => { toggleMenu(); setIsProfileDropdownOpen(false);}} className="block px-3 py-2 rounded-md textbase font-medium hover:bg-blue-500 hover:bg-opacity-30">Experience Databank</Link>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          <div className="pt-4 pb-3 border-t border-blue-800 dark:border-slate-700 bg-blue-700 dark:bg-slate-800">
            <div className="flex items-center px-5">
              <div className="flex-shrink-0">
                <UserCircle className="h-10 w-10 text-white" aria-hidden="true" />
              </div>
              {currentUser && (
                <div className="ml-3">
                  <div className="text-base font-medium leading-none text-white">
                    {currentUser.displayName}
                  </div>
                  <div className="text-sm font-medium leading-none text-gray-300 mt-1">
                    {currentUser.email}
                  </div>
                </div>
              )}
              <button
                onClick={toggleTheme}
                className="ml-auto p-1 rounded-full text-white hover:bg-blue-600 focus:outline-none"
              >
                {theme === 'dark' ? (
                  <Sun className="h-6 w-6" aria-hidden="true" />
                ) : (
                  <Moon className="h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
            <div className="mt-3 px-2 space-y-1">
              {currentUser ? (
                <button
                  onClick={() => {
                    handleSignOut();
                    toggleMenu();
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md textbase font-medium text-white bg-red-600 hover:bg-red-700"
                >
                  Sign Out
                </button>
              ) : (
                <Link
                  to="/login"
                  className="block px-3 py-2 rounded-md textbase font-medium text-white bg-blue-600 hover:bg-blue-700"
                  onClick={toggleMenu}
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;