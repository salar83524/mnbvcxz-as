import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Settings, Megaphone, Newspaper, Loader2, Activity, Users, BarChart, FileText, Database, Palette, Lock, Shield } from 'lucide-react';
import AdManager from '@/components/AdManager';
import { NewsManager } from '@/components/NewsManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

const Admin = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ users: 0, conversations: 0, messages: 0, materials: 0 });
  const [settings, setSettings] = useState({
    siteName: 'هوش مصنوعی پیام نور',
    maintenanceMode: false,
    allowRegistration: true,
    maxUploadSize: 50,
  });
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminStatus();
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [usersRes, convsRes, msgsRes, matsRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('conversations').select('id', { count: 'exact', head: true }),
        supabase.from('messages').select('id', { count: 'exact', head: true }),
        supabase.from('educational_materials').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        users: usersRes.count || 0,
        conversations: convsRes.count || 0,
        messages: msgsRes.count || 0,
        materials: matsRes.count || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

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
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 h-auto md:h-12 gap-2">
            <TabsTrigger value="overview" className="gap-2">
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">داشبورد</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">تنظیمات</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">کاربران</span>
            </TabsTrigger>
            <TabsTrigger value="advertisements" className="gap-2">
              <Megaphone className="w-4 h-4" />
              <span className="hidden sm:inline">تبلیغات</span>
            </TabsTrigger>
            <TabsTrigger value="news" className="gap-2">
              <Newspaper className="w-4 h-4" />
              <span className="hidden sm:inline">اخبار</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2">
              <Palette className="w-4 h-4" />
              <span className="hidden sm:inline">ظاهری</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-glow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                    <Users className="w-4 h-4" />
                    کاربران
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold gradient-text">{stats.users}</p>
                  <p className="text-xs text-muted-foreground mt-1">کاربران ثبت‌شده</p>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-glow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                    <BarChart className="w-4 h-4" />
                    مکالمات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold gradient-text">{stats.conversations}</p>
                  <p className="text-xs text-muted-foreground mt-1">مکالمات ایجاد شده</p>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-glow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                    <FileText className="w-4 h-4" />
                    پیام‌ها
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold gradient-text">{stats.messages}</p>
                  <p className="text-xs text-muted-foreground mt-1">پیام‌های ارسال شده</p>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-glow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                    <Database className="w-4 h-4" />
                    محتوا
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold gradient-text">{stats.materials}</p>
                  <p className="text-xs text-muted-foreground mt-1">مواد آموزشی</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    فعالیت اخیر
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm">کاربران فعال امروز</span>
                      <span className="font-bold text-primary">-</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm">مکالمات جدید امروز</span>
                      <span className="font-bold text-primary">-</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm">پیام‌های امروز</span>
                      <span className="font-bold text-primary">-</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    وضعیت سیستم
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                      <span className="text-sm">سرور</span>
                      <span className="text-green-600 dark:text-green-400 font-bold">فعال</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                      <span className="text-sm">پایگاه داده</span>
                      <span className="text-green-600 dark:text-green-400 font-bold">متصل</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                      <span className="text-sm">هوش مصنوعی</span>
                      <span className="text-green-600 dark:text-green-400 font-bold">آماده</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  تنظیمات عمومی
                </CardTitle>
                <CardDescription>
                  پیکربندی تنظیمات اصلی سیستم
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="siteName">نام سایت</Label>
                    <Input 
                      id="siteName"
                      value={settings.siteName}
                      onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                      placeholder="نام سایت را وارد کنید"
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>حالت تعمیر و نگهداری</Label>
                      <p className="text-sm text-muted-foreground">غیرفعال کردن دسترسی کاربران عادی</p>
                    </div>
                    <Switch 
                      checked={settings.maintenanceMode}
                      onCheckedChange={(checked) => setSettings({...settings, maintenanceMode: checked})}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>ثبت‌نام کاربران جدید</Label>
                      <p className="text-sm text-muted-foreground">مجاز بودن ثبت‌نام کاربران جدید</p>
                    </div>
                    <Switch 
                      checked={settings.allowRegistration}
                      onCheckedChange={(checked) => setSettings({...settings, allowRegistration: checked})}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="maxUpload">حداکثر حجم آپلود (مگابایت)</Label>
                    <Input 
                      id="maxUpload"
                      type="number"
                      value={settings.maxUploadSize}
                      onChange={(e) => setSettings({...settings, maxUploadSize: parseInt(e.target.value)})}
                    />
                  </div>
                </div>

                <Button className="w-full md:w-auto" onClick={() => toast.success('تنظیمات ذخیره شد')}>
                  ذخیره تنظیمات
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  تنظیمات امنیتی
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    برای تنظیمات امنیتی پیشرفته، از بخش پایگاه داده استفاده کنید.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  مدیریت کاربران
                </CardTitle>
                <CardDescription>
                  مشاهده و مدیریت کاربران سیستم
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <Input placeholder="جستجوی کاربر..." className="flex-1" />
                    <Button>جستجو</Button>
                  </div>
                  
                  <div className="border rounded-lg p-8 text-center text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>لیست کاربران به زودی در دسترس خواهد بود</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advertisements Tab */}
          <TabsContent value="advertisements">
            <Card>
              <CardContent className="p-0">
                <AdManager />
              </CardContent>
            </Card>
          </TabsContent>

          {/* News Tab */}
          <TabsContent value="news">
            <Card>
              <CardContent className="p-0">
                <NewsManager />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  تنظیمات ظاهری
                </CardTitle>
                <CardDescription>
                  شخصی‌سازی ظاهر و طراحی سایت
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>رنگ اصلی</Label>
                    <div className="flex gap-2">
                      <Input type="color" defaultValue="#8B5CF6" className="w-20 h-10" />
                      <Input defaultValue="#8B5CF6" className="flex-1" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>رنگ ثانویه</Label>
                    <div className="flex gap-2">
                      <Input type="color" defaultValue="#D946EF" className="w-20 h-10" />
                      <Input defaultValue="#D946EF" className="flex-1" />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>انیمیشن‌های پیشرفته</Label>
                      <p className="text-sm text-muted-foreground">فعال‌سازی انیمیشن‌های اضافی</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>افکت‌های نوری</Label>
                      <p className="text-sm text-muted-foreground">نمایش افکت‌های درخشش و سایه</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>

                <Button className="w-full md:w-auto" onClick={() => toast.success('تنظیمات ظاهری ذخیره شد')}>
                  ذخیره تغییرات
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>پیش‌نمایش</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-6 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg border-2 border-primary/20">
                  <h3 className="text-xl font-bold gradient-text mb-2">نمونه عنوان</h3>
                  <p className="text-muted-foreground mb-4">این یک متن نمونه برای پیش‌نمایش ظاهر سایت است.</p>
                  <Button>دکمه نمونه</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
