'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Define the User type
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  city?: string;
  phone?: string;
  dbType?: string;
}

// Define the context type
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (userData: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check for existing user session on mount
  useEffect(() => {
    const checkUserSession = async () => {
      try {
        // First try to load from localStorage for immediate UI update
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch (e) {
            console.error('Failed to parse stored user data');
            localStorage.removeItem('user');
          }
        }

        // Then verify with the server
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user) {
            // Update localStorage with fresh data from server
            localStorage.setItem('user', JSON.stringify(data.user));
            setUser(data.user);
          } else {
            // If server says no valid session but we have localStorage data, clear it
            localStorage.removeItem('user');
            setUser(null);
          }
        } else {
          // If server request fails, rely on localStorage data we already loaded
          console.error('Failed to fetch user session from server');
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkUserSession();
  }, []);

  // Login function
  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  // Logout function
  const logout = async () => {
    try {
      // First, clear client-side user data
      setUser(null);
      localStorage.removeItem('user');
      
      // Then call the server to clear cookies
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      // Force a hard refresh to ensure all state is cleared
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Even if the server call fails, still clear local data
      window.location.href = '/';
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isLoading, 
        login, 
        logout, 
        isAuthenticated: !!user 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Instead of throwing an error, return a default value when the provider is not available
    console.warn('useAuth was called outside of AuthProvider. Using default values.');
    return {
      user: null,
      isLoading: false,
      login: () => {},
      logout: () => {},
      isAuthenticated: false
    };
  }
  return context;
}; 