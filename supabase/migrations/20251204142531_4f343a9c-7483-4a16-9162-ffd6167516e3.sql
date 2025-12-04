-- Create table for user assessment data with role-locked patient/child IDs
CREATE TABLE public.user_assessment_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('individual', 'parent', 'clinician')),
  patient_id TEXT NOT NULL,
  child_data JSONB DEFAULT '{}',
  excel_data JSONB DEFAULT NULL,
  last_assessment_answers JSONB DEFAULT NULL,
  last_score INTEGER DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_assessment_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own assessment data"
ON public.user_assessment_data FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own assessment data"
ON public.user_assessment_data FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own assessment data"
ON public.user_assessment_data FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_assessment_data_updated_at
BEFORE UPDATE ON public.user_assessment_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();