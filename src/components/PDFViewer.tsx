import { useState } from 'react';
import { Download, ExternalLink, FileText, Loader2 } from 'lucide-react';
import { Button } from './ui/button';

interface PDFViewerProps {
  url: string;
  fileName: string;
  title?: string;
}

export const PDFViewer = ({ url, fileName, title }: PDFViewerProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenNew = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="my-4 w-full max-w-4xl rounded-2xl overflow-hidden border-2 border-primary/20 shadow-xl bg-card/80 backdrop-blur-sm animate-in fade-in zoom-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center shadow-md">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <h3 className="font-bold text-sm md:text-base line-clamp-1">
              {title || fileName}
            </h3>
            <p className="text-xs text-muted-foreground">کلیک کنید برای مشاهده یا دانلود</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleOpenNew}
            className="hover:bg-primary/10 transition-smooth"
            title="باز کردن در تب جدید"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownload}
            className="hover:bg-primary/10 transition-smooth"
            title="دانلود فایل"
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* PDF Preview */}
      <div className="relative bg-muted/30">
        {loading && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-card/50 backdrop-blur-sm z-10">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">در حال بارگذاری...</p>
            </div>
          </div>
        )}
        
        {error ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-4">
            <FileText className="w-16 h-16 text-muted-foreground" />
            <p className="text-muted-foreground text-center">
              پیش‌نمایش در دسترس نیست
            </p>
            <Button
              onClick={handleDownload}
              className="gradient-primary text-white shadow-md hover:shadow-lg transition-smooth"
            >
              <Download className="w-4 h-4 ml-2" />
              دانلود فایل
            </Button>
          </div>
        ) : (
          <iframe
            src={`${url}#toolbar=0`}
            className="w-full h-[500px] md:h-[600px]"
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setError(true);
            }}
            title={fileName}
          />
        )}
      </div>

      {/* Actions Footer */}
      <div className="flex items-center justify-between p-4 bg-muted/20 border-t border-border/50">
        <Button
          variant="outline"
          size="sm"
          onClick={handleOpenNew}
          className="gap-2 hover:bg-primary/10 transition-smooth"
        >
          <ExternalLink className="w-4 h-4" />
          مشاهده کامل
        </Button>
        <Button
          onClick={handleDownload}
          size="sm"
          className="gradient-primary text-white shadow-md hover:shadow-lg transition-smooth gap-2"
        >
          <Download className="w-4 h-4" />
          دانلود سریع
        </Button>
      </div>
    </div>
  );
};