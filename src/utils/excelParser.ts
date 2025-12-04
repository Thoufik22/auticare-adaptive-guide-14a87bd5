import * as XLSX from 'xlsx';
import { AnswerValue } from './scoring';
import { parentQuestions } from '@/data/questionBanks';

export interface ExcelParseResult {
  success: boolean;
  autoFilledAnswers: Record<string, AnswerValue>;
  missingQuestions: string[];
  extractedData: Record<string, any>;
  errors: string[];
}

// Mapping of Excel column names to question IDs and answer mappings
const symptomToQuestionMapping: Record<string, { questionId: string; valueMapping: Record<string, AnswerValue> }> = {
  // Social Communication mappings
  'eye_contact': {
    questionId: 'par_1',
    valueMapping: {
      'poor': 'always', 'very_poor': 'always', 'none': 'always',
      'limited': 'often', 'inconsistent': 'often',
      'moderate': 'sometimes', 'fair': 'sometimes',
      'good': 'rarely', 'adequate': 'rarely',
      'excellent': 'never', 'normal': 'never'
    }
  },
  'routine_changes': {
    questionId: 'par_2',
    valueMapping: {
      'severe_distress': 'always', 'very_upset': 'always', 'meltdown': 'always',
      'significant': 'often', 'upset': 'often',
      'moderate': 'sometimes', 'some_difficulty': 'sometimes',
      'mild': 'rarely', 'minor': 'rarely',
      'flexible': 'never', 'adapts_well': 'never'
    }
  },
  'social_cues': {
    questionId: 'par_3',
    valueMapping: {
      'none': 'always', 'very_poor': 'always', 'absent': 'always',
      'poor': 'often', 'limited': 'often',
      'moderate': 'sometimes', 'inconsistent': 'sometimes',
      'good': 'rarely', 'fair': 'rarely',
      'excellent': 'never', 'normal': 'never'
    }
  },
  'sensory_sensitivity': {
    questionId: 'par_4',
    valueMapping: {
      'extreme': 'always', 'severe': 'always', 'very_high': 'always',
      'high': 'often', 'significant': 'often',
      'moderate': 'sometimes', 'some': 'sometimes',
      'mild': 'rarely', 'low': 'rarely',
      'none': 'never', 'normal': 'never'
    }
  },
  'initiates_conversation': {
    questionId: 'par_5',
    valueMapping: {
      'never': 'always', 'none': 'always', 'absent': 'always',
      'rarely': 'often', 'seldom': 'often',
      'sometimes': 'sometimes', 'occasionally': 'sometimes',
      'often': 'rarely', 'frequently': 'rarely',
      'always': 'never', 'normal': 'never'
    }
  },
  'focused_interests': {
    questionId: 'par_6',
    valueMapping: {
      'extreme': 'always', 'obsessive': 'always', 'very_intense': 'always',
      'intense': 'often', 'high': 'often',
      'moderate': 'sometimes', 'some': 'sometimes',
      'mild': 'rarely', 'low': 'rarely',
      'normal': 'never', 'varied': 'never'
    }
  },
  'friendships': {
    questionId: 'par_7',
    valueMapping: {
      'none': 'always', 'isolated': 'always', 'very_difficult': 'always',
      'struggles': 'often', 'limited': 'often',
      'some_difficulty': 'sometimes', 'moderate': 'sometimes',
      'fair': 'rarely', 'few_close': 'rarely',
      'good': 'never', 'normal': 'never'
    }
  },
  'repetitive_behaviors': {
    questionId: 'par_8',
    valueMapping: {
      'constant': 'always', 'very_frequent': 'always', 'severe': 'always',
      'frequent': 'often', 'common': 'often',
      'occasional': 'sometimes', 'moderate': 'sometimes',
      'rare': 'rarely', 'infrequent': 'rarely',
      'none': 'never', 'absent': 'never'
    }
  },
  'emotional_understanding': {
    questionId: 'par_9',
    valueMapping: {
      'none': 'always', 'very_poor': 'always', 'absent': 'always',
      'poor': 'often', 'limited': 'often',
      'moderate': 'sometimes', 'developing': 'sometimes',
      'fair': 'rarely', 'good': 'rarely',
      'excellent': 'never', 'normal': 'never'
    }
  },
  'prefers_alone': {
    questionId: 'par_10',
    valueMapping: {
      'always': 'always', 'exclusively': 'always', 'isolated': 'always',
      'usually': 'often', 'mostly': 'often',
      'sometimes': 'sometimes', 'mixed': 'sometimes',
      'occasionally': 'rarely', 'seldom': 'rarely',
      'never': 'never', 'social': 'never'
    }
  },
  'adapts_new_environments': {
    questionId: 'par_11',
    valueMapping: {
      'severe_difficulty': 'always', 'unable': 'always', 'very_poor': 'always',
      'significant_difficulty': 'often', 'struggles': 'often',
      'moderate_difficulty': 'sometimes', 'some': 'sometimes',
      'mild_difficulty': 'rarely', 'minor': 'rarely',
      'adapts_well': 'never', 'flexible': 'never'
    }
  },
  'shares_interests': {
    questionId: 'par_12',
    valueMapping: {
      'never': 'always', 'none': 'always', 'absent': 'always',
      'rarely': 'often', 'seldom': 'often',
      'sometimes': 'sometimes', 'occasionally': 'sometimes',
      'often': 'rarely', 'frequently': 'rarely',
      'always': 'never', 'normal': 'never'
    }
  },
  'insists_sameness': {
    questionId: 'par_13',
    valueMapping: {
      'extreme': 'always', 'rigid': 'always', 'very_high': 'always',
      'high': 'often', 'significant': 'often',
      'moderate': 'sometimes', 'some': 'sometimes',
      'mild': 'rarely', 'flexible': 'rarely',
      'none': 'never', 'adaptable': 'never'
    }
  },
  'imaginative_play': {
    questionId: 'par_14',
    valueMapping: {
      'absent': 'always', 'none': 'always', 'very_limited': 'always',
      'limited': 'often', 'poor': 'often',
      'some': 'sometimes', 'developing': 'sometimes',
      'fair': 'rarely', 'good': 'rarely',
      'rich': 'never', 'normal': 'never'
    }
  },
  'unusual_vocalizations': {
    questionId: 'par_15',
    valueMapping: {
      'constant': 'always', 'very_frequent': 'always', 'severe': 'always',
      'frequent': 'often', 'common': 'often',
      'occasional': 'sometimes', 'moderate': 'sometimes',
      'rare': 'rarely', 'mild': 'rarely',
      'none': 'never', 'normal': 'never'
    }
  },
  'developmental_delays': {
    questionId: 'par_16',
    valueMapping: {
      'severe': 'always', 'significant': 'always', 'multiple': 'always',
      'moderate': 'often', 'noticeable': 'often',
      'mild': 'sometimes', 'some': 'sometimes',
      'minimal': 'rarely', 'slight': 'rarely',
      'none': 'never', 'on_track': 'never'
    }
  },
  'turn_taking': {
    questionId: 'par_17',
    valueMapping: {
      'unable': 'always', 'none': 'always', 'very_poor': 'always',
      'poor': 'often', 'struggles': 'often',
      'moderate': 'sometimes', 'learning': 'sometimes',
      'fair': 'rarely', 'mostly_good': 'rarely',
      'excellent': 'never', 'normal': 'never'
    }
  },
  'interest_in_others': {
    questionId: 'par_18',
    valueMapping: {
      'none': 'always', 'absent': 'always', 'very_low': 'always',
      'low': 'often', 'limited': 'often',
      'moderate': 'sometimes', 'variable': 'sometimes',
      'fair': 'rarely', 'growing': 'rarely',
      'high': 'never', 'normal': 'never'
    }
  },
  'sensory_reactions': {
    questionId: 'par_19',
    valueMapping: {
      'extreme': 'always', 'severe': 'always', 'very_unusual': 'always',
      'unusual': 'often', 'significant': 'often',
      'moderate': 'sometimes', 'some': 'sometimes',
      'mild': 'rarely', 'minor': 'rarely',
      'typical': 'never', 'normal': 'never'
    }
  },
  'family_history': {
    questionId: 'par_20',
    valueMapping: {
      'strong': 'always', 'multiple': 'always', 'yes': 'always',
      'some': 'often', 'partial': 'often',
      'possible': 'sometimes', 'unclear': 'sometimes',
      'unlikely': 'rarely', 'minimal': 'rarely',
      'none': 'never', 'no': 'never'
    }
  }
};

// Alternative column names that map to the same symptom
const columnAliases: Record<string, string> = {
  'eye contact': 'eye_contact',
  'eyecontact': 'eye_contact',
  'makes eye contact': 'eye_contact',
  'routine changes': 'routine_changes',
  'routinechanges': 'routine_changes',
  'upset by changes': 'routine_changes',
  'social cues': 'social_cues',
  'socialcues': 'social_cues',
  'body language': 'social_cues',
  'sensory sensitivity': 'sensory_sensitivity',
  'sensorysensitivity': 'sensory_sensitivity',
  'sensory issues': 'sensory_sensitivity',
  'initiates conversation': 'initiates_conversation',
  'starts conversations': 'initiates_conversation',
  'focused interests': 'focused_interests',
  'special interests': 'focused_interests',
  'intense interests': 'focused_interests',
  'making friends': 'friendships',
  'social relationships': 'friendships',
  'peer relationships': 'friendships',
  'repetitive behaviors': 'repetitive_behaviors',
  'stimming': 'repetitive_behaviors',
  'hand flapping': 'repetitive_behaviors',
  'emotional understanding': 'emotional_understanding',
  'emotions': 'emotional_understanding',
  'prefers alone': 'prefers_alone',
  'plays alone': 'prefers_alone',
  'solitary play': 'prefers_alone',
  'new environments': 'adapts_new_environments',
  'adapts to change': 'adapts_new_environments',
  'shares interests': 'shares_interests',
  'sharing': 'shares_interests',
  'sameness': 'insists_sameness',
  'rigidity': 'insists_sameness',
  'imaginative play': 'imaginative_play',
  'pretend play': 'imaginative_play',
  'vocalizations': 'unusual_vocalizations',
  'unusual sounds': 'unusual_vocalizations',
  'developmental delays': 'developmental_delays',
  'milestones': 'developmental_delays',
  'turn taking': 'turn_taking',
  'taking turns': 'turn_taking',
  'interest in others': 'interest_in_others',
  'social interest': 'interest_in_others',
  'sensory reactions': 'sensory_reactions',
  'sensory seeking': 'sensory_reactions',
  'family history': 'family_history',
  'familyhistory': 'family_history',
  'asd in family': 'family_history'
};

function normalizeColumnName(name: string): string {
  const normalized = name.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_');
  return columnAliases[name.toLowerCase().trim()] || columnAliases[normalized] || normalized;
}

function mapValueToAnswer(value: string, mapping: Record<string, AnswerValue>): AnswerValue | null {
  const normalizedValue = value.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_');
  
  // Direct match
  if (mapping[normalizedValue]) {
    return mapping[normalizedValue];
  }
  
  // Partial match
  for (const [key, answer] of Object.entries(mapping)) {
    if (normalizedValue.includes(key) || key.includes(normalizedValue)) {
      return answer;
    }
  }
  
  return null;
}

export function parseExcelForAssessment(file: File): Promise<ExcelParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet);
        
        if (jsonData.length === 0) {
          resolve({
            success: false,
            autoFilledAnswers: {},
            missingQuestions: parentQuestions.map(q => q.id),
            extractedData: {},
            errors: ['Excel file is empty or has no data rows']
          });
          return;
        }
        
        // Take first row as patient data
        const patientRow = jsonData[0];
        const autoFilledAnswers: Record<string, AnswerValue> = {};
        const extractedData: Record<string, any> = {};
        const errors: string[] = [];
        
        // Process each column
        for (const [columnName, value] of Object.entries(patientRow)) {
          if (value === null || value === undefined || value === '') continue;
          
          const normalizedColumn = normalizeColumnName(columnName);
          const stringValue = String(value);
          
          // Store extracted data
          extractedData[columnName] = value;
          
          // Check if this column maps to a question
          const mapping = symptomToQuestionMapping[normalizedColumn];
          if (mapping) {
            const answer = mapValueToAnswer(stringValue, mapping.valueMapping);
            if (answer) {
              autoFilledAnswers[mapping.questionId] = answer;
            } else {
              errors.push(`Could not map value "${value}" for column "${columnName}"`);
            }
          }
        }
        
        // Find missing questions
        const answeredIds = new Set(Object.keys(autoFilledAnswers));
        const missingQuestions = parentQuestions
          .filter(q => !answeredIds.has(q.id))
          .map(q => q.id);
        
        resolve({
          success: true,
          autoFilledAnswers,
          missingQuestions,
          extractedData,
          errors
        });
        
      } catch (error) {
        resolve({
          success: false,
          autoFilledAnswers: {},
          missingQuestions: parentQuestions.map(q => q.id),
          extractedData: {},
          errors: [`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`]
        });
      }
    };
    
    reader.onerror = () => {
      resolve({
        success: false,
        autoFilledAnswers: {},
        missingQuestions: parentQuestions.map(q => q.id),
        extractedData: {},
        errors: ['Failed to read file']
      });
    };
    
    reader.readAsArrayBuffer(file);
  });
}

// Test scenarios comments:
// TEST 1 - Full Excel auto-fill: Excel with all 20 columns matching symptoms (eye_contact: poor, routine_changes: severe_distress, etc.)
// TEST 2 - Partial Excel fallback: Excel with only 5 columns (eye_contact, sensory_sensitivity, repetitive_behaviors, developmental_delays, family_history) - should auto-fill 5, prompt manual for 15
// TEST 3 - Column alias matching: Excel with "Makes Eye Contact: good", "Sensory Issues: extreme" - should recognize aliases
