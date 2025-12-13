-- Create patient_reports table for RAG-based report lookup
CREATE TABLE public.patient_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_number TEXT NOT NULL UNIQUE,
  patient_name TEXT NOT NULL,
  patient_age TEXT NOT NULL,
  pronoun TEXT DEFAULT 'they/them',
  home_language TEXT DEFAULT 'English',
  problems_faced TEXT,
  video_url TEXT,
  answers JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.patient_reports ENABLE ROW LEVEL SECURITY;

-- Create policy for clinicians to view all reports (public read for lookup)
CREATE POLICY "Clinicians can view patient reports" 
ON public.patient_reports 
FOR SELECT 
USING (true);

-- Insert 6 dummy patient reports with varying severity levels
INSERT INTO public.patient_reports (application_number, patient_name, patient_age, pronoun, home_language, problems_faced, answers) VALUES

-- Report 1: AC-2024-001 - High severity case
('AC-2024-001', 'Arjun Kumar', '6-8 years', 'he/him', 'Hindi', 'Severe social withdrawal, repetitive hand movements, difficulty with transitions, sensory sensitivities to loud sounds', 
'{"par_1": "always", "par_2": "always", "par_3": "often", "par_4": "always", "par_5": "always", "par_6": "often", "par_7": "always", "par_8": "always", "par_9": "often", "par_10": "always", "par_11": "always", "par_12": "often", "par_13": "always", "par_14": "often", "par_15": "sometimes", "par_16": "always", "par_17": "often", "par_18": "always", "par_19": "always", "par_20": "sometimes"}'),

-- Report 2: AC-2024-002 - Moderate severity case
('AC-2024-002', 'Priya Sharma', '3-5 years', 'she/her', 'English', 'Delayed speech development, prefers solitary play, difficulty making eye contact, specific food preferences',
'{"par_1": "often", "par_2": "sometimes", "par_3": "often", "par_4": "sometimes", "par_5": "often", "par_6": "always", "par_7": "sometimes", "par_8": "rarely", "par_9": "often", "par_10": "often", "par_11": "sometimes", "par_12": "often", "par_13": "sometimes", "par_14": "sometimes", "par_15": "rarely", "par_16": "often", "par_17": "sometimes", "par_18": "often", "par_19": "sometimes", "par_20": "never"}'),

-- Report 3: AC-2024-003 - Low severity case
('AC-2024-003', 'Rahul Patel', '9-12 years', 'he/him', 'Gujarati', 'Mild social anxiety, intense interest in trains, occasional difficulty with group activities',
'{"par_1": "rarely", "par_2": "sometimes", "par_3": "rarely", "par_4": "rarely", "par_5": "sometimes", "par_6": "always", "par_7": "rarely", "par_8": "never", "par_9": "sometimes", "par_10": "sometimes", "par_11": "rarely", "par_12": "rarely", "par_13": "sometimes", "par_14": "rarely", "par_15": "never", "par_16": "rarely", "par_17": "rarely", "par_18": "sometimes", "par_19": "rarely", "par_20": "sometimes"}'),

-- Report 4: AC-2024-004 - Very High severity case
('AC-2024-004', 'Meera Reddy', '3-5 years', 'she/her', 'Telugu', 'Non-verbal, severe sensory processing issues, frequent meltdowns, no eye contact, requires constant supervision',
'{"par_1": "always", "par_2": "always", "par_3": "always", "par_4": "always", "par_5": "always", "par_6": "always", "par_7": "always", "par_8": "always", "par_9": "always", "par_10": "always", "par_11": "always", "par_12": "always", "par_13": "always", "par_14": "always", "par_15": "always", "par_16": "always", "par_17": "always", "par_18": "always", "par_19": "always", "par_20": "always"}'),

-- Report 5: AC-2024-005 - Mild severity case  
('AC-2024-005', 'Vikram Singh', '13-17 years', 'he/him', 'Punjabi', 'Social awkwardness, difficulty reading social cues, strong interest in coding, needs routine',
'{"par_1": "sometimes", "par_2": "often", "par_3": "sometimes", "par_4": "rarely", "par_5": "sometimes", "par_6": "always", "par_7": "sometimes", "par_8": "rarely", "par_9": "sometimes", "par_10": "sometimes", "par_11": "sometimes", "par_12": "rarely", "par_13": "often", "par_14": "rarely", "par_15": "never", "par_16": "rarely", "par_17": "sometimes", "par_18": "rarely", "par_19": "sometimes", "par_20": "never"}'),

-- Report 6: AC-2024-006 - Moderate-High severity case
('AC-2024-006', 'Ananya Gupta', '6-8 years', 'she/her', 'Bengali', 'Limited verbal communication, echolalia, spinning behaviors, difficulty with peer interactions, sensitive to textures',
'{"par_1": "often", "par_2": "always", "par_3": "often", "par_4": "often", "par_5": "always", "par_6": "often", "par_7": "often", "par_8": "often", "par_9": "often", "par_10": "often", "par_11": "often", "par_12": "always", "par_13": "always", "par_14": "often", "par_15": "often", "par_16": "often", "par_17": "often", "par_18": "often", "par_19": "often", "par_20": "never"}');