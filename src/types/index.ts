export interface User {
  id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  status: 'online' | 'away' | 'offline';
  last_seen?: string;
  theme: string; // Allow any string, will be cast as needed
  notifications_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  display_name?: string;
  avatar_url?: string;
}

export interface Chat {
  id: string;
  type: 'direct' | 'group';
  name?: string;
  avatar_url?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  participants?: ChatParticipant[];
  last_message?: Message;
}

export interface ChatParticipant {
  chat_id: string;
  user_id: string;
  is_admin: boolean;
  joined_at: string;
  user?: User;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  text?: string;
  type: 'text' | 'image' | 'file' | 'voice';
  attachments?: any;
  reply_to?: string;
  edited: boolean;
  deleted: boolean;
  created_at: string;
  updated_at: string;
  sender?: UserProfile; // Use UserProfile for joined data
  reply_message?: {
    id: string;
    text?: string;
    sender?: UserProfile;
  };
  reactions?: {
    emoji: string;
    user_id: string;
    users?: UserProfile;
  }[];
}

export interface Reaction {
  message_id: string;
  emoji: string;
  user_id: string;
  created_at: string;
  user?: User;
}

export interface PinnedMessage {
  chat_id: string;
  message_id: string;
  pinned_by: string;
  pinned_at: string;
  message?: Message;
}

export interface TypingIndicator {
  user_id: string;
  chat_id: string;
  user?: User;
}