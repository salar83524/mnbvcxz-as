import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

const Documentation = () => {
  const generatePDF = () => {
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      const lineHeight = 7;
      let yPosition = 20;

      // تنظیم فونت
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      
      // عنوان اصلی
      doc.text('مستندات پروژه هوش مصنوعی پیام نور', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // بخش ساختار پروژه
      doc.setFontSize(16);
      doc.text('ساختار پروژه', margin, yPosition);
      yPosition += 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);

      const structure = [
        'src/components/',
        '  - ChatInput.tsx (ورودی چت)',
        '  - ChatMessage.tsx (نمایش پیام‌ها)',
        '  - ChatSidebar.tsx (نوار کناری)',
        '  - ChatStats.tsx (آمار چت)',
        '  - QuickActions.tsx (دکمه‌های سریع)',
        '  - VoiceRecorder.tsx (ضبط صدا)',
        '  - PDFViewer.tsx (نمایش PDF)',
        '  - FileUpload.tsx (آپلود فایل)',
        '  - AdManager.tsx (مدیریت تبلیغات)',
        '  - NewsManager.tsx (مدیریت اخبار)',
        '  - SystemSettings.tsx (تنظیمات)',
        '',
        'src/pages/',
        '  - Index.tsx (صفحه اصلی)',
        '  - Chat.tsx (صفحه چت)',
        '  - Admin.tsx (پنل مدیریت)',
        '  - Auth.tsx (احراز هویت)',
        '  - Materials.tsx (مواد آموزشی)',
        '  - News.tsx (اخبار)',
      ];

      structure.forEach(line => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(line, margin, yPosition);
        yPosition += lineHeight;
      });

      // ویژگی‌های کلیدی
      yPosition += 5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('ویژگی‌های کلیدی', margin, yPosition);
      yPosition += 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);

      const features = [
        '✓ چت با هوش مصنوعی (Gemini 2.5 Pro)',
        '✓ ضبط صدا و تبدیل به متن (Whisper)',
        '✓ نمایش و دانلود PDF در چت',
        '✓ آپلود فایل تا 50MB',
        '✓ پنل مدیریت جامع',
        '✓ مدیریت تبلیغات و اخبار',
        '✓ احراز هویت کاربران',
        '✓ آمار و گزارش‌گیری',
        '✓ تنظیمات پیشرفته سیستم',
        '✓ طراحی ریسپانسیو',
      ];

      features.forEach(feature => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(feature, margin, yPosition);
        yPosition += lineHeight;
      });

      // جداول دیتابیس
      doc.addPage();
      yPosition = 20;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('ساختار دیتابیس', margin, yPosition);
      yPosition += 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);

      const tables = [
        'جداول اصلی:',
        '  - profiles (پروفایل کاربران)',
        '  - conversations (مکالمات)',
        '  - messages (پیام‌ها)',
        '  - educational_materials (مواد آموزشی)',
        '  - advertisements (تبلیغات)',
        '  - news (اخبار)',
        '  - user_roles (نقش‌های کاربری)',
        '',
        'Storage Buckets:',
        '  - chat-images (تصاویر چت)',
        '  - educational-materials (فایل‌های آموزشی)',
        '  - advertisements (تصاویر تبلیغات)',
        '  - news-media (رسانه‌های خبری)',
      ];

      tables.forEach(line => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(line, margin, yPosition);
        yPosition += lineHeight;
      });

      // Edge Functions
      yPosition += 5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('Edge Functions', margin, yPosition);
      yPosition += 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);

      const functions = [
        '1. chat-ai',
        '   - هوش مصنوعی چت با Gemini',
        '   - پردازش پیام‌ها و تولید پاسخ',
        '   - پشتیبانی از ارسال PDF',
        '',
        '2. transcribe-audio',
        '   - تبدیل صدا به متن',
        '   - استفاده از Whisper AI',
        '   - پشتیبانی زبان فارسی',
      ];

      functions.forEach(line => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(line, margin, yPosition);
        yPosition += lineHeight;
      });

      // تنظیمات
      yPosition += 5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('تنظیمات محیطی', margin, yPosition);
      yPosition += 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);

      const configs = [
        'Environment Variables:',
        '  - VITE_SUPABASE_URL',
        '  - VITE_SUPABASE_PUBLISHABLE_KEY',
        '  - LOVABLE_API_KEY',
        '',
        'AI Models:',
        '  - google/gemini-2.5-pro (قدرتمندترین)',
        '  - google/gemini-2.5-flash (سریع)',
        '  - openai/gpt-5 (دقت بالا)',
        '  - whisper-1 (صدا به متن)',
      ];

      configs.forEach(line => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(line, margin, yPosition);
        yPosition += lineHeight;
      });

      // امنیت
      doc.addPage();
      yPosition = 20;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('امنیت', margin, yPosition);
      yPosition += 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);

      const security = [
        '- Row Level Security (RLS) فعال',
        '- احراز هویت با Supabase Auth',
        '- نقش‌های کاربری (Admin, User)',
        '- رمزگذاری اطلاعات',
        '- محدودیت دسترسی به فایل‌ها',
      ];

      security.forEach(line => {
        doc.text(line, margin, yPosition);
        yPosition += lineHeight;
      });

      // Footer
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(
          `صفحه ${i} از ${totalPages}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      // ذخیره PDF
      doc.save('پروژه-پیام-نور-مستندات.pdf');
      toast.success('فایل PDF با موفقیت دانلود شد');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('خطا در ایجاد PDF');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="border-2">
          <CardHeader className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full gradient-primary flex items-center justify-center">
              <FileText className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-3xl gradient-text">
              مستندات پروژه
            </CardTitle>
            <p className="text-muted-foreground">
              هوش مصنوعی پیام نور - مستندات کامل
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-6 space-y-4">
              <h3 className="font-bold text-lg">محتویات فایل PDF:</h3>
              <ul className="space-y-2 text-sm">
                <li>✓ ساختار کامل پروژه</li>
                <li>✓ لیست تمام کامپوننت‌ها</li>
                <li>✓ ویژگی‌های کلیدی</li>
                <li>✓ ساختار دیتابیس و جداول</li>
                <li>✓ Edge Functions</li>
                <li>✓ تنظیمات و پیکربندی</li>
                <li>✓ مدل‌های هوش مصنوعی</li>
                <li>✓ تنظیمات امنیتی</li>
              </ul>
            </div>

            <Button 
              onClick={generatePDF} 
              className="w-full h-14 text-lg gap-3"
              size="lg"
            >
              <Download className="w-5 h-5" />
              دانلود فایل PDF
            </Button>

            <div className="grid grid-cols-2 gap-4 text-center text-sm">
              <div className="p-4 bg-primary/10 rounded-lg">
                <p className="font-bold text-2xl gradient-text">10+</p>
                <p className="text-muted-foreground">کامپوننت اصلی</p>
              </div>
              <div className="p-4 bg-primary/10 rounded-lg">
                <p className="font-bold text-2xl gradient-text">7</p>
                <p className="text-muted-foreground">جدول دیتابیس</p>
              </div>
              <div className="p-4 bg-primary/10 rounded-lg">
                <p className="font-bold text-2xl gradient-text">2</p>
                <p className="text-muted-foreground">Edge Function</p>
              </div>
              <div className="p-4 bg-primary/10 rounded-lg">
                <p className="font-bold text-2xl gradient-text">4</p>
                <p className="text-muted-foreground">Storage Bucket</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Documentation;
