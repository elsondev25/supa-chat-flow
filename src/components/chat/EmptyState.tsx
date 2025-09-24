import { motion } from 'framer-motion';
import { MessageCircle, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md mx-auto p-8"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 text-primary mb-6"
        >
          <MessageCircle className="w-10 h-10" />
        </motion.div>
        
        <h2 className="text-2xl font-bold text-foreground mb-3">
          Welcome to SupaChat!
        </h2>
        
        <p className="text-muted-foreground mb-8 leading-relaxed">
          Select a chat from the sidebar to start messaging, or create a new conversation
          to connect with friends and colleagues in real-time.
        </p>
        
        <div className="grid grid-cols-1 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center space-x-3 p-3 rounded-lg bg-card border border-border"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-medium text-foreground">Real-time messaging</h3>
              <p className="text-xs text-muted-foreground">Instant delivery and notifications</p>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center space-x-3 p-3 rounded-lg bg-card border border-border"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-accent" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-medium text-foreground">Group conversations</h3>
              <p className="text-xs text-muted-foreground">Create groups and manage members</p>
            </div>
          </motion.div>
        </div>
        
        <Button className="bg-primary hover:bg-primary-hover">
          Start Chatting
        </Button>
      </motion.div>
    </div>
  );
}