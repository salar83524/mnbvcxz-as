import { useState } from 'react';
import { Button } from './ui/button';
import { Copy, Pencil, Trash2, Check, User, Bot } from 'lucide-react';
import { useToast } from './ui/use-toast';
import { Textarea } from './ui/textarea';
import { supabase } from '@/integrations/supabase/client';

interface ChatMessageProps {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string | null;
  onUpdate: () => void;
}

const ChatMessage = ({ id, role, content, imageUrl, onUpdate }: ChatMessageProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [copied, setCopied] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const { toast } = useToast();
  const isUser = role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: 'کپی شد',
      description: 'پیام با موفقیت کپی شد',
    });
  };

  const handleSave = async () => {
    // First, get the current message to find the conversation and position
    const { data: currentMessage } = await supabase
      .from('messages')
      .select('conversation_id, created_at')
      .eq('id', id)
      .single();

    if (!currentMessage) return;

    // Update the current message
    const { error } = await supabase
      .from('messages')
      .update({ content: editedContent })
      .eq('id', id);

    if (error) {
      toast({
        title: 'خطا در ویرایش',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    // If this is a user message, delete the next AI response to trigger regeneration
    if (isUser) {
      // Find and delete the next assistant message after this one
      const { data: allMessages } = await supabase
        .from('messages')
        .select('id, role, created_at')
        .eq('conversation_id', currentMessage.conversation_id)
        .order('created_at', { ascending: true });

      if (allMessages) {
        const currentIndex = allMessages.findIndex(msg => msg.id === id);
        const nextMessage = allMessages[currentIndex + 1];
        
        if (nextMessage && nextMessage.role === 'assistant') {
          await supabase
            .from('messages')
            .delete()
            .eq('id', nextMessage.id);
        }
      }
    }

    toast({
      title: '✅ ویرایش موفق',
      description: isUser ? 'پیام ویرایش شد - برای پاسخ جدید دوباره ارسال کنید' : 'پیام ویرایش شد',
    });
    setIsEditing(false);
    onUpdate();
  };

  const handleDelete = async () => {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'خطا در حذف',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'حذف شد',
      description: 'پیام با موفقیت حذف شد',
    });
    onUpdate();
  };

  return (
    <div 
      className={`flex gap-3 md:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-elegant ${
        isUser ? 'bg-primary ring-2 ring-primary/30 animate-pulse-glow' : 'gradient-primary ring-2 ring-primary/40 animate-pulse-glow'
      } transition-spring hover:scale-110 hover:rotate-6`}>
        {isUser ? (
          <User className="w-5 h-5 md:w-6 md:h-6 text-primary-foreground" />
        ) : (
          <span className="text-white font-bold text-sm md:text-lg font-decorative">AS</span>
        )}
      </div>
      
      <div className={`flex-1 space-y-2 ${isUser ? 'items-end' : 'items-start'} flex flex-col max-w-[85%] md:max-w-[75%]`}>
        {imageUrl && (
          <div className="relative group">
            <img 
              src={imageUrl} 
              alt="Uploaded" 
              className="max-w-[240px] md:max-w-sm rounded-xl shadow-lg border-2 border-border/50 transition-all group-hover:scale-105 group-hover:shadow-2xl"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}
        
        {isEditing ? (
          <div className="w-full space-y-2 animate-in fade-in zoom-in">
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full min-h-[120px] text-sm md:text-base border-2 focus:border-primary rounded-xl"
            />
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="outline" onClick={() => setIsEditing(false)} className="rounded-lg">
                لغو
              </Button>
              <Button size="sm" onClick={handleSave} className="gradient-primary text-white rounded-lg shadow-md">
                ذخیره تغییرات
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className={`rounded-2xl p-5 md:p-6 shadow-elegant transition-spring hover:shadow-2xl hover:scale-[1.02] ${
              isUser 
                ? 'gradient-primary text-primary-foreground ring-2 ring-primary/20' 
                : 'bg-gradient-to-br from-card via-card to-muted/30 border-2 border-border/60 backdrop-blur-sm'
            }`}>
              <p className="whitespace-pre-wrap break-words text-sm md:text-base leading-relaxed">
                {content}
              </p>
            </div>
            
            {showActions && (
              <div className={`flex gap-1 md:gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'} animate-in fade-in zoom-in`}>
                <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-8 px-3 rounded-lg hover:bg-primary/10 transition-all"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 md:h-4 md:w-4 ml-1" />
                    <span className="text-xs md:text-sm">کپی شد</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 md:h-4 md:w-4 ml-1" />
                    <span className="text-xs md:text-sm">کپی</span>
                  </>
                )}
              </Button>
              
              {isUser && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="h-8 px-3 rounded-lg hover:bg-primary/10 transition-all"
                  >
                    <Pencil className="h-3.5 w-3.5 md:h-4 md:w-4 ml-1" />
                    <span className="text-xs md:text-sm">ویرایش</span>
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    className="h-8 px-3 rounded-lg text-destructive hover:bg-destructive/10 transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4 ml-1" />
                    <span className="text-xs md:text-sm">حذف</span>
                  </Button>
                </>
              )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;