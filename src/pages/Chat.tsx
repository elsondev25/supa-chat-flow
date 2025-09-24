import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { EmptyState } from '@/components/chat/EmptyState';
import { useAuthStore } from '@/stores/auth';
import { Chat } from '@/types';

export default function ChatPage() {
  const { user, profile } = useAuthStore();
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-background">
      <ChatSidebar 
        onSelectChat={setSelectedChat} 
        selectedChatId={selectedChat?.id}
      />
      {selectedChat ? (
        <ChatWindow chat={selectedChat} />
      ) : (
        <EmptyState />
      )}
    </div>
  );
}