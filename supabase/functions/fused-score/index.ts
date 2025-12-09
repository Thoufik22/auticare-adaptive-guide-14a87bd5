import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fusion logic: 60% questionnaire + 40% model score
function calculateFusedScore(questionnaireScore: number, modelScore: number | null, modelConfidence: number = 0.7): number {
  if (modelScore === null || modelScore === undefined) {
    // If no model score, return questionnaire score as is
    return questionnaireScore;
  }

  // Validate scores are in 0-100 range
  const validQuestionnaireScore = Math.max(0, Math.min(100, questionnaireScore));
  const validModelScore = Math.max(0, Math.min(100, modelScore));
  
  // Weighted fusion: 60% questionnaire, 40% ML prediction
  // Adjust ML weight based on confidence
  const questionnaireWeight = 0.6;
  const mlWeight = 0.4 * (modelConfidence || 0.7);
  const totalWeight = questionnaireWeight + mlWeight;
  
  const fusedScore = (validQuestionnaireScore * questionnaireWeight + validModelScore * mlWeight) / totalWeight;
  
  // Round to 2 decimal places
  return Math.round(fusedScore * 100) / 100;
}

// Determine severity level based on fused score
function getSeverity(score: number): { level: string, label: string, recommendation: string } {
  if (score < 25) {
    return {
      level: 'low',
      label: 'Very Low (Normal)',
      recommendation: 'Person is within normal range. Continue monitoring development.'
    };
  } else if (score < 40) {
    return {
      level: 'mild',
      label: 'Low - Assessment Requested',
      recommendation: 'Low indicators detected. Clinical assessment is recommended for clarification.'
    };
  } else if (score < 60) {
    return {
      level: 'moderate',
      label: 'Moderate - Assessment Required',
      recommendation: 'Moderate indicators present. Clinical assessment is required.'
    };
  } else if (score < 75) {
    return {
      level: 'high',
      label: 'High - Assessment Mandatory',
      recommendation: 'High indicators detected. Clinical assessment is mandatory.'
    };
  } else {
    return {
      level: 'very-high',
      label: 'Very High - Regular Checkup Needed',
      recommendation: 'Very high indicators present. Regular clinical checkups are essential.'
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Handle GET request for fetching fused score by patientId
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const patientId = url.searchParams.get('patientId');
      
      if (!patientId) {
        return new Response(
          JSON.stringify({ error: 'Missing patientId parameter' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create Supabase client
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Fetch latest assessment data for patient
      const { data, error } = await supabase
        .from('user_assessment_data')
        .select('questionnaire_score, model_score, fused_score')
        .eq('patient_id', patientId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        return new Response(
          JSON.stringify({ error: 'Patient not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const severity = getSeverity(data.fused_score || data.questionnaire_score || 0);

      return new Response(
        JSON.stringify({
          patientId,
          questionnaire_score: data.questionnaire_score,
          model_score: data.model_score,
          fused_score: data.fused_score,
          severity
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle POST request for calculating fused score
    const { questionnaire_score, model_score, model_confidence = 0.7 } = await req.json();

    if (questionnaire_score === undefined) {
      return new Response(
        JSON.stringify({ error: 'Missing questionnaire_score' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const fused_score = calculateFusedScore(questionnaire_score, model_score, model_confidence);
    const severity = getSeverity(fused_score);

    console.log(`Fused score calculated: Q=${questionnaire_score}, M=${model_score}, F=${fused_score}`);

    return new Response(
      JSON.stringify({
        questionnaire_score,
        model_score,
        fused_score,
        severity,
        formula: 'fused_score = (questionnaire_score * 0.6 + model_score * 0.4 * confidence) / total_weight'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fused-score:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
