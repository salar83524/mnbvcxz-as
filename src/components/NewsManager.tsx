import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Trash2, Edit, Plus, Image, Video } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUpload } from "@/components/FileUpload";

interface News {
  id: string;
  title: string;
  content: string;
  image_url?: string;
  video_url?: string;
  is_published: boolean;
  publish_date?: string;
  created_at: string;
}

export function NewsManager() {
  const [news, setNews] = useState<News[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingNews, setEditingNews] = useState<News | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    image_url: "",
    video_url: "",
    is_published: false,
    publish_date: "",
  });

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    try {
      const { data, error } = await supabase
        .from("news")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNews(data || []);
    } catch (error: any) {
      toast.error("خطا در بارگذاری اخبار");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("کاربر وارد نشده است");

      const newsData = {
        ...formData,
        user_id: user.id,
        publish_date: formData.publish_date || null,
      };

      if (editingNews) {
        const { error } = await supabase
          .from("news")
          .update(newsData)
          .eq("id", editingNews.id);

        if (error) throw error;
        toast.success("خبر با موفقیت ویرایش شد");
      } else {
        const { error } = await supabase
          .from("news")
          .insert([newsData]);

        if (error) throw error;
        toast.success("خبر با موفقیت ایجاد شد");
      }

      setIsDialogOpen(false);
      resetForm();
      loadNews();
    } catch (error: any) {
      toast.error(error.message || "خطا در ذخیره خبر");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("آیا از حذف این خبر اطمینان دارید؟")) return;

    try {
      const { error } = await supabase
        .from("news")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("خبر حذف شد");
      loadNews();
    } catch (error: any) {
      toast.error("خطا در حذف خبر");
    }
  };

  const handleEdit = (newsItem: News) => {
    setEditingNews(newsItem);
    setFormData({
      title: newsItem.title,
      content: newsItem.content,
      image_url: newsItem.image_url || "",
      video_url: newsItem.video_url || "",
      is_published: newsItem.is_published,
      publish_date: newsItem.publish_date || "",
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      image_url: "",
      video_url: "",
      is_published: false,
      publish_date: "",
    });
    setEditingNews(null);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  if (isLoading) {
    return <div className="text-center p-4">در حال بارگذاری...</div>;
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">مدیریت اخبار</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 ml-2" />
              خبر جدید
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingNews ? "ویرایش خبر" : "ایجاد خبر جدید"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">عنوان</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="content">محتوا</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  rows={6}
                  required
                />
              </div>

              <Tabs defaultValue="upload" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="upload">آپلود فایل</TabsTrigger>
                  <TabsTrigger value="link">لینک</TabsTrigger>
                </TabsList>
                
                <TabsContent value="upload" className="space-y-4">
                  <FileUpload
                    bucket="news-media"
                    accept="image/*"
                    maxSize={10}
                    onUploadComplete={(url) => setFormData({ ...formData, image_url: url })}
                    currentUrl={formData.image_url}
                    label="آپلود تصویر"
                  />
                  
                  <FileUpload
                    bucket="news-media"
                    accept="video/*"
                    maxSize={50}
                    onUploadComplete={(url) => setFormData({ ...formData, video_url: url })}
                    currentUrl={formData.video_url}
                    label="آپلود ویدیو"
                  />
                </TabsContent>
                
                <TabsContent value="link" className="space-y-4">
                  <div>
                    <Label htmlFor="image_url" className="flex items-center gap-2">
                      <Image className="h-4 w-4" />
                      لینک تصویر
                    </Label>
                    <Input
                      id="image_url"
                      type="url"
                      value={formData.image_url}
                      onChange={(e) =>
                        setFormData({ ...formData, image_url: e.target.value })
                      }
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  <div>
                    <Label htmlFor="video_url" className="flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      لینک ویدئو
                    </Label>
                    <Input
                      id="video_url"
                      type="url"
                      value={formData.video_url}
                      onChange={(e) =>
                        setFormData({ ...formData, video_url: e.target.value })
                      }
                      placeholder="https://example.com/video.mp4"
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div>
                <Label htmlFor="publish_date">تاریخ انتشار (اختیاری)</Label>
                <Input
                  id="publish_date"
                  type="datetime-local"
                  value={formData.publish_date}
                  onChange={(e) =>
                    setFormData({ ...formData, publish_date: e.target.value })
                  }
                />
              </div>

              <div className="flex items-center space-x-2 space-x-reverse">
                <Switch
                  id="is_published"
                  checked={formData.is_published}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_published: checked })
                  }
                />
                <Label htmlFor="is_published">منتشر شده</Label>
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  انصراف
                </Button>
                <Button type="submit">
                  {editingNews ? "ذخیره تغییرات" : "ایجاد خبر"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {news.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              هیچ خبری یافت نشد
            </CardContent>
          </Card>
        ) : (
          news.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <div className="flex gap-2 mt-2">
                      {item.is_published ? (
                        <span className="text-xs bg-green-500/20 text-green-700 dark:text-green-400 px-2 py-1 rounded">
                          منتشر شده
                        </span>
                      ) : (
                        <span className="text-xs bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 px-2 py-1 rounded">
                          پیش‌نویس
                        </span>
                      )}
                      {item.image_url && (
                        <span className="text-xs bg-blue-500/20 text-blue-700 dark:text-blue-400 px-2 py-1 rounded flex items-center gap-1">
                          <Image className="h-3 w-3" />
                          تصویر
                        </span>
                      )}
                      {item.video_url && (
                        <span className="text-xs bg-purple-500/20 text-purple-700 dark:text-purple-400 px-2 py-1 rounded flex items-center gap-1">
                          <Video className="h-3 w-3" />
                          ویدئو
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(item)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {item.content}
                </p>
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="mt-4 rounded-lg max-h-48 object-cover"
                  />
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  تاریخ ایجاد: {new Date(item.created_at).toLocaleDateString("fa-IR")}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
