-- Add fields to user_assessment_data for enhanced scoring
-- Add questionnaire_score, model_score, fused_score columns if not exist
DO $$ 
BEGIN
  -- Add assessment_complete if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_assessment_data' AND column_name = 'assessment_complete') THEN
    ALTER TABLE public.user_assessment_data ADD COLUMN assessment_complete boolean DEFAULT false;
  END IF;
  
  -- Add questionnaire_score if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_assessment_data' AND column_name = 'questionnaire_score') THEN
    ALTER TABLE public.user_assessment_data ADD COLUMN questionnaire_score integer;
  END IF;
  
  -- Add model_score if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_assessment_data' AND column_name = 'model_score') THEN
    ALTER TABLE public.user_assessment_data ADD COLUMN model_score integer;
  END IF;
  
  -- Add fused_score if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_assessment_data' AND column_name = 'fused_score') THEN
    ALTER TABLE public.user_assessment_data ADD COLUMN fused_score integer;
  END IF;
END $$;

-- Create assessment_history table for tracking historical assessments
CREATE TABLE IF NOT EXISTS public.assessment_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  patient_id TEXT NOT NULL,
  role TEXT NOT NULL,
  questionnaire_score INTEGER NOT NULL,
  ml_score INTEGER,
  fused_score INTEGER NOT NULL,
  severity TEXT NOT NULL,
  video_url TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on assessment_history
ALTER TABLE public.assessment_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for assessment_history
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'assessment_history' AND policyname = 'Users can view their own assessment history') THEN
    CREATE POLICY "Users can view their own assessment history" 
    ON public.assessment_history 
    FOR SELECT 
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'assessment_history' AND policyname = 'Users can insert their own assessment history') THEN
    CREATE POLICY "Users can insert their own assessment history" 
    ON public.assessment_history 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;