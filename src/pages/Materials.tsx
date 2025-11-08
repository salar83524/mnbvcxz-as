import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, Trash2, Download, ArrowLeft, Eye } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface Material {
  id: string;
  title: string;
  description: string | null;
  file_path: string;
  file_size: number;
  category: string;
  tags: string[];
  created_at: string;
}

const Materials = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [downloading, setDownloading] = useState<Set<string>>(new Set());

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('other');
  const [tags, setTags] = useState('');
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    checkAdminRole();
    loadMaterials();
  }, []);

  const checkAdminRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsAdmin(false);
        setCheckingAdmin(false);
        return;
      }

      const { data, error } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });

      if (error) throw error;
      setIsAdmin(data === true);
    } catch (error: any) {
      console.error('Error checking admin role:', error);
      setIsAdmin(false);
    } finally {
      setCheckingAdmin(false);
    }
  };

  const loadMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from('educational_materials')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMaterials(data || []);
    } catch (error: any) {
      toast({
        title: 'خطا در بارگذاری',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        toast({
          title: 'فرمت نامعتبر',
          description: 'لطفاً فقط فایل PDF آپلود کنید',
          variant: 'destructive',
        });
        return;
      }
      if (selectedFile.size > 200 * 1024 * 1024) {
        toast({
          title: 'حجم زیاد',
          description: 'حجم فایل نباید بیشتر از ۲۰۰ مگابایت باشد',
          variant: 'destructive',
        });
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file || !title.trim()) {
      toast({
        title: 'اطلاعات ناقص',
        description: 'لطفاً عنوان و فایل را وارد کنید',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('کاربر وارد نشده است');

      const fileExt = 'pdf';
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      // Use resumable upload for better performance with large files
      const chunkSize = 10 * 1024 * 1024; // 10MB chunks for much faster upload
      
      if (file.size > chunkSize) {
        // Parallel chunked upload for large files (faster)
        let uploadedBytes = 0;
        const totalChunks = Math.ceil(file.size / chunkSize);
        const uploadPromises = [];
        
        for (let i = 0; i < totalChunks; i++) {
          const start = i * chunkSize;
          const end = Math.min(start + chunkSize, file.size);
          const chunk = file.slice(start, end);
          
          const uploadPromise = supabase.storage
            .from('educational-materials')
            .upload(fileName, chunk, {
              upsert: i > 0,
              contentType: 'application/pdf',
              cacheControl: '31536000', // 1 year for speed
            })
            .then(() => {
              uploadedBytes += chunk.size;
              const progress = Math.round((uploadedBytes / file.size) * 100);
              setUploadProgress(progress);
            });

          uploadPromises.push(uploadPromise);
          
          // Process 3 chunks in parallel for optimal speed
          if (uploadPromises.length >= 3 || i === totalChunks - 1) {
            await Promise.all(uploadPromises);
            uploadPromises.length = 0;
          }
        }
      } else {
        // Direct upload for smaller files
        const { error: uploadError } = await supabase.storage
          .from('educational-materials')
          .upload(fileName, file, {
            cacheControl: '31536000', // 1 year for speed
            upsert: false,
            contentType: 'application/pdf',
          });

        if (uploadError) throw uploadError;
        setUploadProgress(100);
      }

      // Save metadata to database
      const tagsArray = tags.split(',').map(t => t.trim()).filter(t => t);
      const { error: dbError } = await supabase
        .from('educational_materials')
        .insert({
          user_id: user.id,
          title: title.trim(),
          description: description.trim() || null,
          file_path: fileName,
          file_size: file.size,
          category,
          tags: tagsArray,
        });

      if (dbError) throw dbError;

      toast({
        title: '✅ آپلود موفق',
        description: 'فایل با سرعت بالا آپلود شد',
      });

      // Reset form
      setTitle('');
      setDescription('');
      setCategory('other');
      setTags('');
      setFile(null);
      setUploadProgress(0);
      
      // Reload materials
      loadMaterials();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'خطا در آپلود',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (material: Material) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('کاربر وارد نشده است');

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('educational-materials')
        .remove([material.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('educational_materials')
        .delete()
        .eq('id', material.id);

      if (dbError) throw dbError;

      toast({
        title: 'موفقیت',
        description: 'فایل حذف شد',
      });

      loadMaterials();
    } catch (error: any) {
      toast({
        title: 'خطا در حذف',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDownload = async (material: Material) => {
    if (downloading.has(material.id)) return;

    try {
      setDownloading(prev => new Set(prev).add(material.id));

      toast({
        title: '⏬ شروع دانلود',
        description: 'دانلود با سرعت بالا...',
      });

      // Use signed URL for authenticated fast download with cache
      const { data: urlData, error: urlError } = await supabase.storage
        .from('educational-materials')
        .createSignedUrl(material.file_path, 3600); // 1 hour expiration

      if (urlError || !urlData?.signedUrl) {
        throw new Error('خطا در ایجاد لینک دانلود');
      }

      // Fetch with cache for speed
      const response = await fetch(urlData.signedUrl, {
        cache: 'force-cache',
      });
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${material.title}.pdf`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);

      toast({
        title: '✅ دانلود کامل شد',
        description: 'فایل با موفقیت دانلود شد',
      });
    } catch (error: any) {
      console.error('Download error:', error);
      toast({
        title: 'خطا در دانلود',
        description: 'لطفاً دوباره تلاش کنید',
        variant: 'destructive',
      });
    } finally {
      setTimeout(() => {
        setDownloading(prev => {
          const newSet = new Set(prev);
          newSet.delete(material.id);
          return newSet;
        });
      }, 500);
    }
  };

  const handlePreview = (material: Material) => {
    try {
      const { data } = supabase.storage
        .from('educational-materials')
        .getPublicUrl(material.file_path);
      
      window.open(data.publicUrl, '_blank', 'noopener,noreferrer');
    } catch (error: any) {
      toast({
        title: 'خطا در نمایش',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const filteredMaterials = materials.filter(material => {
    const matchesCategory = selectedCategory === 'all' || material.category === selectedCategory;
    return matchesCategory;
  });

  const categories = [
    { value: 'all', label: 'همه' },
    { value: 'textbook', label: 'کتاب درسی' },
    { value: 'exam', label: 'نمونه سوال' },
    { value: 'summary', label: 'خلاصه درس' },
    { value: 'other', label: 'سایر' },
  ];

  if (loading || checkingAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="animate-pulse-glow text-primary text-xl">در حال بارگذاری...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="gap-2 transition-spring hover:scale-105"
          >
            <ArrowLeft className="w-4 h-4" />
            بازگشت به چت
          </Button>
        </div>

        {/* Upload Section - Only for Admins */}
        {isAdmin && (
          <Card className="shadow-elegant border-2 border-border/60 transition-spring hover:shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Upload className="w-6 h-6 text-primary animate-float" />
              آپلود مواد آموزشی
            </CardTitle>
            <CardDescription>
              کتاب‌های درسی و نمونه سوالات خود را اینجا آپلود کنید تا هوش مصنوعی بتواند از آنها استفاده کند
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">عنوان *</label>
                <Input
                  placeholder="مثال: کتاب ریاضی ۱"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="transition-spring hover:shadow-md focus:shadow-lg"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">دسته‌بندی</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="transition-spring hover:shadow-md">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="textbook">کتاب درسی</SelectItem>
                    <SelectItem value="exam">نمونه سوال</SelectItem>
                    <SelectItem value="summary">خلاصه درس</SelectItem>
                    <SelectItem value="other">سایر</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">توضیحات</label>
              <Textarea
                placeholder="توضیحات اختیاری..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="transition-spring hover:shadow-md focus:shadow-lg"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">برچسب‌ها (با کاما جدا کنید)</label>
              <Input
                placeholder="مثال: ریاضی, جبر, فصل اول"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="transition-spring hover:shadow-md focus:shadow-lg"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">فایل PDF *</label>
              <Input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="transition-spring hover:shadow-md cursor-pointer"
              />
              {file && (
                <p className="text-sm text-muted-foreground">
                  انتخاب شده: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="w-full space-y-2">
                <div className="flex justify-between text-sm">
                  <span>در حال آپلود...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full gradient-primary transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
            
            <Button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full md:w-auto shadow-elegant transition-spring hover:scale-105 hover:shadow-2xl"
            >
              {uploading ? `آپلود... ${uploadProgress}%` : 'آپلود فایل'}
            </Button>
          </CardContent>
        </Card>
        )}

        {/* Materials List */}
        <Card className="shadow-elegant border-2 border-border/60">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <FileText className="w-6 h-6 text-primary animate-float" />
                مواد آموزشی
              </CardTitle>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px] transition-spring hover:shadow-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {filteredMaterials.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>هنوز مواد آموزشی آپلود نشده است</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMaterials.map((material) => (
                  <Card key={material.id} className="shadow-md border transition-spring hover:shadow-2xl hover:scale-[1.02]">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-start gap-2">
                        <FileText className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                        <span className="line-clamp-2">{material.title}</span>
                      </CardTitle>
                      {material.description && (
                        <CardDescription className="line-clamp-2">
                          {material.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="transition-spring hover:scale-105">
                          {categories.find(c => c.value === material.category)?.label}
                        </Badge>
                        {material.tags.map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="transition-spring hover:scale-105">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {(material.file_size / 1024 / 1024).toFixed(2)} MB
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePreview(material)}
                          className="flex-1 gap-2 transition-spring hover:scale-105"
                        >
                          <Eye className="w-4 h-4" />
                          مشاهده
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleDownload(material)}
                          disabled={downloading.has(material.id)}
                          className="flex-1 gap-2 transition-spring hover:scale-105"
                        >
                          <Download className="w-4 h-4" />
                          {downloading.has(material.id) ? 'در حال دانلود...' : 'دانلود'}
                        </Button>
                        {isAdmin && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(material)}
                            className="gap-2 transition-spring hover:scale-105"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Materials;
