import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChatStore } from '@/stores/chat';
import { useAuthStore } from '@/stores/auth';
import { Chat, Message } from '@/types';
import { 
  Send, 
  Paperclip, 
  Smile, 
  MoreVertical, 
  Phone, 
  Video,
  Users
} from 'lucide-react';

interface ChatWindowProps {
  chat: Chat;
}

export function ChatWindow({ chat }: ChatWindowProps) {
  const { messages, fetchMessages, sendMessage, subscribeToChat } = useChatStore();
  const { profile } = useAuthStore();
  const [messageText, setMessageText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const chatMessages = messages[chat.id] || [];

  useEffect(() => {
    fetchMessages(chat.id);
    const unsubscribe = subscribeToChat(chat.id);
    
    return () => {
      unsubscribe();
    };
  }, [chat.id, fetchMessages, subscribeToChat]);

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || isLoading) return;

    setIsLoading(true);
    await sendMessage(chat.id, messageText.trim());
    setMessageText('');
    setIsLoading(false);
  };

  const getChatName = () => {
    if (chat.type === 'group') {
      return chat.name || 'Unnamed Group';
    } else {
      const otherParticipant = chat.participants?.find(p => p.user_id !== profile?.id);
      return otherParticipant?.user?.display_name || 'Unknown User';
    }
  };

  const getChatAvatar = () => {
    if (chat.type === 'group') {
      return chat.avatar_url;
    } else {
      const otherParticipant = chat.participants?.find(p => p.user_id !== profile?.id);
      return otherParticipant?.user?.avatar_url;
    }
  };

  const getAvatarFallback = () => {
    if (chat.type === 'group') {
      return chat.name?.charAt(0).toUpperCase() || 'G';
    } else {
      const otherParticipant = chat.participants?.find(p => p.user_id !== profile?.id);
      return otherParticipant?.user?.display_name?.charAt(0).toUpperCase() || '?';
    }
  };

  const getOnlineStatus = () => {
    if (chat.type === 'group') {
      const onlineCount = chat.participants?.filter(p => p.user?.status === 'online').length || 0;
      return `${onlineCount} online`;
    } else {
      const otherParticipant = chat.participants?.find(p => p.user_id !== profile?.id);
      return otherParticipant?.user?.status || 'offline';
    }
  };

  const MessageBubble = ({ message, isOwn }: { message: Message; isOwn: boolean }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-end space-x-2 mb-4 ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}
    >
      {!isOwn && (
        <Avatar className="w-8 h-8">
          <AvatarImage src={message.sender?.avatar_url} />
          <AvatarFallback className="text-xs">
            {message.sender?.display_name?.charAt(0) || '?'}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={`max-w-xs lg:max-w-md ${isOwn ? 'ml-auto' : ''}`}>
        {!isOwn && (
          <p className="text-xs text-muted-foreground mb-1 px-1">
            {message.sender?.display_name || 'Unknown'}
          </p>
        )}
        
        <div
          className={`rounded-lg px-4 py-2 shadow-soft ${
            isOwn
              ? 'bg-chat-bubble-own text-chat-bubble-own-foreground'
              : 'bg-chat-bubble-other text-chat-bubble-other-foreground'
          }`}
        >
          <p className="text-sm">{message.text}</p>
        </div>
        
        <p className={`text-xs text-muted-foreground mt-1 px-1 ${isOwn ? 'text-right' : ''}`}>
          {new Date(message.created_at).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </p>
      </div>
    </motion.div>
  );

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Chat Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={getChatAvatar()} />
              <AvatarFallback>{getAvatarFallback()}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{getChatName()}</h2>
              <p className="text-sm text-muted-foreground capitalize">{getOnlineStatus()}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Phone className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Video className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Users className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {chatMessages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.sender_id === profile?.id}
              />
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="border-t border-border bg-card/50 backdrop-blur-sm">
        <form onSubmit={handleSendMessage} className="p-4">
          <div className="flex items-center space-x-2">
            <Button type="button" variant="ghost" size="sm">
              <Paperclip className="w-4 h-4" />
            </Button>
            
            <div className="flex-1 relative">
              <Input
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type a message..."
                className="pr-10"
                disabled={isLoading}
              />
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                className="absolute right-1 top-1/2 -translate-y-1/2"
              >
                <Smile className="w-4 h-4" />
              </Button>
            </div>
            
            <Button 
              type="submit" 
              size="sm" 
              disabled={!messageText.trim() || isLoading}
              className="bg-primary hover:bg-primary-hover"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}