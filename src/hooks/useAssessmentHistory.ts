import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ScoringResult } from '@/utils/scoring';
import { useToast } from '@/hooks/use-toast';

export interface AssessmentRecord {
  id: string;
  user_id: string;
  role: string;
  questionnaire_score: number;
  ml_score: number | null;
  fused_score: number;
  severity: string;
  video_url: string | null;
  metadata: any;
  created_at: string;
}

export function useAssessmentHistory() {
  const [history, setHistory] = useState<AssessmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('assessment_history')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (error: any) {
      toast({
        title: 'Error fetching history',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const saveAssessment = async (
    result: ScoringResult,
    role: string,
    metadata?: any,
    videoUrl?: string
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase.from('assessment_history').insert({
        user_id: user.id,
        role,
        questionnaire_score: result.normalizedScore,
        ml_score: result.videoPrediction?.prediction_score || null,
        fused_score: result.fusedScore || result.normalizedScore,
        severity: result.severity,
        video_url: videoUrl || null,
        metadata: metadata || {},
      });

      if (error) throw error;
      
      // Refresh history
      await fetchHistory();
    } catch (error: any) {
      toast({
        title: 'Error saving assessment',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return { history, loading, saveAssessment, fetchHistory };
}
