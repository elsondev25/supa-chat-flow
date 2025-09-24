import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { Chat, Message, User, TypingIndicator } from '@/types';

interface ChatState {
  chats: Chat[];
  activeChat: Chat | null;
  messages: Record<string, Message[]>;
  typingUsers: TypingIndicator[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchChats: () => Promise<void>;
  fetchMessages: (chatId: string) => Promise<void>;
  sendMessage: (chatId: string, text: string, replyTo?: string) => Promise<void>;
  setActiveChat: (chat: Chat | null) => void;
  createDirectChat: (userId: string) => Promise<{ chatId?: string; error?: string }>;
  createGroupChat: (name: string, userIds: string[]) => Promise<{ chatId?: string; error?: string }>;
  subscribeToChat: (chatId: string) => () => void;
  subscribeToChats: () => () => void;
  addTypingUser: (chatId: string, userId: string) => void;
  removeTypingUser: (chatId: string, userId: string) => void;
  clearError: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  activeChat: null,
  messages: {},
  typingUsers: [],
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  setActiveChat: (chat) => set({ activeChat: chat }),

  fetchChats: async () => {
    set({ loading: true, error: null });

    const { data: chats, error } = await supabase
      .from('chats')
      .select(`
        *,
        chat_participants!inner(
          user_id,
          is_admin,
          users(id, display_name, avatar_url, status)
        )
      `)
      .order('updated_at', { ascending: false });

    if (error) {
      set({ loading: false, error: error.message });
      return;
    }

    // Transform the data to include participant info
    const transformedChats = chats.map((chat: any) => ({
      ...chat,
      participants: chat.chat_participants,
    }));

    set({ chats: transformedChats, loading: false });
  },

  fetchMessages: async (chatId: string) => {
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:users!sender_id(id, display_name, avatar_url),
        reply_message:messages!reply_to(id, text, sender:users!sender_id(display_name)),
        reactions(emoji, user_id, users(display_name))
      `)
      .eq('chat_id', chatId)
      .eq('deleted', false)
      .order('created_at', { ascending: true });

    if (error) {
      set({ error: error.message });
      return;
    }

    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: messages as Message[],
      },
    }));
  },

  sendMessage: async (chatId: string, text: string, replyTo?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('messages').insert({
      chat_id: chatId,
      sender_id: user.id,
      text,
      reply_to: replyTo,
    });

    if (error) {
      set({ error: error.message });
      return;
    }

    // Update chat's updated_at timestamp
    await supabase
      .from('chats')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', chatId);
  },

  createDirectChat: async (userId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    // Check if direct chat already exists
    const { data: existingChats } = await supabase
      .from('chats')
      .select(`
        id,
        chat_participants!inner(user_id)
      `)
      .eq('type', 'direct');

    const directChat = existingChats?.find((chat: any) => {
      const participantIds = chat.chat_participants.map((p: any) => p.user_id);
      return participantIds.includes(user.id) && participantIds.includes(userId) && participantIds.length === 2;
    });

    if (directChat) {
      return { chatId: directChat.id };
    }

    // Create new direct chat
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .insert({
        type: 'direct',
        created_by: user.id,
      })
      .select()
      .single();

    if (chatError) {
      return { error: chatError.message };
    }

    // Add participants
    const { error: participantError } = await supabase
      .from('chat_participants')
      .insert([
        { chat_id: chat.id, user_id: user.id },
        { chat_id: chat.id, user_id: userId },
      ]);

    if (participantError) {
      return { error: participantError.message };
    }

    return { chatId: chat.id };
  },

  createGroupChat: async (name: string, userIds: string[]) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    // Create group chat
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .insert({
        type: 'group',
        name,
        created_by: user.id,
      })
      .select()
      .single();

    if (chatError) {
      return { error: chatError.message };
    }

    // Add participants (creator is admin)
    const participants = [
      { chat_id: chat.id, user_id: user.id, is_admin: true },
      ...userIds.map(userId => ({ chat_id: chat.id, user_id: userId, is_admin: false }))
    ];

    const { error: participantError } = await supabase
      .from('chat_participants')
      .insert(participants);

    if (participantError) {
      return { error: participantError.message };
    }

    return { chatId: chat.id };
  },

  subscribeToChat: (chatId: string) => {
    const channel = supabase
      .channel(`chat-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        async (payload) => {
          // Fetch the complete message with relations
          const { data: message } = await supabase
            .from('messages')
            .select(`
              *,
              sender:users!sender_id(id, display_name, avatar_url),
              reply_message:messages!reply_to(id, text, sender:users!sender_id(display_name))
            `)
            .eq('id', payload.new.id)
            .single();

          if (message) {
            set((state) => ({
              messages: {
                ...state.messages,
                [chatId]: [...(state.messages[chatId] || []), message as Message],
              },
            }));
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  },

  subscribeToChats: () => {
    const channel = supabase
      .channel('chats')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chats',
        },
        () => {
          // Refetch chats when any chat is updated
          get().fetchChats();
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  },

  addTypingUser: (chatId: string, userId: string) => {
    set((state) => ({
      typingUsers: [
        ...state.typingUsers.filter(t => !(t.chat_id === chatId && t.user_id === userId)),
        { user_id: userId, chat_id: chatId },
      ],
    }));
  },

  removeTypingUser: (chatId: string, userId: string) => {
    set((state) => ({
      typingUsers: state.typingUsers.filter(
        t => !(t.chat_id === chatId && t.user_id === userId)
      ),
    }));
  },
}));