import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import ChatSidebar from '@/components/ChatSidebar';
import ChatMessage from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';
import AdDisplay from '@/components/AdDisplay';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileDown, Loader2, Menu, MessageSquare, Search, ImageIcon, BookOpen, Newspaper } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  image_url?: string | null;
  created_at: string;
}

const Chat = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!currentConversationId) return;
    loadMessages();
    const unsubscribe = subscribeToMessages();
    return () => {
      unsubscribe?.();
    };
  }, [currentConversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
    } else {
      setUser(session.user);
      // Don't auto-create conversation on auth check to prevent duplicate toasts
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${currentConversationId}`,
        },
        () => {
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const loadMessages = async () => {
    if (!currentConversationId) return;

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', currentConversationId)
      .order('created_at', { ascending: true });

    if (error) {
      toast({
        title: 'خطا در بارگذاری پیام‌ها',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setMessages((data || []) as Message[]);
  };

  const createNewConversation = async (): Promise<string | null> => {
    if (!user) {
      return null;
    }
    
    try {
      // Update timestamp of current conversation before creating new one
      if (currentConversationId) {
        await supabase
          .from('conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', currentConversationId);
      }

      const { data, error } = await supabase
        .from('conversations')
        .insert([{ 
          title: 'مکالمه جدید', 
          user_id: user.id,
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      setCurrentConversationId(data.id);
      setMessages([]);

      toast({
        title: '✨ مکالمه جدید',
        description: 'مکالمه قبلی ذخیره شد',
      });

      return data.id;
    } catch (error: any) {
      console.error('Conversation creation error:', error);
      return null;
    }
  };

  const handleSendMessage = async (content: string, imageUrl?: string) => {
    if (!user) {
      toast({
        title: 'نیاز به ورود',
        description: 'برای ارسال پیام وارد شوید',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    let convId = currentConversationId;
    if (!convId) {
      const newId = await createNewConversation();
      if (!newId) {
        setLoading(false);
        return;
      }
      convId = newId;
    }

    // Save user message
    const { error: messageError } = await supabase
      .from('messages')
      .insert([{
        conversation_id: convId,
        user_id: user.id,
        role: 'user',
        content,
        image_url: imageUrl,
      }]);

    if (messageError) {
      toast({
        title: 'خطا در ارسال پیام',
        description: messageError.message,
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    // Get AI response
    try {
      const { data: functionData, error: functionError } = await supabase.functions.invoke('chat-ai', {
        body: { 
          messages: messages.map(m => ({ 
            role: m.role, 
            content: m.content,
            image_url: m.image_url 
          })).concat([{ role: 'user', content, image_url: imageUrl }]),
          image: imageUrl,
        },
      });

      if (functionError) {
        throw functionError;
      }

      // Save AI response
      await supabase
        .from('messages')
        .insert([{
          conversation_id: convId,
          user_id: user.id,
          role: 'assistant',
          content: functionData.response,
        }]);

      // Update conversation title and timestamp
      if (messages.length === 0) {
        await supabase
          .from('conversations')
          .update({ 
            title: content.substring(0, 50),
            updated_at: new Date().toISOString()
          })
          .eq('id', convId);
      } else {
        await supabase
          .from('conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', convId);
      }
    } catch (error: any) {
      toast({
        title: 'خطا در دریافت پاسخ',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFont('helvetica');
    doc.setFontSize(16);
    doc.text('Chat Conversation', 20, 20);
    
    let yPos = 40;
    messages.forEach((msg, index) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(12);
      doc.text(`${msg.role === 'user' ? 'User' : 'AI'}:`, 20, yPos);
      yPos += 7;
      
      doc.setFontSize(10);
      const splitText = doc.splitTextToSize(msg.content, 170);
      doc.text(splitText, 20, yPos);
      yPos += splitText.length * 7 + 10;
    });
    
    doc.save('chat-conversation.pdf');
    
    toast({
      title: 'خروجی PDF',
      description: 'مکالمه با موفقیت به PDF تبدیل شد',
    });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen max-h-screen overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
      <ChatSidebar
        currentConversationId={currentConversationId}
        onConversationSelect={setCurrentConversationId}
        onNewConversation={createNewConversation}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex-1 flex flex-col min-w-0 relative max-h-screen overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute top-0 -right-4 w-72 h-72 gradient-primary rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 -left-4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
        </div>

        {/* Modern Compact Header */}
        <header className="relative border-b border-border/50 backdrop-blur-xl bg-card/90 shadow-md z-10 shrink-0">
          <div className="p-2.5 md:p-3 flex justify-between items-center">
            <div className="flex items-center gap-2 md:gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden hover:bg-primary/10 transition-smooth h-9 w-9"
              >
                <Menu className="h-4 w-4" />
              </Button>
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl gradient-primary flex items-center justify-center shadow-md transition-smooth hover:scale-105">
                <span className="text-white font-bold text-base md:text-lg font-decorative">AS</span>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 md:gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/news')}
                className="hover:bg-primary/10 transition-smooth h-9 w-9"
                title="اخبار"
              >
                <Newspaper className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/materials')}
                className="hover:bg-primary/10 transition-smooth h-9 w-9"
                title="مواد آموزشی"
              >
                <BookOpen className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                onClick={exportToPDF}
                disabled={messages.length === 0}
                className="gap-1.5 text-xs hover:bg-primary/10 transition-smooth h-9 px-3"
                size="sm"
              >
                <FileDown className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">PDF</span>
              </Button>
            </div>
          </div>
          
        </header>

        {/* Messages Area - Full Height */}
        <ScrollArea className="flex-1 min-h-0 max-h-full relative z-0">
          <div className="max-w-6xl mx-auto px-3 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6 min-h-full">
            {/* Top Advertisement */}
            <AdDisplay position="chat_top" />
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 animate-in fade-in zoom-in duration-700">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full gradient-primary flex items-center justify-center mb-8 shadow-2xl shadow-primary/40 animate-float">
                  <MessageSquare className="w-10 h-10 md:w-12 md:h-12 text-white" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-text animate-in slide-in-from-bottom-4 font-decorative" style={{animationDelay: '200ms'}}>
                  به چت AS خوش آمدید!
                </h2>
                <p className="text-base md:text-lg text-muted-foreground max-w-2xl mb-10 leading-relaxed animate-in slide-in-from-bottom-4" style={{animationDelay: '400ms'}}>
                  با قابلیت جستجو، تحلیل تصاویر و دسترسی به منابع آموزشی
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl w-full mb-8">
                  <div className="group p-6 rounded-2xl border-2 border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur hover:border-primary/50 transition-all hover:shadow-xl hover:scale-105 cursor-pointer animate-in fade-in slide-in-from-bottom-4" style={{animationDelay: '600ms'}}>
                    <Search className="w-8 h-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
                    <h3 className="font-bold mb-2">جستجوی هوشمند</h3>
                    <p className="text-sm text-muted-foreground">جستجو در منابع و کتب دانشگاه پیام نور</p>
                  </div>
                  
                  <div className="group p-6 rounded-2xl border-2 border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur hover:border-primary/50 transition-all hover:shadow-xl hover:scale-105 cursor-pointer animate-in fade-in slide-in-from-bottom-4" style={{animationDelay: '700ms'}}>
                    <ImageIcon className="w-8 h-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
                    <h3 className="font-bold mb-2">تحلیل تصویر</h3>
                    <p className="text-sm text-muted-foreground">آپلود و تحلیل سوالات و مطالب درسی</p>
                  </div>
                  
                  <div className="group p-6 rounded-2xl border-2 border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur hover:border-primary/50 transition-all hover:shadow-xl hover:scale-105 cursor-pointer animate-in fade-in slide-in-from-bottom-4 sm:col-span-2 lg:col-span-1" style={{animationDelay: '800ms'}}>
                    <MessageSquare className="w-8 h-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
                    <h3 className="font-bold mb-2">پاسخ هوشمند</h3>
                    <p className="text-sm text-muted-foreground">دریافت پاسخ دقیق و جامع به سوالات</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 justify-center animate-in fade-in slide-in-from-bottom-4" style={{animationDelay: '1s'}}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSendMessage("چگونه می‌توانم در امتحانات بهتر عمل کنم؟")}
                    className="text-xs hover:bg-primary/10 hover:border-primary/50 transition-all"
                  >
                    💡 نکات امتحانی
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSendMessage("منابع درسی رشته کامپیوتر را معرفی کن")}
                    className="text-xs hover:bg-primary/10 hover:border-primary/50 transition-all"
                  >
                    📚 منابع درسی
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSendMessage("برنامه مطالعاتی موثر چگونه است؟")}
                    className="text-xs hover:bg-primary/10 hover:border-primary/50 transition-all"
                  >
                    📅 برنامه مطالعه
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    id={message.id}
                    role={message.role}
                    content={message.content}
                    imageUrl={message.image_url}
                    onUpdate={loadMessages}
                  />
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
            
            {/* Bottom Advertisement */}
            <AdDisplay position="chat_bottom" />
            
            {loading && (
              <div className="flex justify-center py-6 animate-in fade-in zoom-in">
                <div className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl border border-primary/20 shadow-lg">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className="text-sm font-medium">در حال تولید پاسخ هوشمند...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Modern Input Area */}
        <footer className="relative border-t border-border/50 backdrop-blur-xl bg-card/90 shrink-0 shadow-lg z-10">
          <div className="max-w-6xl mx-auto">
            <ChatInput
              onSendMessage={handleSendMessage}
              loading={loading}
            />
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Chat;