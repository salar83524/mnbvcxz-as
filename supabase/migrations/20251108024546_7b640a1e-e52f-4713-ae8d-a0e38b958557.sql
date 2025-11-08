-- Refresh database schema to regenerate types
-- This comment ensures types are regenerated for all existing tables

COMMENT ON TABLE public.advertisements IS 'Stores advertisement information for display in the application';
COMMENT ON TABLE public.educational_materials IS 'Stores educational materials like books and sample questions with file paths';
COMMENT ON TABLE public.conversations IS 'Stores user chat conversations';
COMMENT ON TABLE public.messages IS 'Stores messages within conversations';
COMMENT ON TABLE public.news IS 'Stores news articles';
COMMENT ON TABLE public.profiles IS 'Stores user profile information';
COMMENT ON TABLE public.user_roles IS 'Stores user role assignments';