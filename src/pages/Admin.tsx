import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Settings, Megaphone, Newspaper, Loader2 } from 'lucide-react';
import AdManager from '@/components/AdManager';
import { NewsManager } from '@/components/NewsManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

const Admin = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      if (!data) {
        toast.error('شما دسترسی ادمین ندارید');
        navigate('/');
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Animated Background */}
      <div className="fixed inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-0 -right-4 w-72 h-72 gradient-primary rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 -left-4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
      </div>

      {/* Header */}
      <header className="relative border-b border-border/50 backdrop-blur-xl bg-card/80 shadow-lg z-10">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="hover:bg-primary/10"
            >
              <ArrowRight className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold gradient-text font-decorative">
                  پنل مدیریت
                </h1>
                <p className="text-sm text-muted-foreground">مدیریت تبلیغات و اخبار</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="settings" className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 h-12">
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">تنظیمات</span>
            </TabsTrigger>
            <TabsTrigger value="advertisements" className="gap-2">
              <Megaphone className="w-4 h-4" />
              <span className="hidden sm:inline">تبلیغات</span>
            </TabsTrigger>
            <TabsTrigger value="news" className="gap-2">
              <Newspaper className="w-4 h-4" />
              <span className="hidden sm:inline">اخبار</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  تنظیمات سیستم
                </CardTitle>
                <CardDescription>
                  تنظیمات عمومی سیستم مدیریت
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="border-2 hover:border-primary/50 transition-colors">
                    <CardHeader>
                      <CardTitle className="text-base">آمار کاربران</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold gradient-text">-</p>
                      <p className="text-sm text-muted-foreground mt-1">کاربران ثبت‌شده</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-2 hover:border-primary/50 transition-colors">
                    <CardHeader>
                      <CardTitle className="text-base">آمار مکالمات</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold gradient-text">-</p>
                      <p className="text-sm text-muted-foreground mt-1">مکالمات ایجاد شده</p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-2 border-primary/20 bg-primary/5">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">
                      برای مشاهده آمار دقیق‌تر و تنظیمات بیشتر، از بخش‌های تبلیغات و اخبار استفاده کنید.
                    </p>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advertisements">
            <Card>
              <CardContent className="p-0">
                <AdManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="news">
            <Card>
              <CardContent className="p-0">
                <NewsManager />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
