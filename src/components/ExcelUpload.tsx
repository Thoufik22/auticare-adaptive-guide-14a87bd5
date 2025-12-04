import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { parseExcelForAssessment, ExcelParseResult } from '@/utils/excelParser';
import { parentQuestions } from '@/data/questionBanks';
import { AnswerValue } from '@/utils/scoring';
import { FileSpreadsheet, Upload, CheckCircle2, AlertCircle, ArrowRight, Edit2 } from 'lucide-react';

interface ExcelUploadProps {
  onComplete: (answers: Record<string, AnswerValue>, excelData: Record<string, any> | null, skipped: boolean) => void;
  onBack: () => void;
}

export default function ExcelUpload({ onComplete, onBack }: ExcelUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ExcelParseResult | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [editedAnswers, setEditedAnswers] = useState<Record<string, AnswerValue>>({});

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setParsing(true);

    const result = await parseExcelForAssessment(selectedFile);
    setParseResult(result);
    setEditedAnswers(result.autoFilledAnswers);
    setParsing(false);
  };

  const handleSkip = () => {
    onComplete({}, null, true);
  };

  const handleProceed = () => {
    if (parseResult && parseResult.missingQuestions.length === 0) {
      // All questions auto-filled, proceed directly
      onComplete(editedAnswers, parseResult.extractedData, false);
    } else {
      // Has missing questions, pass what we have
      onComplete(editedAnswers, parseResult?.extractedData || null, false);
    }
  };

  const answerOptions: AnswerValue[] = ['never', 'rarely', 'sometimes', 'often', 'always'];

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full animate-fade-in">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <FileSpreadsheet className="w-12 h-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Clinical Data Import</CardTitle>
          <CardDescription>
            Upload an Excel file (.xlsx/.csv) with patient assessment data to auto-fill the questionnaire
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {!parseResult && (
            <>
              <div className="space-y-2">
                <Label htmlFor="excelFile">Upload Assessment Data</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                  <Input
                    id="excelFile"
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={parsing}
                  />
                  <label htmlFor="excelFile" className="cursor-pointer">
                    <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {parsing ? 'Processing file...' : 'Click to upload or drag and drop'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Supports .xlsx, .xls, .csv
                    </p>
                  </label>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Expected columns:</h4>
                <p className="text-sm text-muted-foreground">
                  eye_contact, routine_changes, social_cues, sensory_sensitivity, initiates_conversation, 
                  focused_interests, friendships, repetitive_behaviors, emotional_understanding, prefers_alone, 
                  adapts_new_environments, shares_interests, insists_sameness, imaginative_play, unusual_vocalizations, 
                  developmental_delays, turn_taking, interest_in_others, sensory_reactions, family_history
                </p>
              </div>
            </>
          )}

          {parseResult && !showReview && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                {parseResult.success && Object.keys(parseResult.autoFilledAnswers).length > 0 ? (
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-amber-500" />
                )}
                <div>
                  <p className="font-medium">
                    {Object.keys(parseResult.autoFilledAnswers).length} of {parentQuestions.length} questions auto-filled
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {parseResult.missingQuestions.length > 0 
                      ? `${parseResult.missingQuestions.length} questions need manual answers`
                      : 'All questions successfully mapped!'
                    }
                  </p>
                </div>
              </div>

              {parseResult.errors.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">Warnings:</p>
                  <ul className="text-xs text-amber-700 dark:text-amber-300 list-disc list-inside">
                    {parseResult.errors.slice(0, 5).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                    {parseResult.errors.length > 5 && (
                      <li>...and {parseResult.errors.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {Object.entries(parseResult.autoFilledAnswers).map(([qId, answer]) => {
                  const question = parentQuestions.find(q => q.id === qId);
                  return (
                    <Badge key={qId} variant="secondary" className="text-xs">
                      Q{parentQuestions.findIndex(q => q.id === qId) + 1}: {answer}
                    </Badge>
                  );
                })}
              </div>

              <Button 
                variant="outline" 
                onClick={() => setShowReview(true)}
                className="w-full"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Review & Edit Auto-filled Answers
              </Button>
            </div>
          )}

          {showReview && parseResult && (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {parentQuestions.map((question, index) => {
                  const isAutoFilled = question.id in parseResult.autoFilledAnswers;
                  return (
                    <div 
                      key={question.id} 
                      className={`p-3 rounded-lg border ${isAutoFilled ? 'border-green-200 bg-green-50/50 dark:bg-green-900/10' : 'border-amber-200 bg-amber-50/50 dark:bg-amber-900/10'}`}
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <Badge variant={isAutoFilled ? 'default' : 'outline'} className="shrink-0">
                          Q{index + 1}
                        </Badge>
                        <p className="text-sm">{question.text}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 ml-8">
                        {answerOptions.map((option) => (
                          <label key={option} className="flex items-center gap-1 cursor-pointer">
                            <Checkbox
                              checked={editedAnswers[question.id] === option}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setEditedAnswers(prev => ({ ...prev, [question.id]: option }));
                                }
                              }}
                            />
                            <span className="text-xs capitalize">{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={onBack} className="flex-1">
              Back
            </Button>
            {!parseResult ? (
              <Button variant="secondary" onClick={handleSkip} className="flex-1">
                Skip & Manual Entry
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleProceed} className="flex-1">
                {parseResult.missingQuestions.length === 0 
                  ? 'Continue to Video Upload' 
                  : `Continue (${parseResult.missingQuestions.length} manual)`
                }
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>

          {showReview && (
            <Button 
              variant="ghost" 
              onClick={() => setShowReview(false)}
              className="w-full"
            >
              Back to Summary
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
