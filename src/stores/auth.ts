import { create } from 'zustand';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';

interface AuthState {
  user: SupabaseUser | null;
  session: Session | null;
  profile: User | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<{ error?: string }>;
  fetchProfile: () => Promise<void>;
  setUser: (user: SupabaseUser | null) => void;
  setSession: (session: Session | null) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  loading: true,
  error: null,

  setUser: (user) => set({ user }),
  
  setSession: (session) => set({ session, user: session?.user ?? null }),

  clearError: () => set({ error: null }),

  signIn: async (email: string, password: string) => {
    set({ loading: true, error: null });
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      set({ loading: false, error: error.message });
      return { error: error.message };
    }

    set({ loading: false });
    return {};
  },

  signUp: async (email: string, password: string, displayName?: string) => {
    set({ loading: true, error: null });
    
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: displayName || email.split('@')[0],
        },
      },
    });

    if (error) {
      set({ loading: false, error: error.message });
      return { error: error.message };
    }

    set({ loading: false });
    return {};
  },

  signOut: async () => {
    set({ loading: true });
    
    // Update user status to offline before signing out
    const { profile } = get();
    if (profile) {
      await supabase
        .from('users')
        .update({ status: 'offline', last_seen: new Date().toISOString() })
        .eq('id', profile.id);
    }

    await supabase.auth.signOut();
    set({ 
      user: null, 
      session: null, 
      profile: null, 
      loading: false, 
      error: null 
    });
  },

  fetchProfile: async () => {
    const { user } = get();
    if (!user) return;

    set({ loading: true });

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      set({ loading: false, error: error.message });
      return;
    }

    set({ profile: data, loading: false });

    // Update user status to online
    await supabase
      .from('users')
      .update({ status: 'online', last_seen: new Date().toISOString() })
      .eq('id', user.id);
  },

  updateProfile: async (updates) => {
    const { user } = get();
    if (!user) return { error: 'No user found' };

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    set({ profile: data });
    return {};
  },
}));