'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/MainLayout';

export default function NewChat() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading, isAuthenticated } = useAuth();
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const tradesmanId = searchParams.get('tradesman');
  const [redirected, setRedirected] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    // If already redirected, don't do it again
    if (redirected) return;
    
    // Wait for auth to be checked
    if (isLoading) return;

    // Set debug info for current state
    if (user && tradesmanId) {
      setDebugInfo({
        currentUserId: user.id,
        tradesmanId: tradesmanId,
        isMatching: user.id === tradesmanId
      });
      
      // Prevent attempting to create a conversation with yourself
      if (user.id === tradesmanId) {
        setError("You cannot start a conversation with yourself");
        return;
      }
    }

    // If not authenticated and we have a tradesman ID, redirect to login
    if (!isAuthenticated && tradesmanId) {
      setRedirected(true);
      const currentUrl = `/chat/new?tradesman=${tradesmanId}`;
      const loginUrl = `/auth/login?redirect=${encodeURIComponent(currentUrl)}`;
      window.location.href = loginUrl;
      return;
    }

    // If authenticated and we have a tradesman ID, create conversation
    if (isAuthenticated && tradesmanId && !isCreating && user && user.id !== tradesmanId) {
      createConversation();
    } else if (!tradesmanId) {
      setError('Tradesman ID is missing');
    }
  }, [isLoading, isAuthenticated, tradesmanId, isCreating, redirected, user]);

  const createConversation = async () => {
    if (!tradesmanId || !user) {
      setError('Missing required information');
      return;
    }
    
    // Prevent messaging yourself
    if (user.id === tradesmanId) {
      setError("You cannot start a conversation with yourself");
      return;
    }
    
    try {
      setIsCreating(true);
      
      console.log(`Attempting to create conversation with tradesman ID: ${tradesmanId}`);
      setDebugInfo({
        currentUserId: user.id,
        tradesmanId: tradesmanId
      });
      
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        credentials: 'include',
        body: JSON.stringify({
          receiverId: tradesmanId,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create conversation');
      }
      
      // Redirect to the conversation using window.location for a full page refresh
      window.location.href = `/dashboard/messages/${data.data._id}`;
    } catch (err: any) {
      console.error('Error creating conversation:', err);
      setError(err.message || 'Failed to create conversation');
      setIsCreating(false);
    }
  };
  
  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        {error ? (
          <div className="bg-red-50 p-4 rounded-md text-red-700 max-w-md">
            <h2 className="text-lg font-medium mb-2">Error</h2>
            <p>{error}</p>
            
            {debugInfo && (
              <div className="mt-4 p-3 bg-gray-100 text-xs text-gray-700 rounded">
                <p>Debug Info:</p>
                <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
              </div>
            )}
            
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => router.back()}
                className="px-3 py-1 text-primary-600 hover:text-primary-800 font-medium"
              >
                Go Back
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="px-3 py-1 text-primary-600 hover:text-primary-800 font-medium"
              >
                Go to Home
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            <span className="mt-4 text-gray-700">
              {isAuthenticated ? 'Creating conversation...' : 'Checking authentication...'}
            </span>
            
            {debugInfo && (
              <div className="mt-4 p-3 bg-gray-100 text-xs text-gray-700 rounded max-w-md">
                <p>Debug Info:</p>
                <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
} 