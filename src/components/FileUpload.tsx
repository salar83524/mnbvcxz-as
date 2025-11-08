import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Upload, X, Loader2, Image, Video } from 'lucide-react';
import { toast } from 'sonner';

interface FileUploadProps {
  bucket: 'advertisements' | 'news-media';
  accept?: string;
  maxSize?: number; // in MB
  onUploadComplete: (url: string) => void;
  currentUrl?: string;
  label?: string;
}

export const FileUpload = ({ 
  bucket, 
  accept = 'image/*,video/*', 
  maxSize = 10,
  onUploadComplete,
  currentUrl,
  label = 'آپلود فایل'
}: FileUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`حجم فایل نباید بیشتر از ${maxSize}MB باشد`);
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('کاربر وارد نشده است');

      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload file
      const { error: uploadError, data } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      setPreviewUrl(publicUrl);
      onUploadComplete(publicUrl);
      
      toast.success('فایل با موفقیت آپلود شد');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'خطا در آپلود فایل');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onUploadComplete('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isImage = previewUrl && (previewUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) || accept.includes('image'));
  const isVideo = previewUrl && (previewUrl.match(/\.(mp4|webm|ogg)$/i) || accept.includes('video'));

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      
      {previewUrl ? (
        <div className="relative">
          {isImage && (
            <div className="relative w-full h-48 bg-muted rounded-lg overflow-hidden">
              <img 
                src={previewUrl} 
                alt="پیش‌نمایش" 
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          {isVideo && (
            <div className="relative w-full h-48 bg-muted rounded-lg overflow-hidden">
              <video 
                src={previewUrl} 
                controls
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <Button
            variant="destructive"
            size="sm"
            onClick={handleRemove}
            className="mt-2"
          >
            <X className="w-4 h-4 ml-2" />
            حذف فایل
          </Button>
        </div>
      ) : (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
            id={`file-upload-${bucket}`}
          />
          
          <label htmlFor={`file-upload-${bucket}`}>
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors">
              {uploading ? (
                <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
              ) : (
                <>
                  {accept.includes('image') && <Image className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />}
                  {accept.includes('video') && <Video className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />}
                  {!accept.includes('image') && !accept.includes('video') && (
                    <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  )}
                </>
              )}
              
              <p className="text-sm font-medium mb-1">
                {uploading ? 'در حال آپلود...' : 'کلیک کنید یا فایل را بکشید'}
              </p>
              <p className="text-xs text-muted-foreground">
                حداکثر {maxSize}MB
              </p>
            </div>
          </label>
        </div>
      )}
    </div>
  );
};
