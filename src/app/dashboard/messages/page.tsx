'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/MainLayout';
import { useAuth } from '@/contexts/AuthContext';

interface Conversation {
  _id: string;
  participants: {
    _id: string;
    name: string;
    email: string;
  }[];
  lastMessage?: string;
  updatedAt: string;
}

export default function Messages() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [participantNames, setParticipantNames] = useState<Record<string, string>>({});

  // Ensure authentication
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = '/auth/login?redirect=/dashboard/messages';
    }
  }, [isLoading, isAuthenticated]);

  // Lookup tradesman name by ID
  const lookupTradesmanName = async (userId: string) => {
    try {
      // First try the tradesman API
      const response = await fetch(`/api/tradesmen?userId=${userId}`, {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && data.data.length > 0) {
          return data.data[0].name;
        }
      }

      // If not found, try the direct lookup
      const fallbackResponse = await fetch(`/api/tradesmen/lookup?id=${userId}`, {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        if (fallbackData.success && fallbackData.name) {
          return fallbackData.name;
        }
      }

      return null;
    } catch (error) {
      console.error("Error looking up tradesman name:", error);
      return null;
    }
  };

  useEffect(() => {
    const fetchConversations = async () => {
      if (!isAuthenticated) return;
      
      try {
        setLoading(true);
        const response = await fetch('/api/conversations', {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to load conversations');
        }

        setConversations(data.data);

        // Lookup names for all conversations with "Unknown User"
        const namesMap: Record<string, string> = {};
        
        for (const conversation of data.data) {
          if (!user) continue;
          
          const otherParticipant = conversation.participants.find(
            (p: any) => p._id !== user.id
          );
          
          if (otherParticipant && (!otherParticipant.name || otherParticipant.name === 'Unknown User')) {
            const name = await lookupTradesmanName(otherParticipant._id);
            if (name) {
              namesMap[otherParticipant._id] = name;
            }
          }
        }
        
        setParticipantNames(namesMap);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (!isLoading) {
      fetchConversations();
    }
  }, [isLoading, isAuthenticated, user]);

  const getOtherParticipant = (conversation: Conversation) => {
    if (!user || !conversation.participants || conversation.participants.length === 0) {
      return { name: 'Unknown User', email: '' };
    }
    
    // Find the participant that is not the current user
    const otherUser = conversation.participants.find(
      participant => participant && participant._id !== user.id
    );
    
    // If no other participant is found, return a default
    if (!otherUser) {
      return { name: 'Unknown User', email: '' };
    }
    
    // Check if we have a looked up name for this participant
    if (participantNames[otherUser._id]) {
      return {
        ...otherUser,
        name: participantNames[otherUser._id]
      };
    }
    
    // If name is missing or "Unknown User", try to use the email username
    if (!otherUser.name || otherUser.name === 'Unknown User') {
      if (otherUser.email && otherUser.email.includes('@')) {
        const username = otherUser.email.split('@')[0];
        // Capitalize the first letter of the username
        const displayName = username.charAt(0).toUpperCase() + username.slice(1);
        return {
          ...otherUser,
          name: displayName
        };
      }
    }
    
    return otherUser;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading || (loading && isAuthenticated)) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 flex justify-center items-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-gray-700">Loading...</span>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="bg-gray-50 min-h-screen py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="border-b border-gray-200 px-6 py-4">
              <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-700">
                <p>{error}</p>
              </div>
            )}

            {conversations.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-500">You don't have any conversations yet.</p>
                <Link
                  href="/search"
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                >
                  Find Tradesmen
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {conversations.map((conversation) => {
                  const otherParticipant = getOtherParticipant(conversation);
                  return (
                    <li key={conversation._id} className="hover:bg-gray-50">
                      <Link
                        href={`/dashboard/messages/${conversation._id}`}
                        className="block px-6 py-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                              <span className="text-primary-700 font-medium">
                                {otherParticipant.name.charAt(0)}
                              </span>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">
                                {otherParticipant.name}
                              </p>
                              <p className="text-sm text-gray-500 line-clamp-1">
                                {conversation.lastMessage || 'Start a conversation...'}
                              </p>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDate(conversation.updatedAt)}
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 