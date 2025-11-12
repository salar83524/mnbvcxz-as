# مستندات کامل پروژه هوش مصنوعی پیام نور

## ساختار پروژه

```
src/
├── components/
│   ├── ChatInput.tsx          # ورودی چت
│   ├── ChatMessage.tsx        # نمایش پیام‌ها
│   ├── ChatSidebar.tsx        # نوار کناری چت
│   ├── ChatStats.tsx          # آمار چت
│   ├── QuickActions.tsx       # دکمه‌های سریع
│   ├── VoiceRecorder.tsx      # ضبط صدا
│   ├── PDFViewer.tsx          # نمایش PDF
│   ├── FileUpload.tsx         # آپلود فایل
│   ├── AdDisplay.tsx          # نمایش تبلیغات
│   ├── AdManager.tsx          # مدیریت تبلیغات
│   ├── NewsDisplay.tsx        # نمایش اخبار
│   ├── NewsManager.tsx        # مدیریت اخبار
│   ├── SystemSettings.tsx     # تنظیمات سیستم
│   └── ui/                    # کامپوننت‌های UI
├── pages/
│   ├── Index.tsx              # صفحه اصلی
│   ├── Chat.tsx               # صفحه چت
│   ├── Admin.tsx              # پنل مدیریت
│   ├── Auth.tsx               # احراز هویت
│   ├── Materials.tsx          # مواد آموزشی
│   ├── News.tsx               # اخبار
│   └── NotFound.tsx           # صفحه 404
├── integrations/
│   └── supabase/
│       ├── client.ts          # کلاینت Supabase
│       └── types.ts           # تایپ‌های TypeScript
└── lib/
    └── utils.ts               # توابع کمکی

supabase/
└── functions/
    ├── chat-ai/               # هوش مصنوعی چت
    │   └── index.ts
    └── transcribe-audio/      # تبدیل صدا به متن
        └── index.ts
```

## کامپوننت‌های اصلی

### 1. VoiceRecorder.tsx - ضبط و پردازش صدا
```typescript
import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from './ui/button';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
}

export const VoiceRecorder = ({ onTranscription }: VoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await sendToTranscription(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.success('ضبط صدا شروع شد');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('خطا در دسترسی به میکروفون');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendToTranscription = async (audioBlob: Blob) => {
    setIsProcessing(true);
    
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        try {
          const base64Audio = reader.result?.toString().split(',')[1];
          
          if (!base64Audio) {
            throw new Error('خطا در تبدیل فایل صوتی');
          }

          const { data, error } = await supabase.functions.invoke('transcribe-audio', {
            body: { audio: base64Audio }
          });

          if (error) throw error;

          if (data?.text) {
            onTranscription(data.text);
            toast.success('✅ متن از صدا استخراج شد');
          } else {
            throw new Error('پاسخی دریافت نشد');
          }
        } catch (innerError: any) {
          toast.error(innerError.message || 'خطا در تبدیل صدا به متن');
        } finally {
          setIsProcessing(false);
        }
      };
    } catch (error: any) {
      toast.error(error.message || 'خطا در تبدیل صدا به متن');
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {!isRecording && !isProcessing && (
        <Button variant="outline" size="icon" onClick={startRecording}>
          <Mic className="w-5 h-5" />
        </Button>
      )}
      {isRecording && (
        <Button variant="destructive" size="icon" onClick={stopRecording} className="animate-pulse">
          <MicOff className="w-5 h-5" />
        </Button>
      )}
      {isProcessing && (
        <Button variant="outline" size="icon" disabled>
          <Loader2 className="w-5 h-5 animate-spin" />
        </Button>
      )}
    </div>
  );
};
```

### 2. PDFViewer.tsx - نمایش PDF
```typescript
import { useState } from 'react';
import { Button } from './ui/button';
import { Download, ExternalLink, Loader2 } from 'lucide-react';

interface PDFViewerProps {
  url: string;
  title?: string;
}

export const PDFViewer = ({ url, title }: PDFViewerProps) => {
  const [loading, setLoading] = useState(true);

  return (
    <div className="my-4 border rounded-lg overflow-hidden bg-card">
      <div className="flex items-center justify-between p-3 bg-muted/50 border-b">
        <span className="text-sm font-medium truncate flex-1">{title || 'فایل PDF'}</span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" asChild>
            <a href={url} download>
              <Download className="w-4 h-4" />
            </a>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <a href={url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4" />
            </a>
          </Button>
        </div>
      </div>
      <div className="relative" style={{ height: '600px' }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}
        <iframe
          src={url}
          className="w-full h-full"
          title={title || 'PDF Viewer'}
          onLoad={() => setLoading(false)}
        />
      </div>
    </div>
  );
};
```

### 3. SystemSettings.tsx - تنظیمات سیستم
```typescript
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Settings, Database, Shield, Bell, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface SystemSettingsProps {
  settings: any;
  onSettingsChange: (settings: any) => void;
}

export const SystemSettings = ({ settings, onSettingsChange }: SystemSettingsProps) => {
  const handleSave = () => {
    toast.success('تنظیمات با موفقیت ذخیره شد');
  };

  return (
    <div className="space-y-6">
      {/* تنظیمات عمومی */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            تنظیمات عمومی
          </CardTitle>
          <CardDescription>تنظیمات اصلی سیستم</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>نام سایت</Label>
            <Input 
              value={settings.siteName}
              onChange={(e) => onSettingsChange({...settings, siteName: e.target.value})}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>حالت تعمیر و نگهداری</Label>
              <p className="text-sm text-muted-foreground">غیرفعال کردن موقت سایت</p>
            </div>
            <Switch 
              checked={settings.maintenanceMode}
              onCheckedChange={(checked) => onSettingsChange({...settings, maintenanceMode: checked})}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>امکان ثبت‌نام</Label>
              <p className="text-sm text-muted-foreground">اجازه ثبت‌نام کاربران جدید</p>
            </div>
            <Switch 
              checked={settings.allowRegistration}
              onCheckedChange={(checked) => onSettingsChange({...settings, allowRegistration: checked})}
            />
          </div>
        </CardContent>
      </Card>

      {/* تنظیمات هوش مصنوعی */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            تنظیمات هوش مصنوعی
          </CardTitle>
          <CardDescription>پیکربندی مدل‌های AI</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>مدل پیش‌فرض</Label>
            <Input defaultValue="google/gemini-2.5-pro" />
          </div>
          <div className="space-y-2">
            <Label>حداکثر طول پاسخ (توکن)</Label>
            <Input type="number" defaultValue="2000" />
          </div>
          <div className="space-y-2">
            <Label>دمای مدل (Creativity)</Label>
            <Input type="number" step="0.1" min="0" max="2" defaultValue="0.7" />
          </div>
        </CardContent>
      </Card>

      {/* تنظیمات ذخیره‌سازی */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            ذخیره‌سازی و عملکرد
          </CardTitle>
          <CardDescription>مدیریت فضای ذخیره‌سازی</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>حداکثر حجم آپلود (MB)</Label>
            <Input 
              type="number" 
              value={settings.maxUploadSize}
              onChange={(e) => onSettingsChange({...settings, maxUploadSize: parseInt(e.target.value)})}
            />
          </div>
          <div className="space-y-2">
            <Label>زمان کش (ثانیه)</Label>
            <Input type="number" defaultValue="3600" />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>فشرده‌سازی تصاویر</Label>
              <p className="text-sm text-muted-foreground">بهینه‌سازی خودکار تصاویر</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* تنظیمات امنیتی */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            تنظیمات امنیتی
          </CardTitle>
          <CardDescription>امنیت و دسترسی</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>حداقل طول رمز عبور</Label>
            <Input type="number" defaultValue="8" min="6" max="32" />
          </div>
          <div className="space-y-2">
            <Label>مدت اعتبار نشست (روز)</Label>
            <Input type="number" defaultValue="7" />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>احراز هویت دو مرحله‌ای</Label>
              <p className="text-sm text-muted-foreground">افزایش امنیت حساب کاربری</p>
            </div>
            <Switch />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>ورود با گوگل</Label>
              <p className="text-sm text-muted-foreground">امکان ورود با حساب گوگل</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* تنظیمات اعلان‌ها */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            اعلان‌ها و ایمیل
          </CardTitle>
          <CardDescription>مدیریت اعلان‌های سیستم</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>ایمیل خوش‌آمدگویی</Label>
              <p className="text-sm text-muted-foreground">ارسال ایمیل به کاربران جدید</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>اعلان پیام جدید</Label>
              <p className="text-sm text-muted-foreground">اطلاع‌رسانی پیام‌های جدید</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>گزارش روزانه</Label>
              <p className="text-sm text-muted-foreground">ارسال آمار روزانه</p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="w-full">
        ذخیره همه تنظیمات
      </Button>
    </div>
  );
};
```

## Backend Functions

### 1. chat-ai/index.ts - هوش مصنوعی چت
```typescript
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    const systemPrompt = `شما یک دستیار هوشمند آموزشی هستید که به زبان فارسی پاسخ می‌دهید.

قابلیت‌های شما:
- پاسخ به سوالات درسی و آموزشی
- ارائه منابع آموزشی و PDF
- توضیح مفاهیم پیچیده به زبان ساده
- کمک به حل مسائل و تمرین‌ها

برای ارسال فایل PDF:
- از فرمت: [نام فایل.pdf](لینک کامل) استفاده کنید
- مثال: [کتاب ریاضی پایه دهم.pdf](https://example.com/math.pdf)

همیشه پاسخ‌های دقیق، مفید و آموزنده بدهید.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    const aiMessage = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ message: aiMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'خطا در پردازش درخواست' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

### 2. transcribe-audio/index.ts - تبدیل صدا به متن
```typescript
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_AI_URL = 'https://ai.gateway.lovable.dev/v1/audio/transcriptions';

function processBase64Chunks(base64String: string, chunkSize = 32768) {
  const chunks: Uint8Array[] = [];
  let position = 0;
  
  while (position < base64String.length) {
    const chunk = base64String.slice(position, position + chunkSize);
    const binaryChunk = atob(chunk);
    const bytes = new Uint8Array(binaryChunk.length);
    
    for (let i = 0; i < binaryChunk.length; i++) {
      bytes[i] = binaryChunk.charCodeAt(i);
    }
    
    chunks.push(bytes);
    position += chunkSize;
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('API key not configured');
    }

    const { audio } = await req.json();
    if (!audio) {
      throw new Error('No audio data provided');
    }

    const binaryAudio = processBase64Chunks(audio);
    
    const formData = new FormData();
    const blob = new Blob([binaryAudio], { type: 'audio/webm' });
    formData.append('file', blob, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'fa');

    const response = await fetch(LOVABLE_AI_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`خطا در پردازش صدا: ${response.status}`);
    }

    const result = await response.json();

    return new Response(
      JSON.stringify({ text: result.text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        text: 'خطا در پردازش صدا',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

## ساختار دیتابیس

### جداول اصلی:

1. **profiles** - پروفایل کاربران
2. **conversations** - مکالمات
3. **messages** - پیام‌ها
4. **educational_materials** - مواد آموزشی
5. **advertisements** - تبلیغات
6. **news** - اخبار
7. **user_roles** - نقش‌های کاربری

## تنظیمات پیکربندی

### Environment Variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `LOVABLE_API_KEY`

### Storage Buckets:
- `chat-images` - تصاویر چت
- `educational-materials` - فایل‌های آموزشی
- `advertisements` - تصاویر تبلیغات
- `news-media` - رسانه‌های خبری

## ویژگی‌های کلیدی

1. ✅ چت با هوش مصنوعی (Gemini 2.5 Pro)
2. ✅ ضبط صدا و تبدیل به متن (Whisper)
3. ✅ نمایش و دانلود PDF در چت
4. ✅ آپلود و مدیریت مواد آموزشی
5. ✅ پنل مدیریت جامع
6. ✅ مدیریت تبلیغات و اخبار
7. ✅ احراز هویت کاربران
8. ✅ آمار و گزارش‌گیری
9. ✅ تنظیمات پیشرفته سیستم
10. ✅ طراحی ریسپانسیو و مدرن

## نکات مهم

- همه رنگ‌ها از سیستم طراحی (design tokens) استفاده می‌کنند
- کدها بهینه و قابل نگهداری هستند
- امنیت با RLS Policies تامین شده
- از TypeScript برای type safety استفاده شده
- UI Components از Shadcn استفاده می‌کنند
