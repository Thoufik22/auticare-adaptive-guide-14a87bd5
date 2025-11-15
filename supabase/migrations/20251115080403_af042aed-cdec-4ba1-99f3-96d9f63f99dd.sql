-- Create assessment history table
CREATE TABLE public.assessment_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role TEXT NOT NULL,
  questionnaire_score INTEGER NOT NULL,
  ml_score INTEGER,
  fused_score INTEGER NOT NULL,
  severity TEXT NOT NULL,
  video_url TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.assessment_history ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own assessment history"
ON public.assessment_history
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own assessment history"
ON public.assessment_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_assessment_history_user_created ON public.assessment_history(user_id, created_at DESC);