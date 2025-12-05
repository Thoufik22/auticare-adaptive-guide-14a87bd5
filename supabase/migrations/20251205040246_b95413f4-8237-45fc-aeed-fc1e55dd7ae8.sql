-- Add comprehensive score tracking fields
ALTER TABLE public.user_assessment_data 
ADD COLUMN IF NOT EXISTS questionnaire_score integer,
ADD COLUMN IF NOT EXISTS model_score integer,
ADD COLUMN IF NOT EXISTS fused_score integer,
ADD COLUMN IF NOT EXISTS assessment_complete boolean DEFAULT false;