import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChatStore } from '@/stores/chat';
import { useAuthStore } from '@/stores/auth';
import { Chat } from '@/types';
import { 
  MessageCircle, 
  Search, 
  Plus, 
  Settings, 
  LogOut,
  Users,
  Hash
} from 'lucide-react';

interface ChatSidebarProps {
  onSelectChat: (chat: Chat) => void;
  selectedChatId?: string;
}

export function ChatSidebar({ onSelectChat, selectedChatId }: ChatSidebarProps) {
  const { chats, fetchChats, createDirectChat, loading } = useChatStore();
  const { profile, signOut } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  const filteredChats = chats.filter(chat => {
    if (!searchQuery) return true;
    
    if (chat.type === 'group') {
      return chat.name?.toLowerCase().includes(searchQuery.toLowerCase());
    } else {
      // For direct chats, search by participant names
      const otherParticipant = chat.participants?.find(p => p.user_id !== profile?.id);
      return otherParticipant?.user?.display_name?.toLowerCase().includes(searchQuery.toLowerCase());
    }
  });

  const getAvatarFallback = (chat: Chat) => {
    if (chat.type === 'group') {
      return chat.name?.charAt(0).toUpperCase() || 'G';
    } else {
      const otherParticipant = chat.participants?.find(p => p.user_id !== profile?.id);
      return otherParticipant?.user?.display_name?.charAt(0).toUpperCase() || '?';
    }
  };

  const getChatName = (chat: Chat) => {
    if (chat.type === 'group') {
      return chat.name || 'Unnamed Group';
    } else {
      const otherParticipant = chat.participants?.find(p => p.user_id !== profile?.id);
      return otherParticipant?.user?.display_name || 'Unknown User';
    }
  };

  const getChatIcon = (chat: Chat) => {
    return chat.type === 'group' ? <Users className="w-4 h-4" /> : <Hash className="w-4 h-4" />;
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'online': return 'bg-online';
      case 'away': return 'bg-away';
      default: return 'bg-offline';
    }
  };

  return (
    <div className="w-80 border-r border-border bg-sidebar flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <MessageCircle className="w-6 h-6 text-sidebar-primary" />
            <h1 className="text-lg font-semibold text-sidebar-foreground">SupaChat</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="text-sidebar-foreground hover:bg-sidebar-accent">
              <Plus className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-sidebar-foreground hover:bg-sidebar-accent">
              <Settings className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={signOut}
              className="text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-sidebar-accent border-sidebar-border"
          />
        </div>
      </div>

      {/* User Profile */}
      {profile && (
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Avatar>
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback>{profile.display_name?.charAt(0) || profile.email.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-sidebar ${getStatusColor(profile.status)}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {profile.display_name || profile.email}
              </p>
              <p className="text-xs text-sidebar-foreground/60 capitalize">
                {profile.status}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Chat List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          <AnimatePresence>
            {filteredChats.map((chat, index) => {
              const isSelected = chat.id === selectedChatId;
              const chatName = getChatName(chat);
              const otherParticipant = chat.participants?.find(p => p.user_id !== profile?.id);
              
              return (
                <motion.div
                  key={chat.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`rounded-lg mb-2 transition-colors cursor-pointer ${
                    isSelected 
                      ? 'bg-sidebar-accent border border-sidebar-primary' 
                      : 'hover:bg-sidebar-accent/50'
                  }`}
                  onClick={() => onSelectChat(chat)}
                >
                  <div className="p-3">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={chat.avatar_url} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getAvatarFallback(chat)}
                          </AvatarFallback>
                        </Avatar>
                        {chat.type === 'direct' && otherParticipant?.user && (
                          <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-sidebar ${getStatusColor(otherParticipant.user.status)}`} />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-sidebar-foreground truncate">
                            {chatName}
                          </p>
                          <div className="flex items-center space-x-1">
                            {getChatIcon(chat)}
                            {chat.type === 'group' && chat.participants && (
                              <Badge variant="secondary" className="text-xs">
                                {chat.participants.length}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {chat.last_message && (
                          <p className="text-xs text-sidebar-foreground/60 truncate mt-1">
                            {chat.last_message.text || 'Attachment'}
                          </p>
                        )}
                        
                        <p className="text-xs text-sidebar-foreground/40 mt-1">
                          {new Date(chat.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          
          {filteredChats.length === 0 && !loading && (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">
                {searchQuery ? 'No chats found' : 'No chats yet'}
              </p>
              <p className="text-sm text-muted-foreground/60 mt-1">
                {searchQuery ? 'Try a different search term' : 'Start a conversation!'}
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}