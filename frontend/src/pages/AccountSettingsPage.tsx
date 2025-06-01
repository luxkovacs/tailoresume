import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext'; // Assuming you have user info in AuthContext
import { User, Mail, Lock, ShieldAlert, Trash2 } from 'lucide-react';

const AccountSettingsPage: React.FC = () => {
  const { currentUser } = useAuth(); // Get current user
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder for profile update logic
    console.log('Updating profile...');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      alert("New passwords don't match!");
      return;
    }
    // Placeholder for password change logic
    console.log('Changing password...');
  };

  const handleDeleteAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirmText !== 'DELETE MY ACCOUNT') {
      alert('Please type "DELETE MY ACCOUNT" to confirm.');
      return;
    }
    // Placeholder for account deletion logic
    console.log('Deleting account...');
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-center text-gray-900 dark:text-white mb-10">
        Account Settings
      </h1>

      {/* User Information Section */}
      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6 md:p-8 mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6 flex items-center">
          <User className="w-7 h-7 mr-3 text-indigo-600 dark:text-indigo-400" />
          Your Information
        </h2>
        <form onSubmit={handleUpdateProfile}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Username
              </label>
              <input
                type="text"
                id="username"
                value={currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User'}
                disabled // Assuming username is not directly editable or fetched from currentUser
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={currentUser?.email || ''}
                disabled // Assuming email is not directly editable or fetched from currentUser
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 focus:outline-none"
              />
            </div>
          </div>
          {/* <div className="text-right">
            <button 
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md hover:shadow-lg transition duration-150 ease-in-out"
            >
              Update Profile
            </button>
          </div> */}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
            To change your username or email, please contact support. (This is a placeholder, actual update functionality can be added here if needed).
          </p>
        </form>
      </div>

      {/* Change Password Section */}
      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6 md:p-8 mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6 flex items-center">
          <Lock className="w-7 h-7 mr-3 text-indigo-600 dark:text-indigo-400" />
          Change Password
        </h2>
        <form onSubmit={handleChangePassword}>
          <div className="space-y-4 mb-6">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Current Password
              </label>
              <input
                type="password"
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmNewPassword"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          <div className="text-right">
            <button 
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md hover:shadow-lg transition duration-150 ease-in-out"
            >
              Update Password
            </button>
          </div>
        </form>
      </div>

      {/* Delete Account Section */}
      <div className="bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700 shadow-xl rounded-lg p-6 md:p-8">
        <h2 className="text-2xl font-semibold text-red-700 dark:text-red-300 mb-4 flex items-center">
          <ShieldAlert className="w-7 h-7 mr-3" />
          Danger Zone - Delete Account
        </h2>
        <p className="text-red-600 dark:text-red-400 mb-4 text-sm">
          Deleting your account is irreversible. All your data, including your profile, experience databank, and generated resumes, will be permanently removed.
        </p>
        <form onSubmit={handleDeleteAccount}>
          <div className="mb-4">
            <label htmlFor="deleteConfirmText" className="block text-sm font-medium text-red-700 dark:text-red-300 mb-1">
              To confirm deletion, type "DELETE MY ACCOUNT" in the box below:
            </label>
            <input
              type="text"
              id="deleteConfirmText"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE MY ACCOUNT"
              className="w-full px-4 py-2 border border-red-400 dark:border-red-600 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>
          <button 
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md hover:shadow-lg transition duration-150 ease-in-out flex items-center justify-center"
          >
            <Trash2 className="w-5 h-5 mr-2" />
            Delete My Account Permanently
          </button>
        </form>
      </div>
    </div>
  );
};

export default AccountSettingsPage;
