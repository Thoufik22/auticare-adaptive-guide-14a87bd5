// Fused scoring utility for combining questionnaire and ML model scores
// Formula: fused_score = (questionnaire_score * 0.6 + model_score * 0.4 * confidence) / total_weight

export interface FusedScoreResult {
  questionnaireScore: number;
  modelScore: number | null;
  fusedScore: number;
  severity: {
    level: 'low' | 'mild' | 'moderate' | 'high' | 'very-high';
    label: string;
    recommendation: string;
  };
}

// Calculate fused score client-side (matches server-side logic)
export function calculateFusedScore(
  questionnaireScore: number,
  modelScore: number | null,
  modelConfidence: number = 0.7
): number {
  if (modelScore === null || modelScore === undefined) {
    return questionnaireScore;
  }

  // Validate scores are in 0-100 range
  const validQuestionnaireScore = Math.max(0, Math.min(100, questionnaireScore));
  const validModelScore = Math.max(0, Math.min(100, modelScore));
  
  // Weighted fusion: 60% questionnaire, 40% ML prediction
  const questionnaireWeight = 0.6;
  const mlWeight = 0.4 * (modelConfidence || 0.7);
  const totalWeight = questionnaireWeight + mlWeight;
  
  const fusedScore = (validQuestionnaireScore * questionnaireWeight + validModelScore * mlWeight) / totalWeight;
  
  // Round to 2 decimal places
  return Math.round(fusedScore * 100) / 100;
}

// Get severity based on score
export function getSeverityFromScore(score: number): FusedScoreResult['severity'] {
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

// Get complete fused score result
export function getFusedScoreResult(
  questionnaireScore: number,
  modelScore: number | null,
  modelConfidence: number = 0.7
): FusedScoreResult {
  const fusedScore = calculateFusedScore(questionnaireScore, modelScore, modelConfidence);
  const severity = getSeverityFromScore(fusedScore);

  return {
    questionnaireScore,
    modelScore,
    fusedScore,
    severity
  };
}
