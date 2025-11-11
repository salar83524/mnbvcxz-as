import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Separator } from './ui/separator';
import { Switch } from './ui/switch';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { 
  Settings, 
  Shield, 
  Zap, 
  Database, 
  Bell
} from 'lucide-react';
import { toast } from 'sonner';

interface SystemSettingsProps {
  settings: any;
  onSettingsChange: (settings: any) => void;
}

export const SystemSettings = ({ settings, onSettingsChange }: SystemSettingsProps) => {
  const handleSave = () => {
    toast.success('✅ تنظیمات با موفقیت ذخیره شد');
  };

  return (
    <div className="space-y-6">
      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            تنظیمات عمومی
          </CardTitle>
          <CardDescription>
            پیکربندی اصلی سیستم
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="siteName">نام سایت</Label>
              <Input 
                id="siteName"
                value={settings.siteName}
                onChange={(e) => onSettingsChange({...settings, siteName: e.target.value})}
                placeholder="هوش مصنوعی پیام نور"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="siteDesc">توضیحات سایت</Label>
              <Input 
                id="siteDesc"
                value={settings.siteDescription || ''}
                onChange={(e) => onSettingsChange({...settings, siteDescription: e.target.value})}
                placeholder="توضیحات کوتاهی درباره سایت"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">زبان پیش‌فرض</Label>
              <Select value={settings.language || 'fa'} onValueChange={(val) => onSettingsChange({...settings, language: val})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fa">فارسی</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ar">العربية</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>حالت تعمیر و نگهداری</Label>
                <p className="text-sm text-muted-foreground">غیرفعال کردن دسترسی کاربران عادی</p>
              </div>
              <Switch 
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) => onSettingsChange({...settings, maintenanceMode: checked})}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>ثبت‌نام کاربران جدید</Label>
                <p className="text-sm text-muted-foreground">مجاز بودن ثبت‌نام کاربران جدید</p>
              </div>
              <Switch 
                checked={settings.allowRegistration}
                onCheckedChange={(checked) => onSettingsChange({...settings, allowRegistration: checked})}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>ذخیره تاریخچه مکالمات</Label>
                <p className="text-sm text-muted-foreground">ذخیره خودکار تاریخچه چت</p>
              </div>
              <Switch 
                checked={settings.saveChatHistory !== false}
                onCheckedChange={(checked) => onSettingsChange({...settings, saveChatHistory: checked})}
              />
            </div>
          </div>

          <Button onClick={handleSave} className="w-full md:w-auto">
            ذخیره تنظیمات عمومی
          </Button>
        </CardContent>
      </Card>

      {/* AI Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            تنظیمات هوش مصنوعی
          </CardTitle>
          <CardDescription>
            پیکربندی مدل و رفتار هوش مصنوعی
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="aiModel">مدل هوش مصنوعی</Label>
              <Select value={settings.aiModel || 'gemini-2.5-flash'} onValueChange={(val) => onSettingsChange({...settings, aiModel: val})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini-2.5-pro">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Pro</Badge>
                      Gemini 2.5 Pro
                    </div>
                  </SelectItem>
                  <SelectItem value="gemini-2.5-flash">
                    <div className="flex items-center gap-2">
                      <Badge>توصیه شده</Badge>
                      Gemini 2.5 Flash
                    </div>
                  </SelectItem>
                  <SelectItem value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</SelectItem>
                  <SelectItem value="gpt-5">GPT-5</SelectItem>
                  <SelectItem value="gpt-5-mini">GPT-5 Mini</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxTokens">حداکثر طول پاسخ (توکن)</Label>
              <Input 
                id="maxTokens"
                type="number"
                value={settings.maxTokens || 2000}
                onChange={(e) => onSettingsChange({...settings, maxTokens: parseInt(e.target.value)})}
                min={500}
                max={8000}
                step={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="systemPrompt">دستورالعمل سیستم</Label>
              <Input 
                id="systemPrompt"
                value={settings.systemPrompt || 'شما یک دستیار هوش مصنوعی مفید و دانا هستید که به زبان فارسی پاسخ می‌دهید.'}
                onChange={(e) => onSettingsChange({...settings, systemPrompt: e.target.value})}
                placeholder="دستورالعمل‌های سیستم برای هوش مصنوعی"
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>جستجوی وب</Label>
                <p className="text-sm text-muted-foreground">دسترسی به اطلاعات آنلاین</p>
              </div>
              <Switch 
                checked={settings.enableWebSearch || false}
                onCheckedChange={(checked) => onSettingsChange({...settings, enableWebSearch: checked})}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>پردازش تصویر</Label>
                <p className="text-sm text-muted-foreground">تحلیل و درک تصاویر</p>
              </div>
              <Switch 
                checked={settings.enableImageProcessing !== false}
                onCheckedChange={(checked) => onSettingsChange({...settings, enableImageProcessing: checked})}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>ورودی صوتی</Label>
                <p className="text-sm text-muted-foreground">تبدیل صدا به متن</p>
              </div>
              <Switch 
                checked={settings.enableVoiceInput !== false}
                onCheckedChange={(checked) => onSettingsChange({...settings, enableVoiceInput: checked})}
              />
            </div>
          </div>

          <Button onClick={handleSave} className="w-full md:w-auto">
            ذخیره تنظیمات هوش مصنوعی
          </Button>
        </CardContent>
      </Card>

      {/* Storage & Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            ذخیره‌سازی و عملکرد
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="maxUploadSize">حداکثر حجم آپلود فایل (مگابایت)</Label>
              <Input 
                id="maxUploadSize"
                type="number"
                value={settings.maxUploadSize || 50}
                onChange={(e) => onSettingsChange({...settings, maxUploadSize: parseInt(e.target.value)})}
                min={10}
                max={100}
                step={5}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cacheTime">زمان کش (ساعت)</Label>
              <Input 
                id="cacheTime"
                type="number"
                value={settings.cacheTime || 2}
                onChange={(e) => onSettingsChange({...settings, cacheTime: parseInt(e.target.value)})}
                min={1}
                max={24}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>فشرده‌سازی تصاویر</Label>
                <p className="text-sm text-muted-foreground">کاهش حجم تصاویر آپلود شده</p>
              </div>
              <Switch 
                checked={settings.compressImages !== false}
                onCheckedChange={(checked) => onSettingsChange({...settings, compressImages: checked})}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>بارگذاری تدریجی</Label>
                <p className="text-sm text-muted-foreground">بارگذاری محتوا به صورت تدریجی</p>
              </div>
              <Switch 
                checked={settings.lazyLoading !== false}
                onCheckedChange={(checked) => onSettingsChange({...settings, lazyLoading: checked})}
              />
            </div>
          </div>

          <Button onClick={handleSave} className="w-full md:w-auto">
            ذخیره تنظیمات ذخیره‌سازی
          </Button>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            تنظیمات امنیتی
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sessionTimeout">زمان انقضای نشست (دقیقه)</Label>
              <Input 
                id="sessionTimeout"
                type="number"
                value={settings.sessionTimeout || 60}
                onChange={(e) => onSettingsChange({...settings, sessionTimeout: parseInt(e.target.value)})}
                min={15}
                max={240}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxLoginAttempts">حداکثر تلاش ورود</Label>
              <Input 
                id="maxLoginAttempts"
                type="number"
                value={settings.maxLoginAttempts || 5}
                onChange={(e) => onSettingsChange({...settings, maxLoginAttempts: parseInt(e.target.value)})}
                min={3}
                max={10}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>احراز هویت دو مرحله‌ای</Label>
                <p className="text-sm text-muted-foreground">افزایش امنیت ورود</p>
              </div>
              <Switch 
                checked={settings.twoFactorAuth || false}
                onCheckedChange={(checked) => onSettingsChange({...settings, twoFactorAuth: checked})}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>رمزنگاری داده‌ها</Label>
                <p className="text-sm text-muted-foreground">رمزنگاری داده‌های حساس</p>
              </div>
              <Switch 
                checked={settings.dataEncryption !== false}
                onCheckedChange={(checked) => onSettingsChange({...settings, dataEncryption: checked})}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>لاگ فعالیت‌ها</Label>
                <p className="text-sm text-muted-foreground">ثبت تمام فعالیت‌های کاربران</p>
              </div>
              <Switch 
                checked={settings.activityLogging !== false}
                onCheckedChange={(checked) => onSettingsChange({...settings, activityLogging: checked})}
              />
            </div>
          </div>

          <Button onClick={handleSave} className="w-full md:w-auto">
            ذخیره تنظیمات امنیتی
          </Button>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            تنظیمات اعلان‌ها
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>اعلان‌های ایمیل</Label>
                <p className="text-sm text-muted-foreground">ارسال ایمیل برای رویدادهای مهم</p>
              </div>
              <Switch 
                checked={settings.emailNotifications !== false}
                onCheckedChange={(checked) => onSettingsChange({...settings, emailNotifications: checked})}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>اعلان‌های مرورگر</Label>
                <p className="text-sm text-muted-foreground">نمایش نوتیفیکیشن در مرورگر</p>
              </div>
              <Switch 
                checked={settings.browserNotifications || false}
                onCheckedChange={(checked) => onSettingsChange({...settings, browserNotifications: checked})}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>اعلان کاربران جدید</Label>
                <p className="text-sm text-muted-foreground">هشدار برای ثبت‌نام کاربران جدید</p>
              </div>
              <Switch 
                checked={settings.newUserNotification !== false}
                onCheckedChange={(checked) => onSettingsChange({...settings, newUserNotification: checked})}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>اعلان خطاها</Label>
                <p className="text-sm text-muted-foreground">هشدار برای خطاهای سیستم</p>
              </div>
              <Switch 
                checked={settings.errorNotification !== false}
                onCheckedChange={(checked) => onSettingsChange({...settings, errorNotification: checked})}
              />
            </div>
          </div>

          <Button onClick={handleSave} className="w-full md:w-auto">
            ذخیره تنظیمات اعلان‌ها
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};