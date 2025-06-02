'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import MainLayout from '@/components/MainLayout';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  _id: string;
  conversation: string;
  sender: {
    _id: string;
    name: string;
    email: string;
  };
  receiver: {
    _id: string;
    name: string;
    email: string;
  };
  content: string;
  isRead: boolean;
  createdAt: string;
}

interface Conversation {
  _id: string;
  participants: {
    _id: string;
    name: string;
    email: string;
  }[];
}

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const messageEndRef = useRef<HTMLDivElement>(null);
  const { user, isLoading, isAuthenticated } = useAuth();
  
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState('');
  const [otherParticipant, setOtherParticipant] = useState<{name: string, _id: string, email: string} | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = `/auth/login?redirect=/dashboard/messages/${params.id}`;
    }
  }, [isLoading, isAuthenticated, params.id]);

  // Fetch tradesman name from ID
  const findTradesmanName = async (userId: string) => {
    try {
      console.log("Looking up user with userId:", userId);
      
      // First check if the current user is a tradesman
      const isTradesman = user?.role === 'tradesman';
      
      if (isTradesman) {
        // For tradesmen, we need to look up customer names
        try {
          // Check the customers database directly using the lookup endpoint
          const customerResponse = await fetch(`/api/customers/lookup?id=${userId}`, {
            credentials: 'include',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });
          
          if (customerResponse.ok) {
            const customerData = await customerResponse.json();
            if (customerData.success && customerData.name) {
              console.log("Found customer name:", customerData.name);
              return customerData.name;
            }
          }
        } catch (error) {
          console.error("Error looking up customer:", error);
        }
      }
      
      // If we're a customer or the customer lookup failed, try tradesman lookup
      const response = await fetch(`/api/tradesmen?userId=${userId}`, {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!response.ok) {
        console.error("Failed to fetch tradesman:", await response.text());
        // Fall back to direct lookup
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
            console.log("Found tradesman name via lookup:", fallbackData.name);
            return fallbackData.name;
          }
        }
        return null;
      }
      
      const data = await response.json();
      console.log("Tradesman lookup response:", data);
      
      if (data.success && data.data && data.data.length > 0) {
        // Return the name from the tradesman directly (not from the nested user)
        const name = data.data[0].name || data.data[0].user?.name;
        console.log("Found tradesman name:", name);
        return name || "Unknown User";
      }
      
      return null;
    } catch (error) {
      console.error("Error fetching user name:", error);
      return null;
    }
  };

  // Fetch conversation and messages
  useEffect(() => {
    // Only fetch if authenticated
    if (!isAuthenticated || isLoading) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // First fetch conversation details to ensure we have participant information
        const conversationResponse = await fetch(`/api/conversations/${params.id}`, {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        if (!conversationResponse.ok) {
          // Check if the response is HTML instead of JSON
          const contentType = conversationResponse.headers.get('content-type');
          if (contentType && contentType.includes('text/html')) {
            throw new Error('Server returned HTML instead of JSON. You may need to log in again.');
          }
          
          const errData = await conversationResponse.json();
          throw new Error(errData.message || 'Failed to load conversation');
        }
        
        const conversationData = await conversationResponse.json();
        
        if (!conversationData.success || !conversationData.data) {
          throw new Error(conversationData.message || 'Failed to load conversation data');
        }
        
        setConversation(conversationData.data);
        
        // If we have the conversation, find the other participant
        if (conversationData.data && user) {
          // Find other participant and make sure we have their info
          const other = conversationData.data.participants.find(
            (p: any) => p._id !== user.id
          );
          
          if (other && other.name && other.name !== 'Unknown User') {
            setOtherParticipant(other);
          } else {
            console.warn("Other participant found but missing name or shown as Unknown User:", other);
            
            // Try to find tradesman name using the userId
            const tradesmanName = await findTradesmanName(other?._id || "");
            
            if (tradesmanName) {
              setOtherParticipant({
                _id: other?._id || "unknown",
                name: tradesmanName,
                email: other?.email || ""
              });
            } else {
              setOtherParticipant({
                _id: other?._id || "unknown",
                name: "Unknown User",
                email: other?.email || ""
              });
            }
          }
        }
        
        // Now fetch messages
        const messagesResponse = await fetch(`/api/conversations/${params.id}/messages`, {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        if (!messagesResponse.ok) {
          // Check if the response is HTML instead of JSON
          const contentType = messagesResponse.headers.get('content-type');
          if (contentType && contentType.includes('text/html')) {
            throw new Error('Server returned HTML instead of JSON. You may need to log in again.');
          }
          
          const errData = await messagesResponse.json();
          throw new Error(errData.message || 'Failed to load messages');
        }
        
        const messagesData = await messagesResponse.json();
        if (messagesData.success) {
          setMessages(messagesData.data);
        }
      } catch (err: any) {
        console.error('Error fetching conversation data:', err);
        setError(err.message || 'Failed to load conversation data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id, isAuthenticated, isLoading, user]);

  // Scroll to bottom of messages
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!messageInput.trim()) return;
    
    try {
      setSendingMessage(true);
      
      const response = await fetch(`/api/conversations/${params.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        credentials: 'include',
        body: JSON.stringify({
          content: messageInput,
        }),
      });
      
      // Check for HTML response instead of JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        throw new Error('Server returned HTML instead of JSON. You may need to log in again.');
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send message');
      }
      
      // Add the new message to our list
      setMessages([...messages, data.data]);
      
      // Clear the input
      setMessageInput('');
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
      console.error('Error sending message:', err);
    } finally {
      setSendingMessage(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Show loading when auth is loading or content is loading
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

  // Show the conversation UI
  return (
    <MainLayout>
      <div className="bg-gray-50 min-h-screen py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow overflow-hidden flex flex-col h-[calc(100vh-200px)]">
            {/* Header */}
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center">
                <Link href="/dashboard/messages" className="mr-4 text-gray-500 hover:text-gray-700">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Link>
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-700 font-medium">
                      {otherParticipant?.name?.charAt(0) || '?'}
                    </span>
                  </div>
                  <div className="ml-3">
                    <h2 className="text-lg font-medium text-gray-900">
                      {otherParticipant?.name || 'Unknown User'}
                    </h2>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-700">
                <p>{error}</p>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 p-6 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No messages yet. Send a message to start the conversation.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message, index) => {
                    // Check if we should show the date
                    const showDate =
                      index === 0 ||
                      new Date(message.createdAt).toDateString() !==
                        new Date(messages[index - 1].createdAt).toDateString();
                    
                    // PROPERLY determine if the message is from the current user
                    const isCurrentUser = user && message.sender?._id === user.id;
                    
                    return (
                      <div key={message._id}>
                        {showDate && (
                          <div className="text-center my-4">
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              {formatDate(message.createdAt)}
                            </span>
                          </div>
                        )}
                        <div
                          className={`flex ${
                            isCurrentUser ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-[70%] px-4 py-2 rounded-lg ${
                              isCurrentUser
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            <p>{message.content}</p>
                            <p
                              className={`text-xs mt-1 ${
                                isCurrentUser ? 'text-primary-200' : 'text-gray-500'
                              }`}
                            >
                              {formatTime(message.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messageEndRef} />
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="border-t border-gray-200 p-4">
              <form onSubmit={handleSendMessage} className="flex">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 border border-gray-300 rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={sendingMessage}
                />
                <button
                  type="submit"
                  disabled={sendingMessage || !messageInput.trim()}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-r-lg disabled:opacity-50"
                >
                  {sendingMessage ? 'Sending...' : 'Send'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 