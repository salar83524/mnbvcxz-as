import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, FileText, Clock, TrendingUp } from 'lucide-react';
import { Card } from './ui/card';

interface ChatStatsProps {
  conversationId: string | null;
}

export const ChatStats = ({ conversationId }: ChatStatsProps) => {
  const [stats, setStats] = useState({
    messageCount: 0,
    materialsAvailable: 0,
    avgResponseTime: 0,
  });

  useEffect(() => {
    loadStats();
  }, [conversationId]);

  const loadStats = async () => {
    try {
      // Count messages in current conversation
      if (conversationId) {
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conversationId);
        
        setStats(prev => ({ ...prev, messageCount: count || 0 }));
      }

      // Count available materials
      const { count: materialsCount } = await supabase
        .from('educational_materials')
        .select('*', { count: 'exact', head: true });
      
      setStats(prev => ({ ...prev, materialsAvailable: materialsCount || 0 }));
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6 animate-in fade-in slide-in-from-top-2">
      <Card className="p-3 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 hover:shadow-md transition-smooth">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">پیام‌ها</p>
            <p className="text-lg font-bold">{stats.messageCount}</p>
          </div>
        </div>
      </Card>

      <Card className="p-3 bg-gradient-to-br from-secondary/5 to-secondary/10 border-secondary/20 hover:shadow-md transition-smooth">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center">
            <FileText className="w-4 h-4 text-secondary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">منابع</p>
            <p className="text-lg font-bold">{stats.materialsAvailable}</p>
          </div>
        </div>
      </Card>

      <Card className="p-3 bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20 hover:shadow-md transition-smooth col-span-2 md:col-span-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-accent" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">دسترسی سریع</p>
            <p className="text-lg font-bold">100%</p>
          </div>
        </div>
      </Card>
    </div>
  );
};