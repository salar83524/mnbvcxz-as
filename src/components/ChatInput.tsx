import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Send, Image as ImageIcon, Loader2, X, Mic, Square } from 'lucide-react';
import { useToast } from './ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ChatInputProps {
  onSendMessage: (content: string, imageUrl?: string) => void;
  loading: boolean;
}

const ChatInput = ({ onSendMessage, loading }: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'خطا',
        description: 'لطفاً یک فایل تصویری انتخاب کنید',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'خطا',
        description: 'حجم فایل نباید بیشتر از 5 مگابایت باشد',
        variant: 'destructive',
      });
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!message.trim() && !imageFile) return;

    let imageUrl: string | undefined;

    if (imageFile) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('کاربر وارد نشده است');

        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('chat-images')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from('chat-images')
          .getPublicUrl(fileName);

        imageUrl = data.publicUrl;
      } catch (error: any) {
        toast({
          title: 'خطا در بارگذاری تصویر',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }
    }

    onSendMessage(message.trim() || 'این تصویر را تحلیل کن', imageUrl);
    setMessage('');
    clearImage();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Convert to WAV format
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        
        stream.getTracks().forEach(track => track.stop());
        
        // Convert to base64 and send for transcription
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('کاربر وارد نشده است');

          toast({
            title: '⏳ در حال پردازش صدا...',
            description: 'لطفاً صبر کنید',
          });

          // Convert blob to base64
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64Audio = reader.result?.toString().split(',')[1];
            
            if (!base64Audio) throw new Error('خطا در پردازش صدا');

            // Send to transcription edge function
            const { data: transcriptData, error: transcriptError } = await supabase.functions.invoke('transcribe-audio', {
              body: { audio: base64Audio }
            });

            if (transcriptError) throw transcriptError;

            toast({
              title: '✅ صدای شما پردازش شد',
              description: 'پیام ارسال می‌شود...',
            });

            // Send transcribed text as message
            onSendMessage(transcriptData.text || '🎤 پیام صوتی دریافت شد');
            setAudioBlob(null);
          };

          reader.onerror = () => {
            throw new Error('خطا در خواندن فایل صوتی');
          };
        } catch (error: any) {
          console.error('Voice message error:', error);
          toast({
            title: 'خطا در پردازش پیام صوتی',
            description: 'لطفاً دوباره تلاش کنید',
            variant: 'destructive',
          });
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      toast({
        title: '🎤 ضبط شروع شد',
        description: 'در حال ضبط صدای شما...',
      });
    } catch (error: any) {
      toast({
        title: 'خطا در دسترسی به میکروفون',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="p-3 md:p-5">
      <div className="max-w-5xl mx-auto space-y-3">
        {imagePreview && (
          <div className="relative inline-block animate-in fade-in zoom-in">
            <img 
              src={imagePreview} 
              alt="Preview" 
              className="w-28 h-28 md:w-36 md:h-36 object-cover rounded-xl shadow-xl border-2 border-primary/30"
            />
            <Button
              size="icon"
              variant="destructive"
              className="absolute -top-2 -left-2 h-7 w-7 rounded-full shadow-lg"
              onClick={clearImage}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        <div className="flex gap-2 md:gap-3 items-end">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="flex-shrink-0 h-11 w-11 md:h-12 md:w-12 rounded-xl border-2 hover:border-primary/50 hover:bg-primary/5 transition-all shadow-md"
          >
            <ImageIcon className="h-5 w-5 md:h-5 md:w-5" />
          </Button>
          <div className="flex-1 relative">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="سوال خود را بپرسید یا تصویر ارسال کنید..."
              className="min-h-[56px] md:min-h-[60px] resize-none text-sm md:text-base rounded-xl border-2 focus:border-primary/50 bg-card/50 backdrop-blur pr-4 pl-4 py-3 shadow-md transition-all"
              disabled={loading}
            />
          </div>
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={loading}
            size="icon"
            className={`flex-shrink-0 h-11 w-11 md:h-12 md:w-12 rounded-xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all ${
              isRecording ? 'bg-destructive hover:bg-destructive/90' : 'bg-secondary hover:bg-secondary/90'
            }`}
          >
            {isRecording ? (
              <Square className="h-5 w-5 text-white" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || (!message.trim() && !imageFile)}
            size="icon"
            className="gradient-primary text-white flex-shrink-0 h-11 w-11 md:h-12 md:w-12 rounded-xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            {isRecording ? 'در حال ضبط...' : 'آماده دریافت پیام'}
          </span>
          <span className="hidden sm:inline">Enter برای ارسال، Shift + Enter برای خط جدید</span>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;