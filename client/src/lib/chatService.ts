import { ChatUser, Mention, Message } from "@/types/chat";

const API_URL = 'http://localhost:8080/api';

// Helper function for making API calls
const fetchAPI = async (endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    credentials: 'include', // Include cookies for auth
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || 'Failed to fetch data');
  }
  
  return response.json();
};

// Get all chat messages
export const getMessages = async (page = 1, limit = 50) => {
  return fetchAPI(`/chat?page=${page}&limit=${limit}`);
};

// Post a new message
export const postMessage = async (message: { 
  content: string, 
  mentions: Mention[],
  sender?: ChatUser,
  isAnnouncement?: boolean 
}) => {
  return fetchAPI('/chat', {
    method: 'POST',
    body: JSON.stringify(message),
  });
};

// Get chat history by date range
export const getChatHistory = async (startDate: Date, endDate: Date) => {
  return fetchAPI(
    `/chat/history?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
  );
};

// Mock implementation for testing without backend
export const mockGetMessages = async () => {
  const currentUser: ChatUser = {
    id: 'current-user',
    name: 'Current User',
    email: 'user@example.com',
    role: 'user',
  };
  
  const admin: ChatUser = {
    id: 'admin1',
    name: 'Admin',
    email: 'admin@example.com',
    role: 'admin',
  };
  
  const rescueTeam: ChatUser = {
    id: 'rescue1',
    name: 'Rescue Team Alpha',
    email: 'alpha@rescue.com',
    role: 'rescue-team',
    teamId: 'team1',
  };
  
  const mockMessages: Message[] = [
    {
      id: '1',
      sender: admin,
      content: 'Welcome to the community chat. This is where we coordinate disaster response efforts.',
      timestamp: new Date(Date.now() - 86400000), // 1 day ago
      mentions: [],
      isSuper: true,
    },
    {
      id: '2',
      sender: rescueTeam,
      content: 'Rescue Team Alpha checking in. We\'re ready to respond to the flood in the eastern district.',
      timestamp: new Date(Date.now() - 3600000), // 1 hour ago
      mentions: [],
    },
    {
      id: '3',
      sender: admin,
      content: '@Rescue Team Alpha please coordinate with local authorities and report back.',
      timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
      mentions: [
        {
          userId: 'rescue1',
          username: 'Rescue Team Alpha',
          startPosition: 0,
          endPosition: 17,
        },
      ],
      isSuper: true,
    },
    {
      id: '4',
      sender: rescueTeam,
      content: 'Roger that, @Admin. We\'re contacting local authorities now.',
      timestamp: new Date(Date.now() - 900000), // 15 minutes ago
      mentions: [
        {
          userId: 'admin1',
          username: 'Admin',
          startPosition: 13,
          endPosition: 19,
        },
      ],
    },
    {
      id: '5',
      sender: currentUser,
      content: 'I\'m in the eastern district and seeing rising water levels. Should I evacuate?',
      timestamp: new Date(Date.now() - 600000), // 10 minutes ago
      mentions: [],
    },
    {
      id: '6',
      sender: admin,
      content: '@Current User yes, please evacuate immediately to the designated shelter at Central High School.',
      timestamp: new Date(Date.now() - 300000), // 5 minutes ago
      mentions: [
        {
          userId: 'current-user',
          username: 'Current User',
          startPosition: 0,
          endPosition: 12,
        },
      ],
      isSuper: true,
      isAnnouncement: true,
    },
  ];
  
  return {
    messages: mockMessages,
    totalPages: 1,
    currentPage: 1,
  };
};

export const mockPostMessage = async (message: { 
  content: string, 
  mentions: Mention[],
  sender?: ChatUser,
  isAnnouncement?: boolean
}) => {
  // Use the provided sender if available, otherwise use a default user
  const sender = message.sender || {
    id: 'current-user',
    name: 'Current User',
    email: 'user@example.com',
    role: 'user',
  };
  
  const newMessage: Message = {
    id: Date.now().toString(),
    sender: sender,
    content: message.content,
    timestamp: new Date(),
    mentions: message.mentions,
    isAnnouncement: message.isAnnouncement,
  };
  
  return newMessage;
}; 