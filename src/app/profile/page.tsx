'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/MainLayout';

interface ProfileFormData {
  name: string;
  city: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ProfilePage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [profileFormData, setProfileFormData] = useState<ProfileFormData>({
    name: '',
    city: '',
  });
  
  const [passwordFormData, setPasswordFormData] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [updating, setUpdating] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = '/auth/login?redirect=/profile';
    }
  }, [isLoading, isAuthenticated]);

  // Populate form data when user data is available
  useEffect(() => {
    if (user) {
      setProfileFormData({
        name: user.name || '',
        city: user.city || '',
      });
    }
  }, [user]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileFormData({
      ...profileFormData,
      [e.target.name]: e.target.value,
    });
    setProfileError('');
    setProfileSuccess('');
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordFormData({
      ...passwordFormData,
      [e.target.name]: e.target.value,
    });
    setPasswordError('');
    setPasswordSuccess('');
  };

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!profileFormData.name.trim()) {
      setProfileError('Name is required');
      return;
    }
    
    try {
      setUpdating(true);
      setProfileError('');
      
      const response = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: profileFormData.name,
          city: profileFormData.city,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }
      
      setProfileSuccess('Profile updated successfully');
    } catch (error: any) {
      setProfileError(error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Password validation
    if (!passwordFormData.currentPassword) {
      setPasswordError('Current password is required');
      return;
    }
    
    if (!passwordFormData.newPassword) {
      setPasswordError('New password is required');
      return;
    }
    
    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    if (passwordFormData.newPassword.length < 6) {
      setPasswordError('Password should be at least 6 characters long');
      return;
    }
    
    try {
      setChangingPassword(true);
      setPasswordError('');
      
      const response = await fetch('/api/profile/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordFormData.currentPassword,
          newPassword: passwordFormData.newPassword,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to change password');
      }
      
      // Reset password form
      setPasswordFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      setPasswordSuccess('Password changed successfully');
    } catch (error: any) {
      setPasswordError(error.message);
    } finally {
      setChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 flex justify-center items-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-gray-700">Loading...</span>
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 flex justify-center items-center">
          <div className="text-center">
            <h2 className="text-lg font-medium mb-2">Not authenticated</h2>
            <p>Please login to view your profile</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold mb-8 text-gray-900">Your Profile</h1>
          
          <div className="bg-white shadow rounded-lg mb-8">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Personal Information</h2>
              <p className="mt-1 text-sm text-gray-500">
                Update your personal details here.
              </p>
            </div>
            
            <div className="px-6 py-5">
              {profileError && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">
                  {profileError}
                </div>
              )}
              
              {profileSuccess && (
                <div className="mb-4 p-3 bg-green-50 text-green-700 rounded">
                  {profileSuccess}
                </div>
              )}
              
              <form onSubmit={handleProfileSubmit}>
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-3">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Full Name
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="name"
                        id="name"
                        value={profileFormData.name}
                        onChange={handleProfileChange}
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  
                  <div className="sm:col-span-3">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email (Cannot be changed)
                    </label>
                    <div className="mt-1">
                      <input
                        type="email"
                        name="email"
                        id="email"
                        value={user.email}
                        disabled
                        className="shadow-sm bg-gray-50 block w-full sm:text-sm border-gray-300 rounded-md cursor-not-allowed"
                      />
                    </div>
                  </div>
                  
                  <div className="sm:col-span-3">
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Phone (Cannot be changed)
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="phone"
                        id="phone"
                        value={user.phone || 'Not provided'}
                        disabled
                        className="shadow-sm bg-gray-50 block w-full sm:text-sm border-gray-300 rounded-md cursor-not-allowed"
                      />
                    </div>
                  </div>
                  
                  <div className="sm:col-span-3">
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                      City
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="city"
                        id="city"
                        value={profileFormData.city}
                        onChange={handleProfileChange}
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  
                  <div className="sm:col-span-3">
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                      Role (Cannot be changed)
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="role"
                        id="role"
                        value={user.role || 'User'}
                        disabled
                        className="shadow-sm bg-gray-50 block w-full sm:text-sm border-gray-300 rounded-md cursor-not-allowed"
                      />
                    </div>
                  </div>
                  
                  <div className="sm:col-span-6">
                    <button
                      type="submit"
                      disabled={updating}
                      className="w-full sm:w-auto flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                    >
                      {updating ? 'Updating...' : 'Update Profile'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
          
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Change Password</h2>
              <p className="mt-1 text-sm text-gray-500">
                Update your password here.
              </p>
            </div>
            
            <div className="px-6 py-5">
              {passwordError && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">
                  {passwordError}
                </div>
              )}
              
              {passwordSuccess && (
                <div className="mb-4 p-3 bg-green-50 text-green-700 rounded">
                  {passwordSuccess}
                </div>
              )}
              
              <form onSubmit={handlePasswordSubmit}>
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-6">
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                      Current Password
                    </label>
                    <div className="mt-1">
                      <input
                        type="password"
                        name="currentPassword"
                        id="currentPassword"
                        value={passwordFormData.currentPassword}
                        onChange={handlePasswordChange}
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  
                  <div className="sm:col-span-3">
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                      New Password
                    </label>
                    <div className="mt-1">
                      <input
                        type="password"
                        name="newPassword"
                        id="newPassword"
                        value={passwordFormData.newPassword}
                        onChange={handlePasswordChange}
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  
                  <div className="sm:col-span-3">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                      Confirm New Password
                    </label>
                    <div className="mt-1">
                      <input
                        type="password"
                        name="confirmPassword"
                        id="confirmPassword"
                        value={passwordFormData.confirmPassword}
                        onChange={handlePasswordChange}
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  
                  <div className="sm:col-span-6">
                    <button
                      type="submit"
                      disabled={changingPassword}
                      className="w-full sm:w-auto flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                    >
                      {changingPassword ? 'Changing Password...' : 'Change Password'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 