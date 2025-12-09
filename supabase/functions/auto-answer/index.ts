import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Deterministic mapping configuration for auto-answering questionnaire
// Each question maps symptom descriptions to answer values (0-4: never-always)
const MAPPING_CONFIG = {
  // Question mappings for 15-question individual and 20-question parent/clinician
  q1_eye_contact: [
    { match: "reduced eye contact|avoids eye contact|poor eye contact|no eye contact|limited eye contact", answer: 3 },
    { match: "inconsistent eye contact|variable eye contact|sometimes avoids", answer: 2 },
    { match: "occasional eye contact|mostly makes eye contact", answer: 1 },
    { match: "normal eye contact|good eye contact|appropriate eye contact|maintains eye contact", answer: 0 }
  ],
  q2_routine_change: [
    { match: "extremely upset|severe distress|meltdown|tantrum when routine changes", answer: 4 },
    { match: "very upset|significant distress|cries when routine changes", answer: 3 },
    { match: "moderately upset|some distress|uncomfortable with change", answer: 2 },
    { match: "slightly upset|mild discomfort|adjusts slowly", answer: 1 },
    { match: "adapts well|flexible|no issue with change", answer: 0 }
  ],
  q3_social_cues: [
    { match: "does not understand|cannot read|misses all cues|no understanding", answer: 4 },
    { match: "rarely understands|significant difficulty|misses most cues", answer: 3 },
    { match: "sometimes understands|moderate difficulty|misses some cues", answer: 2 },
    { match: "usually understands|occasional difficulty|catches most cues", answer: 1 },
    { match: "understands well|good social awareness|reads cues appropriately", answer: 0 }
  ],
  q4_sensory: [
    { match: "extreme sensitivity|severe sensory issues|cannot tolerate|overwhelmed", answer: 4 },
    { match: "high sensitivity|significant issues|often bothered", answer: 3 },
    { match: "moderate sensitivity|some issues|sometimes bothered", answer: 2 },
    { match: "mild sensitivity|occasional issues|rarely bothered", answer: 1 },
    { match: "typical sensory response|no issues|not sensitive", answer: 0 }
  ],
  q5_initiate_conversation: [
    { match: "never initiates|does not start|avoids all interaction", answer: 4 },
    { match: "rarely initiates|seldom starts|very hesitant", answer: 3 },
    { match: "sometimes initiates|occasionally starts|needs prompting", answer: 2 },
    { match: "often initiates|usually starts|with encouragement", answer: 1 },
    { match: "regularly initiates|easily starts|spontaneously engages", answer: 0 }
  ],
  q6_intense_interests: [
    { match: "extremely focused|obsessive interest|all-consuming|exclusive focus", answer: 4 },
    { match: "very focused|intense interest|dominates activities", answer: 3 },
    { match: "moderately focused|strong interest|significant time spent", answer: 2 },
    { match: "somewhat focused|notable interest|regular engagement", answer: 1 },
    { match: "varied interests|balanced|no unusual focus", answer: 0 }
  ],
  q7_friendships: [
    { match: "no friends|cannot make friends|isolated|no peer relationships", answer: 4 },
    { match: "rarely makes friends|significant difficulty|very few friends", answer: 3 },
    { match: "some difficulty|has few friends|struggles to maintain", answer: 2 },
    { match: "occasional difficulty|has friends|some challenges", answer: 1 },
    { match: "makes friends easily|good relationships|no difficulty", answer: 0 }
  ],
  q8_repetitive_behaviors: [
    { match: "constant|very frequent|cannot stop|pervasive", answer: 4 },
    { match: "frequent|often|regular repetitive behavior", answer: 3 },
    { match: "sometimes|moderate|occasional repetitive behavior", answer: 2 },
    { match: "rarely|infrequent|seldom", answer: 1 },
    { match: "never|none|no repetitive behaviors", answer: 0 }
  ],
  q9_emotions: [
    { match: "cannot understand|no awareness|does not recognize", answer: 4 },
    { match: "rarely understands|significant difficulty|poor awareness", answer: 3 },
    { match: "sometimes understands|moderate difficulty|developing", answer: 2 },
    { match: "usually understands|occasional difficulty|mostly aware", answer: 1 },
    { match: "understands well|good emotional awareness|empathetic", answer: 0 }
  ],
  q10_play_preference: [
    { match: "always alone|refuses group play|isolates completely", answer: 4 },
    { match: "mostly alone|prefers solitary|rarely joins", answer: 3 },
    { match: "sometimes alone|mixed preference|parallel play", answer: 2 },
    { match: "usually with others|occasionally alone|joins often", answer: 1 },
    { match: "prefers group play|social player|interactive", answer: 0 }
  ],
  q11_adaptation: [
    { match: "cannot adapt|severe difficulty|extreme resistance", answer: 4 },
    { match: "rarely adapts|significant difficulty|very resistant", answer: 3 },
    { match: "sometimes adapts|moderate difficulty|needs support", answer: 2 },
    { match: "usually adapts|occasional difficulty|adjusts with time", answer: 1 },
    { match: "adapts well|flexible|no difficulty", answer: 0 }
  ],
  q12_sharing_interests: [
    { match: "never shares|no joint attention|does not show", answer: 4 },
    { match: "rarely shares|seldom shows|minimal sharing", answer: 3 },
    { match: "sometimes shares|occasional showing|moderate", answer: 2 },
    { match: "often shares|usually shows|regular sharing", answer: 1 },
    { match: "shares readily|enthusiastic|good joint attention", answer: 0 }
  ],
  q13_sameness: [
    { match: "extreme insistence|severe distress|meltdown if changed", answer: 4 },
    { match: "strong insistence|significant distress|very upset", answer: 3 },
    { match: "moderate insistence|some distress|uncomfortable", answer: 2 },
    { match: "mild preference|slight preference|notices changes", answer: 1 },
    { match: "flexible|no insistence|adapts easily", answer: 0 }
  ],
  q14_pretend_play: [
    { match: "no pretend play|cannot imagine|no imaginative play", answer: 4 },
    { match: "minimal pretend|limited imagination|rare", answer: 3 },
    { match: "some pretend play|developing|occasional", answer: 2 },
    { match: "regular pretend play|good imagination|frequent", answer: 1 },
    { match: "rich imaginative play|creative|elaborate pretend", answer: 0 }
  ],
  q15_vocalizations: [
    { match: "constant unusual|very frequent|pervasive", answer: 4 },
    { match: "frequent unusual|regular repetitive", answer: 3 },
    { match: "sometimes unusual|occasional repetitive", answer: 2 },
    { match: "rarely unusual|infrequent", answer: 1 },
    { match: "typical speech|no unusual|normal vocalizations", answer: 0 }
  ],
  q16_developmental_delays: [
    { match: "severe delays|significant delays|major milestones missed", answer: 4 },
    { match: "moderate delays|notable delays|several milestones delayed", answer: 3 },
    { match: "mild delays|some delays|few milestones delayed", answer: 2 },
    { match: "slight delays|minor delays|one milestone delayed", answer: 1 },
    { match: "on time|no delays|met all milestones", answer: 0 }
  ],
  q17_turn_taking: [
    { match: "cannot take turns|no understanding|refuses to wait", answer: 4 },
    { match: "rarely takes turns|significant difficulty", answer: 3 },
    { match: "sometimes takes turns|moderate difficulty", answer: 2 },
    { match: "usually takes turns|occasional difficulty", answer: 1 },
    { match: "takes turns well|understands rules|patient", answer: 0 }
  ],
  q18_interest_others: [
    { match: "no interest|ignores others|completely disengaged", answer: 4 },
    { match: "little interest|rarely notices|minimal engagement", answer: 3 },
    { match: "some interest|occasionally notices|moderate", answer: 2 },
    { match: "usually interested|often notices|good engagement", answer: 1 },
    { match: "very interested|attentive|highly engaged", answer: 0 }
  ],
  q19_sensory_seeking: [
    { match: "extreme seeking/avoiding|constant|pervasive", answer: 4 },
    { match: "frequent seeking/avoiding|often|regular", answer: 3 },
    { match: "moderate seeking/avoiding|sometimes|occasional", answer: 2 },
    { match: "mild seeking/avoiding|rarely|infrequent", answer: 1 },
    { match: "typical responses|no unusual|normal", answer: 0 }
  ],
  q20_family_history: [
    { match: "confirmed diagnosis|diagnosed family member|yes|positive", answer: 4 },
    { match: "suspected|possible|undiagnosed traits", answer: 2 },
    { match: "no|none|no family history|negative", answer: 0 }
  ]
};

// Question ID mapping for different roles
const QUESTION_ID_MAP = {
  individual: {
    'q1_eye_contact': 'ind_1',
    'q2_routine_change': 'ind_2',
    'q3_social_cues': 'ind_3',
    'q4_sensory': 'ind_4',
    'q5_initiate_conversation': 'ind_5',
    'q6_intense_interests': 'ind_6',
    'q7_friendships': 'ind_7',
    'q8_repetitive_behaviors': 'ind_9',
    'q9_emotions': 'ind_7',
    'q10_play_preference': 'ind_8',
    'q11_adaptation': 'ind_10',
    'q12_sharing_interests': 'ind_11',
    'q13_sameness': 'ind_12',
    'q14_pretend_play': 'ind_13',
    'q15_developmental_delays': 'ind_15'
  },
  parent: {
    'q1_eye_contact': 'par_1',
    'q2_routine_change': 'par_2',
    'q3_social_cues': 'par_3',
    'q4_sensory': 'par_4',
    'q5_initiate_conversation': 'par_5',
    'q6_intense_interests': 'par_6',
    'q7_friendships': 'par_7',
    'q8_repetitive_behaviors': 'par_8',
    'q9_emotions': 'par_9',
    'q10_play_preference': 'par_10',
    'q11_adaptation': 'par_11',
    'q12_sharing_interests': 'par_12',
    'q13_sameness': 'par_13',
    'q14_pretend_play': 'par_14',
    'q15_vocalizations': 'par_15',
    'q16_developmental_delays': 'par_16',
    'q17_turn_taking': 'par_17',
    'q18_interest_others': 'par_18',
    'q19_sensory_seeking': 'par_19',
    'q20_family_history': 'par_20'
  },
  clinician: {
    'q1_eye_contact': 'par_1',
    'q2_routine_change': 'par_2',
    'q3_social_cues': 'par_3',
    'q4_sensory': 'par_4',
    'q5_initiate_conversation': 'par_5',
    'q6_intense_interests': 'par_6',
    'q7_friendships': 'par_7',
    'q8_repetitive_behaviors': 'par_8',
    'q9_emotions': 'par_9',
    'q10_play_preference': 'par_10',
    'q11_adaptation': 'par_11',
    'q12_sharing_interests': 'par_12',
    'q13_sameness': 'par_13',
    'q14_pretend_play': 'par_14',
    'q15_vocalizations': 'par_15',
    'q16_developmental_delays': 'par_16',
    'q17_turn_taking': 'par_17',
    'q18_interest_others': 'par_18',
    'q19_sensory_seeking': 'par_19',
    'q20_family_history': 'par_20'
  }
};

// Answer value mapping
const ANSWER_VALUE_MAP: Record<number, string> = {
  0: 'never',
  1: 'rarely',
  2: 'sometimes',
  3: 'often',
  4: 'always'
};

// Category weights for scoring
const CATEGORY_WEIGHTS: Record<string, number> = {
  'social-communication': 2.0,
  'repetitive-sensory': 1.5,
  'developmental': 2.5,
  'family-history': 6.0
};

// Question category mapping
const QUESTION_CATEGORIES: Record<string, string> = {
  'q1_eye_contact': 'social-communication',
  'q2_routine_change': 'repetitive-sensory',
  'q3_social_cues': 'social-communication',
  'q4_sensory': 'repetitive-sensory',
  'q5_initiate_conversation': 'social-communication',
  'q6_intense_interests': 'repetitive-sensory',
  'q7_friendships': 'social-communication',
  'q8_repetitive_behaviors': 'repetitive-sensory',
  'q9_emotions': 'social-communication',
  'q10_play_preference': 'social-communication',
  'q11_adaptation': 'repetitive-sensory',
  'q12_sharing_interests': 'social-communication',
  'q13_sameness': 'repetitive-sensory',
  'q14_pretend_play': 'social-communication',
  'q15_vocalizations': 'repetitive-sensory',
  'q16_developmental_delays': 'developmental',
  'q17_turn_taking': 'social-communication',
  'q18_interest_others': 'social-communication',
  'q19_sensory_seeking': 'repetitive-sensory',
  'q20_family_history': 'family-history'
};

function matchAnswer(text: string, mappings: Array<{match: string, answer: number}>): number {
  const lowerText = text.toLowerCase();
  
  for (const mapping of mappings) {
    const patterns = mapping.match.split('|');
    for (const pattern of patterns) {
      if (lowerText.includes(pattern.toLowerCase())) {
        return mapping.answer;
      }
    }
  }
  
  // Default fallback: return 0 (never) if no match
  return 0;
}

function processReport(report: any, role: string = 'parent'): { answers: Record<string, string>, rawAnswers: Record<string, number> } {
  const answers: Record<string, string> = {};
  const rawAnswers: Record<string, number> = {};
  const questionIdMap = QUESTION_ID_MAP[role as keyof typeof QUESTION_ID_MAP] || QUESTION_ID_MAP.parent;
  const totalQuestions = role === 'individual' ? 15 : 20;

  // Handle structured JSON report
  if (typeof report === 'object' && report !== null) {
    const fieldMappings: Record<string, string> = {
      'eye_contact': 'q1_eye_contact',
      'eyeContact': 'q1_eye_contact',
      'routine_change': 'q2_routine_change',
      'routineChange': 'q2_routine_change',
      'social_cues': 'q3_social_cues',
      'socialCues': 'q3_social_cues',
      'sensory': 'q4_sensory',
      'sensory_sensitivity': 'q4_sensory',
      'conversation': 'q5_initiate_conversation',
      'initiateConversation': 'q5_initiate_conversation',
      'interests': 'q6_intense_interests',
      'intenseInterests': 'q6_intense_interests',
      'friendships': 'q7_friendships',
      'repetitive_behaviors': 'q8_repetitive_behaviors',
      'repetitiveBehaviors': 'q8_repetitive_behaviors',
      'emotions': 'q9_emotions',
      'emotionUnderstanding': 'q9_emotions',
      'play_preference': 'q10_play_preference',
      'playPreference': 'q10_play_preference',
      'adaptation': 'q11_adaptation',
      'sharing': 'q12_sharing_interests',
      'sameness': 'q13_sameness',
      'pretend_play': 'q14_pretend_play',
      'pretendPlay': 'q14_pretend_play',
      'vocalizations': 'q15_vocalizations',
      'developmental': 'q16_developmental_delays',
      'developmentalDelays': 'q16_developmental_delays',
      'turn_taking': 'q17_turn_taking',
      'turnTaking': 'q17_turn_taking',
      'interest_others': 'q18_interest_others',
      'interestOthers': 'q18_interest_others',
      'sensory_seeking': 'q19_sensory_seeking',
      'sensorySeeking': 'q19_sensory_seeking',
      'family_history': 'q20_family_history',
      'familyHistory': 'q20_family_history'
    };

    for (const [field, value] of Object.entries(report)) {
      const mappingKey = fieldMappings[field];
      if (mappingKey && MAPPING_CONFIG[mappingKey as keyof typeof MAPPING_CONFIG]) {
        const answerNum = matchAnswer(String(value), MAPPING_CONFIG[mappingKey as keyof typeof MAPPING_CONFIG]);
        const questionId = questionIdMap[mappingKey as keyof typeof questionIdMap];
        if (questionId) {
          rawAnswers[questionId] = answerNum;
          answers[questionId] = ANSWER_VALUE_MAP[answerNum];
        }
      }
    }
  }
  
  // Handle text report
  if (typeof report === 'string') {
    for (const [key, mappings] of Object.entries(MAPPING_CONFIG)) {
      const questionId = questionIdMap[key as keyof typeof questionIdMap];
      if (questionId) {
        const answerNum = matchAnswer(report, mappings);
        rawAnswers[questionId] = answerNum;
        answers[questionId] = ANSWER_VALUE_MAP[answerNum];
      }
    }
  }

  // Fill in missing questions with default (0 = never)
  const allQuestionKeys = Object.values(questionIdMap).slice(0, totalQuestions);
  for (const questionId of allQuestionKeys) {
    if (!(questionId in answers)) {
      rawAnswers[questionId] = 0;
      answers[questionId] = 'never';
    }
  }

  return { answers, rawAnswers };
}

function calculateQuestionnaireScore(rawAnswers: Record<string, number>, role: string): number {
  const questionIdMap = QUESTION_ID_MAP[role as keyof typeof QUESTION_ID_MAP] || QUESTION_ID_MAP.parent;
  
  let rawTotal = 0;
  let maxPossible = 0;

  for (const [configKey, questionId] of Object.entries(questionIdMap)) {
    const category = QUESTION_CATEGORIES[configKey];
    const weight = CATEGORY_WEIGHTS[category] || 1;
    const answerValue = rawAnswers[questionId] || 0;
    
    rawTotal += answerValue * weight;
    maxPossible += 4 * weight;
  }

  // Normalize to 0-100
  return Math.round((rawTotal / maxPossible) * 100);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { patientId, report, role = 'parent' } = await req.json();

    if (!patientId || !report) {
      return new Response(
        JSON.stringify({ error: 'Missing patientId or report' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing auto-answer for patient ${patientId}, role: ${role}`);

    const { answers, rawAnswers } = processReport(report, role);
    const questionnaire_score = calculateQuestionnaireScore(rawAnswers, role);

    console.log(`Auto-answer complete. Score: ${questionnaire_score}`);

    return new Response(
      JSON.stringify({
        patientId,
        answers,
        rawAnswers,
        questionnaire_score,
        source: 'auto',
        mappingVersion: '1.0.0'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in auto-answer:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
