
-- Migration: 20251108021508

-- Migration: 20251108014058

-- Migration: 20251108012253

-- Migration: 20251108004602

-- Migration: 20251101120125
-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create conversations table
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'مکالمه جدید',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Conversations policies
CREATE POLICY "Users can view their own conversations"
  ON public.conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
  ON public.conversations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations"
  ON public.conversations FOR DELETE
  USING (auth.uid() = user_id);

-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Messages policies
CREATE POLICY "Users can view messages in their conversations"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in their conversations"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own messages"
  ON public.messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own messages"
  ON public.messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

-- Create storage bucket for chat images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-images',
  'chat-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- Storage policies for chat images
CREATE POLICY "Users can upload their own images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'chat-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'chat-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view public chat images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'chat-images');

CREATE POLICY "Users can delete their own images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'chat-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'کاربر')
  );
  RETURN new;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Migration: 20251104112344
-- Create storage bucket for educational materials
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'educational-materials',
  'educational-materials',
  true,
  52428800, -- 50MB limit
  ARRAY['application/pdf']::text[]
) ON CONFLICT (id) DO NOTHING;

-- Create table for storing PDF metadata
CREATE TABLE IF NOT EXISTS public.educational_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.educational_materials ENABLE ROW LEVEL SECURITY;

-- RLS Policies for educational_materials
CREATE POLICY "Anyone can view educational materials"
ON public.educational_materials
FOR SELECT
USING (true);

CREATE POLICY "Users can upload their own materials"
ON public.educational_materials
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own materials"
ON public.educational_materials
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own materials"
ON public.educational_materials
FOR DELETE
USING (auth.uid() = user_id);

-- Storage policies for educational materials
CREATE POLICY "Anyone can view educational materials files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'educational-materials');

CREATE POLICY "Authenticated users can upload educational materials"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'educational-materials' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own uploaded files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'educational-materials' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own uploaded files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'educational-materials' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_educational_materials_updated_at
BEFORE UPDATE ON public.educational_materials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better search performance
CREATE INDEX idx_educational_materials_category ON public.educational_materials(category);
CREATE INDEX idx_educational_materials_user_id ON public.educational_materials(user_id);
CREATE INDEX idx_educational_materials_tags ON public.educational_materials USING GIN(tags);

-- Migration: 20251104112428
-- Fix function search path for security
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;

-- Migration: 20251104113458
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policy for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Update educational_materials policies - only admins can insert
DROP POLICY IF EXISTS "Users can upload their own materials" ON public.educational_materials;
CREATE POLICY "Only admins can upload materials"
ON public.educational_materials
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Update educational_materials policies - only admins can delete
DROP POLICY IF EXISTS "Users can delete their own materials" ON public.educational_materials;
CREATE POLICY "Only admins can delete materials"
ON public.educational_materials
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Update educational_materials policies - only admins can update
DROP POLICY IF EXISTS "Users can update their own materials" ON public.educational_materials;
CREATE POLICY "Only admins can update materials"
ON public.educational_materials
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Migration: 20251106042114
-- Create advertisements table for admin management
CREATE TABLE public.advertisements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  link_url TEXT,
  position TEXT NOT NULL DEFAULT 'sidebar' CHECK (position IN ('sidebar', 'chat_top', 'chat_bottom', 'modal')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  lock_duration INTEGER DEFAULT 0,
  display_order INTEGER NOT NULL DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;

-- Anyone can view active advertisements
CREATE POLICY "Anyone can view active advertisements"
  ON public.advertisements
  FOR SELECT
  USING (
    is_active = true 
    AND (start_date IS NULL OR start_date <= now())
    AND (end_date IS NULL OR end_date >= now())
  );

-- Only admins can manage advertisements
CREATE POLICY "Only admins can manage advertisements"
  ON public.advertisements
  FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Update trigger
CREATE TRIGGER update_advertisements_updated_at
  BEFORE UPDATE ON public.advertisements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_advertisements_active ON public.advertisements(is_active, display_order);
CREATE INDEX idx_advertisements_dates ON public.advertisements(start_date, end_date);


-- Migration: 20251108005724
-- Refresh types
SELECT 1;



-- Migration: 20251108020732
-- Create news table for managing news articles
CREATE TABLE public.news (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  video_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  publish_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

-- Anyone can view published news
CREATE POLICY "Anyone can view published news"
ON public.news
FOR SELECT
USING (is_published = true AND (publish_date IS NULL OR publish_date <= now()));

-- Only admins can manage news
CREATE POLICY "Only admins can manage news"
ON public.news
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_news_updated_at
BEFORE UPDATE ON public.news
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();


-- Migration: 20251108022626
-- Create storage buckets for advertisements and news media
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('advertisements', 'advertisements', true),
  ('news-media', 'news-media', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for advertisements bucket
CREATE POLICY "Anyone can view advertisement files"
ON storage.objects FOR SELECT
USING (bucket_id = 'advertisements');

CREATE POLICY "Admins can upload advertisement files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'advertisements' AND
  (SELECT has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "Admins can update advertisement files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'advertisements' AND
  (SELECT has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "Admins can delete advertisement files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'advertisements' AND
  (SELECT has_role(auth.uid(), 'admin'::app_role))
);

-- RLS policies for news-media bucket
CREATE POLICY "Anyone can view news media files"
ON storage.objects FOR SELECT
USING (bucket_id = 'news-media');

CREATE POLICY "Admins can upload news media files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'news-media' AND
  (SELECT has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "Admins can update news media files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'news-media' AND
  (SELECT has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "Admins can delete news media files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'news-media' AND
  (SELECT has_role(auth.uid(), 'admin'::app_role))
);
