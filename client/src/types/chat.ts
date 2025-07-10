export interface ChatUser {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  role: 'admin' | 'rescue-team' | 'user';
  teamId?: string;
}

export interface Mention {
  userId: string;
  username: string;
  startPosition: number;
  endPosition: number;
}

export interface Message {
  id: string;
  sender: ChatUser;
  content: string;
  timestamp: Date;
  mentions: Mention[];
  isSuper?: boolean;
  isAnnouncement?: boolean;
}

export interface MessageResponse {
  messages: Message[];
  totalPages: number;
  currentPage: number;
} 