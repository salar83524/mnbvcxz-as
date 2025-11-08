import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Calendar, Image as ImageIcon, Video } from 'lucide-react';
import { toast } from 'sonner';

interface NewsItem {
  id: string;
  title: string;
  content: string;
  image_url?: string;
  video_url?: string;
  is_published: boolean;
  publish_date?: string;
  created_at: string;
}

const News = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    try {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNews(data || []);
    } catch (error: any) {
      toast.error('خطا در بارگذاری اخبار');
    } finally {
      setLoading(false);
    }
  };

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
            <div>
              <h1 className="text-2xl md:text-3xl font-bold gradient-text font-decorative">
                اخبار و اطلاعیه‌ها
              </h1>
              <p className="text-sm text-muted-foreground">آخرین اخبار و اطلاعات دانشگاه</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">در حال بارگذاری اخبار...</p>
            </div>
          </div>
        ) : news.length === 0 ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="max-w-md w-full">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4">
                  <ImageIcon className="w-8 h-8 text-white" />
                </div>
                <p className="text-lg font-semibold mb-2">خبری موجود نیست</p>
                <p className="text-sm text-muted-foreground">
                  در حال حاضر هیچ خبر منتشر شده‌ای وجود ندارد
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {news.map((item) => (
              <Card 
                key={item.id} 
                className="group hover:shadow-xl transition-all duration-300 overflow-hidden border-2 hover:border-primary/50"
              >
                {item.image_url && (
                  <div className="aspect-video overflow-hidden bg-muted">
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                )}
                {item.video_url && !item.image_url && (
                  <div className="aspect-video overflow-hidden bg-muted relative">
                    <video
                      src={item.video_url}
                      className="w-full h-full object-cover"
                      controls
                    />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                    {item.title}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {new Date(item.created_at).toLocaleDateString('fa-IR')}
                  </div>
                  <div className="flex gap-2 mt-2">
                    {item.image_url && (
                      <span className="text-xs bg-blue-500/20 text-blue-700 dark:text-blue-400 px-2 py-1 rounded flex items-center gap-1">
                        <ImageIcon className="h-3 w-3" />
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
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {item.content}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default News;
