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
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });
      
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
        
        // Stop all tracks
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
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = reader.result?.toString().split(',')[1];
        
        if (!base64Audio) {
          throw new Error('خطا در تبدیل فایل صوتی');
        }

        // Send to transcribe-audio edge function
        const { data, error } = await supabase.functions.invoke('transcribe-audio', {
          body: { audio: base64Audio }
        });

        if (error) throw error;

        if (data?.text) {
          onTranscription(data.text);
          toast.success('متن از صدا استخراج شد');
        } else {
          throw new Error('پاسخی دریافت نشد');
        }
      };
    } catch (error: any) {
      console.error('Transcription error:', error);
      toast.error(error.message || 'خطا در تبدیل صدا به متن');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {!isRecording && !isProcessing && (
        <Button
          variant="outline"
          size="icon"
          onClick={startRecording}
          className="hover:bg-primary/10 transition-colors"
          title="ضبط صدا"
        >
          <Mic className="w-5 h-5" />
        </Button>
      )}
      
      {isRecording && (
        <Button
          variant="destructive"
          size="icon"
          onClick={stopRecording}
          className="animate-pulse"
          title="توقف ضبط"
        >
          <MicOff className="w-5 h-5" />
        </Button>
      )}
      
      {isProcessing && (
        <Button
          variant="outline"
          size="icon"
          disabled
          title="در حال پردازش..."
        >
          <Loader2 className="w-5 h-5 animate-spin" />
        </Button>
      )}
    </div>
  );
};
