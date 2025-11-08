import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Input } from './ui/input';
import { Plus, MessageSquare, LogOut, User, Search, Moon, Sun, Menu, X, Trash2, Settings, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from './ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import AdDisplay from './AdDisplay';
import AdManager from './AdManager';
import { NewsManager } from './NewsManager';
import { NewsDisplay } from './NewsDisplay';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';

interface Conversation {
  id: string;
  title: string;
  created_at: string;
}

interface ChatSidebarProps {
  currentConversationId: string | null;
  onConversationSelect: (id: string) => void;
  onNewConversation: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

const ChatSidebar = ({ currentConversationId, onConversationSelect, onNewConversation, isOpen, onToggle }: ChatSidebarProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [showAdManager, setShowAdManager] = useState(false);
  const [showNewsManager, setShowNewsManager] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    loadConversations();
    loadProfile();
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();
      setIsAdmin(!!data);
    }
  };

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setProfile(data);
      setEditedName(data?.full_name || 'کاربر');
    }
  };

  const handleUpdateName = async () => {
    if (!profile) return;
    
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: editedName })
      .eq('id', profile.id);

    if (error) {
      toast({
        title: 'خطا در ویرایش نام',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: '✅ نام ویرایش شد',
      description: 'نام شما با موفقیت تغییر یافت',
    });
    setIsEditingName(false);
    loadProfile();
  };

  const loadConversations = async () => {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      toast({
        title: 'خطا در بارگذاری مکالمات',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setConversations(data || []);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: 'خروج موفق',
      description: 'با موفقیت از حساب خود خارج شدید',
    });
    navigate('/auth');
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      // Delete messages first
      await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', id);
      
      // Then delete conversation
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: '🗑️ حذف موفق',
        description: 'مکالمه با موفقیت حذف شد',
      });

      await loadConversations();
      
      if (currentConversationId === id) {
        onNewConversation();
      }
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: 'خطا در حذف مکالمه',
        description: error.message || 'لطفاً دوباره تلاش کنید',
        variant: 'destructive',
      });
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed lg:relative inset-y-0 right-0 z-50
        w-80 h-full bg-card border-l border-border flex flex-col shadow-elegant
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="p-4 border-b border-border space-y-4">
          {/* Close Button (Mobile) */}
          <div className="flex items-center justify-between lg:hidden">
            <h2 className="text-lg font-bold">منوی چت</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Profile */}
          <div className="p-3 bg-muted/50 rounded-lg space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center shadow-glow">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 overflow-hidden">
                {isEditingName ? (
                  <Input
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="h-8"
                    autoFocus
                  />
                ) : (
                  <p className="font-semibold truncate">{profile?.full_name || 'کاربر'}</p>
                )}
                <p className="text-xs text-muted-foreground truncate">دانشگاه پیام نور</p>
              </div>
            </div>
            {isEditingName ? (
              <div className="flex gap-2">
                <Button size="sm" onClick={handleUpdateName} className="flex-1">
                  ذخیره
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsEditingName(false)} className="flex-1">
                  لغو
                </Button>
              </div>
            ) : (
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full" 
                onClick={() => setIsEditingName(true)}
              >
                ویرایش نام
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {/* Theme Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-full"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="ml-2 h-4 w-4" />
                  حالت روشن
                </>
              ) : (
                <>
                  <Moon className="ml-2 h-4 w-4" />
                  حالت تاریک
                </>
              )}
            </Button>

            {/* Admin Menu */}
            {isAdmin && (
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdminMenu(!showAdminMenu)}
                  className="w-full justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    مدیریت
                  </div>
                  {showAdminMenu ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
                
                {showAdminMenu && (
                  <div className="space-y-1 pr-4 animate-in slide-in-from-top-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/admin')}
                      className="w-full justify-start"
                    >
                      <Settings className="ml-2 h-4 w-4" />
                      تنظیمات
                    </Button>
                    
                    <Dialog open={showAdManager} onOpenChange={setShowAdManager}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-full justify-start">
                          <Settings className="ml-2 h-4 w-4" />
                          تبلیغات
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>مدیریت تبلیغات</DialogTitle>
                        </DialogHeader>
                        <AdManager />
                      </DialogContent>
                    </Dialog>
                    
                    <Dialog open={showNewsManager} onOpenChange={setShowNewsManager}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-full justify-start">
                          <Settings className="ml-2 h-4 w-4" />
                          اخبار
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>مدیریت اخبار</DialogTitle>
                        </DialogHeader>
                        <NewsManager />
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* New Conversation */}
          <Button 
            onClick={onNewConversation}
            className="w-full gradient-primary text-white hover:opacity-90 shadow-glow transition-smooth hover:scale-105"
          >
            <Plus className="ml-2 h-4 w-4" />
            مکالمه جدید
          </Button>

          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="جستجو در مکالمات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
        </div>

        {/* Advertisements */}
        <div className="px-4">
          <AdDisplay position="sidebar" />
          <NewsDisplay />
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-2">
            {filteredConversations.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-4">
                {searchQuery ? 'نتیجه‌ای یافت نشد' : 'مکالمه‌ای وجود ندارد'}
              </p>
            ) : (
              filteredConversations.map((conv) => (
                <div key={conv.id} className="group relative">
                  <Button
                    variant={currentConversationId === conv.id ? 'secondary' : 'ghost'}
                    className="w-full justify-start text-right transition-smooth hover:shadow-md pr-10"
                    onClick={() => {
                      onConversationSelect(conv.id);
                      if (window.innerWidth < 1024) onToggle();
                    }}
                  >
                    <MessageSquare className="ml-2 h-4 w-4 flex-shrink-0" />
                    <span className="truncate flex-1">{conv.title}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                    onClick={(e) => handleDeleteConversation(conv.id, e)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleSignOut}
          >
            <LogOut className="ml-2 h-4 w-4" />
            خروج
          </Button>
        </div>
      </div>
    </>
  );
};

export default ChatSidebar;