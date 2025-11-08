import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { useToast } from './ui/use-toast';
import { Plus, Edit, Trash2, Image as ImageIcon } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { FileUpload } from './FileUpload';

interface Advertisement {
  id: string;
  title: string;
  content: string;
  image_url?: string;
  link_url?: string;
  position: string;
  is_active: boolean;
  lock_duration: number;
  display_order: number;
  start_date?: string;
  end_date?: string;
}

const AdManager = () => {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image_url: '',
    link_url: '',
    position: 'sidebar',
    is_active: true,
    lock_duration: 0,
    display_order: 0,
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    checkAdminStatus();
    loadAds();
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

  const loadAds = async () => {
    const { data, error } = await supabase
      .from('advertisements')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      toast({
        title: 'خطا در بارگذاری تبلیغات',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setAds(data || []);
  };

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const adData = {
      ...formData,
      user_id: user.id,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
    };

    if (editingAd) {
      const { error } = await supabase
        .from('advertisements')
        .update(adData)
        .eq('id', editingAd.id);

      if (error) {
        toast({
          title: 'خطا در ویرایش',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: '✅ ویرایش موفق',
        description: 'تبلیغ با موفقیت ویرایش شد',
      });
    } else {
      const { error } = await supabase
        .from('advertisements')
        .insert([adData]);

      if (error) {
        toast({
          title: 'خطا در ایجاد',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: '✅ ایجاد موفق',
        description: 'تبلیغ با موفقیت ایجاد شد',
      });
    }

    resetForm();
    loadAds();
    setIsDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('advertisements')
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
      title: '🗑️ حذف موفق',
      description: 'تبلیغ با موفقیت حذف شد',
    });
    loadAds();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      image_url: '',
      link_url: '',
      position: 'sidebar',
      is_active: true,
      lock_duration: 0,
      display_order: 0,
      start_date: '',
      end_date: '',
    });
    setEditingAd(null);
  };

  const openEditDialog = (ad: Advertisement) => {
    setEditingAd(ad);
    setFormData({
      title: ad.title,
      content: ad.content,
      image_url: ad.image_url || '',
      link_url: ad.link_url || '',
      position: ad.position,
      is_active: ad.is_active,
      lock_duration: ad.lock_duration,
      display_order: ad.display_order,
      start_date: ad.start_date || '',
      end_date: ad.end_date || '',
    });
    setIsDialogOpen(true);
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold gradient-text">مدیریت تبلیغات</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary" onClick={resetForm}>
              <Plus className="ml-2 h-4 w-4" />
              تبلیغ جدید
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>{editingAd ? 'ویرایش تبلیغ' : 'ایجاد تبلیغ جدید'}</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh]">
              <div className="space-y-4 p-4">
                <div>
                  <Label htmlFor="title">عنوان</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="عنوان تبلیغ"
                  />
                </div>

                <div>
                  <Label htmlFor="content">محتوا</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="محتوای تبلیغ"
                    rows={4}
                  />
                </div>

                <Tabs defaultValue="upload" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upload">آپلود فایل</TabsTrigger>
                    <TabsTrigger value="link">لینک تصویر</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="upload" className="mt-4">
                    <FileUpload
                      bucket="advertisements"
                      accept="image/*,video/*"
                      maxSize={10}
                      onUploadComplete={(url) => setFormData({ ...formData, image_url: url })}
                      currentUrl={formData.image_url}
                      label="آپلود تصویر یا ویدیو"
                    />
                  </TabsContent>
                  
                  <TabsContent value="link" className="mt-4">
                    <div>
                      <Label htmlFor="image_url">آدرس تصویر</Label>
                      <Input
                        id="image_url"
                        value={formData.image_url}
                        onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                <div>
                  <Label htmlFor="link_url">لینک</Label>
                  <Input
                    id="link_url"
                    value={formData.link_url}
                    onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="position">موقعیت نمایش</Label>
                  <Select value={formData.position} onValueChange={(value) => setFormData({ ...formData, position: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sidebar">منوی جانبی</SelectItem>
                      <SelectItem value="chat_top">بالای چت</SelectItem>
                      <SelectItem value="chat_bottom">پایین چت</SelectItem>
                      <SelectItem value="modal">پنجره مودال</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2 space-x-reverse">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">فعال</Label>
                </div>

                <div>
                  <Label htmlFor="lock_duration">مدت قفل (ثانیه)</Label>
                  <Input
                    id="lock_duration"
                    type="number"
                    value={formData.lock_duration}
                    onChange={(e) => setFormData({ ...formData, lock_duration: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div>
                  <Label htmlFor="display_order">ترتیب نمایش</Label>
                  <Input
                    id="display_order"
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div>
                  <Label htmlFor="start_date">تاریخ شروع</Label>
                  <Input
                    id="start_date"
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="end_date">تاریخ پایان</Label>
                  <Input
                    id="end_date"
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>

                <Button onClick={handleSave} className="w-full gradient-primary">
                  {editingAd ? 'ذخیره تغییرات' : 'ایجاد تبلیغ'}
                </Button>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      <ScrollArea className="h-[600px]">
        <div className="space-y-3">
          {ads.map((ad) => (
            <div key={ad.id} className="p-4 border border-border rounded-xl bg-card/50 backdrop-blur hover:shadow-lg transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {ad.image_url && (
                    <img src={ad.image_url} alt={ad.title} className="w-full h-32 object-cover rounded-lg mb-3" />
                  )}
                  <h3 className="font-bold text-lg mb-2">{ad.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{ad.content}</p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className={`px-2 py-1 rounded ${ad.is_active ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-600'}`}>
                      {ad.is_active ? 'فعال' : 'غیرفعال'}
                    </span>
                    <span className="px-2 py-1 rounded bg-primary/20 text-primary">
                      {ad.position === 'sidebar' ? 'منوی جانبی' : ad.position === 'chat_top' ? 'بالای چت' : ad.position === 'chat_bottom' ? 'پایین چت' : 'مودال'}
                    </span>
                    {ad.lock_duration > 0 && (
                      <span className="px-2 py-1 rounded bg-secondary/20">
                        قفل: {ad.lock_duration}ث
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => openEditDialog(ad)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => handleDelete(ad.id)} className="hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default AdManager;
