import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export interface UserAssessmentData {
  id: string;
  user_id: string;
  email: string;
  role: 'individual' | 'parent' | 'clinician';
  patient_id: string;
  child_data: Record<string, any>;
  excel_data: Record<string, any> | null;
  last_assessment_answers: Record<string, any> | null;
  last_score: number | null;
  questionnaire_score: number | null;
  model_score: number | null;
  fused_score: number | null;
  assessment_complete: boolean;
  created_at: string;
  updated_at: string;
}

export function useUserAssessmentData(user: User | null) {
  const [assessmentData, setAssessmentData] = useState<UserAssessmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasExistingData, setHasExistingData] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAssessmentData();
    } else {
      setAssessmentData(null);
      setLoading(false);
      setHasExistingData(false);
    }
  }, [user?.id]);

  const fetchAssessmentData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_assessment_data')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching assessment data:', error);
      }
      
      if (data) {
        setAssessmentData(data as unknown as UserAssessmentData);
        setHasExistingData(true);
      } else {
        setHasExistingData(false);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveAssessmentData = async (
    email: string,
    role: 'individual' | 'parent' | 'clinician',
    patientId: string,
    childData?: Record<string, any>,
    excelData?: Record<string, any> | null,
    answers?: Record<string, any>,
    questionnaireScore?: number,
    modelScore?: number | null,
    fusedScore?: number
  ) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const existingData = await supabase
        .from('user_assessment_data')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      const dataToSave = {
        child_data: childData || {},
        excel_data: excelData,
        last_assessment_answers: answers || null,
        last_score: questionnaireScore || null,
        questionnaire_score: questionnaireScore || null,
        model_score: modelScore ?? null,
        fused_score: fusedScore || questionnaireScore || null,
        assessment_complete: true,
        updated_at: new Date().toISOString()
      };

      if (existingData.data) {
        // Update existing record
        const { error } = await supabase
          .from('user_assessment_data')
          .update(dataToSave)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from('user_assessment_data')
          .insert({
            user_id: user.id,
            email,
            role,
            patient_id: patientId,
            ...dataToSave
          });

        if (error) throw error;
      }

      await fetchAssessmentData();
      return { success: true };
    } catch (err) {
      console.error('Error saving assessment data:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  };

  const clearAssessmentData = async () => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('user_assessment_data')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setAssessmentData(null);
      setHasExistingData(false);
      return { success: true };
    } catch (err) {
      console.error('Error clearing assessment data:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  };

  return {
    assessmentData,
    loading,
    hasExistingData,
    saveAssessmentData,
    clearAssessmentData,
    refetch: fetchAssessmentData
  };
}

// Generate unique patient ID
export function generatePatientId(role: 'individual' | 'parent' | 'clinician'): string {
  const prefix = role === 'clinician' ? 'PAT' : role === 'parent' ? 'CHILD' : 'SELF';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}
