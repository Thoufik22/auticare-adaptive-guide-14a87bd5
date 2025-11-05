import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Volume2, ArrowLeft, ArrowRight } from 'lucide-react';
import { Question, ParentMetadata } from '@/data/questionBanks';
import { AnswerValue } from '@/utils/scoring';

interface QuestionnaireProps {
  role: 'individual' | 'parent' | 'clinician';
  questions: Question[];
  onComplete: (answers: Record<string, AnswerValue>, metadata?: ParentMetadata) => void;
  onBack: () => void;
}

const answerOptions: { value: AnswerValue; label: string }[] = [
  { value: 'never', label: 'Never' },
  { value: 'rarely', label: 'Rarely' },
  { value: 'sometimes', label: 'Sometimes' },
  { value: 'often', label: 'Often' },
  { value: 'always', label: 'Always' },
];

export default function Questionnaire({ role, questions, onComplete, onBack }: QuestionnaireProps) {
  const [currentStep, setCurrentStep] = useState(role === 'parent' ? 0 : 1);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [ttsEnabled, setTtsEnabled] = useState(false);
  
  // Parent metadata state
  const [metadata, setMetadata] = useState<ParentMetadata>({
    childName: '',
    childAge: '',
    pronouns: '',
    homeLanguage: '',
    schoolType: '',
    diagnosedConditions: [],
  });

  const totalSteps = role === 'parent' ? questions.length + 1 : questions.length;
  const progress = (currentStep / totalSteps) * 100;
  const currentQuestionIndex = role === 'parent' ? currentStep - 1 : currentStep - 1;
  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswer = (questionId: string, value: AnswerValue) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (currentStep === totalSteps) {
      onComplete(answers, role === 'parent' ? metadata : undefined);
    } else {
      setCurrentStep((prev) => prev + 1);
      if (ttsEnabled && currentStep < totalSteps) {
        speakQuestion(questions[currentQuestionIndex + 1]?.text);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    } else {
      onBack();
    }
  };

  const speakQuestion = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      speechSynthesis.speak(utterance);
    }
  };

  const toggleTTS = () => {
    setTtsEnabled(!ttsEnabled);
    if (!ttsEnabled && currentQuestion) {
      speakQuestion(currentQuestion.text);
    }
  };

  const canProceed = () => {
    if (role === 'parent' && currentStep === 0) {
      return metadata.childName && metadata.childAge;
    }
    if (currentStep > 0 && currentStep <= questions.length) {
      return answers[currentQuestion?.id] !== undefined;
    }
    return true;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-3xl w-full animate-fade-in">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="sm" onClick={handlePrevious}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTTS}
              className={ttsEnabled ? 'bg-accent' : ''}
            >
              <Volume2 className="w-4 h-4 mr-2" />
              {ttsEnabled ? 'TTS On' : 'TTS Off'}
            </Button>
          </div>
          
          <CardTitle className="text-2xl mb-4">
            {role === 'individual' && 'Self-Assessment'}
            {role === 'parent' && 'Caregiver Assessment'}
            {role === 'clinician' && 'Clinical Assessment'}
          </CardTitle>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Step {currentStep} of {totalSteps}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {role === 'parent' && currentStep === 0 ? (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Child Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="childName">Child's Name *</Label>
                <Input
                  id="childName"
                  value={metadata.childName}
                  onChange={(e) => setMetadata({ ...metadata, childName: e.target.value })}
                  placeholder="Enter child's name"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="childAge">Age *</Label>
                  <Input
                    id="childAge"
                    value={metadata.childAge}
                    onChange={(e) => setMetadata({ ...metadata, childAge: e.target.value })}
                    placeholder="e.g., 5 years"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pronouns">Pronouns</Label>
                  <Input
                    id="pronouns"
                    value={metadata.pronouns}
                    onChange={(e) => setMetadata({ ...metadata, pronouns: e.target.value })}
                    placeholder="e.g., he/him, she/her, they/them"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="homeLanguage">Home Language</Label>
                  <Input
                    id="homeLanguage"
                    value={metadata.homeLanguage}
                    onChange={(e) => setMetadata({ ...metadata, homeLanguage: e.target.value })}
                    placeholder="Primary language spoken"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="schoolType">School/Setting Type</Label>
                  <Input
                    id="schoolType"
                    value={metadata.schoolType}
                    onChange={(e) => setMetadata({ ...metadata, schoolType: e.target.value })}
                    placeholder="e.g., mainstream, special education"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Diagnosed Conditions (if any)</Label>
                <div className="space-y-2">
                  {['ADHD', 'Anxiety', 'Speech delay', 'Other developmental conditions'].map((condition) => (
                    <div key={condition} className="flex items-center space-x-2">
                      <Checkbox
                        id={condition}
                        checked={metadata.diagnosedConditions.includes(condition)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setMetadata({
                              ...metadata,
                              diagnosedConditions: [...metadata.diagnosedConditions, condition],
                            });
                          } else {
                            setMetadata({
                              ...metadata,
                              diagnosedConditions: metadata.diagnosedConditions.filter((c) => c !== condition),
                            });
                          }
                        }}
                      />
                      <label htmlFor={condition} className="text-sm cursor-pointer">
                        {condition}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : currentQuestion ? (
            <div className="space-y-6">
              <div className="min-h-[120px]">
                <h3 className="text-xl font-medium leading-relaxed">
                  {currentQuestion.text}
                </h3>
              </div>

              <RadioGroup
                value={answers[currentQuestion.id] || ''}
                onValueChange={(value) => handleAnswer(currentQuestion.id, value as AnswerValue)}
                className="space-y-3"
              >
                {answerOptions.map((option) => (
                  <div
                    key={option.value}
                    className="flex items-center space-x-3 p-4 rounded-lg border-2 hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => handleAnswer(currentQuestion.id, option.value)}
                  >
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label
                      htmlFor={option.value}
                      className="flex-1 cursor-pointer text-lg font-medium"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          ) : null}

          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={handlePrevious}
              size="lg"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              size="lg"
              className="bg-primary hover:bg-primary/90"
            >
              {currentStep === totalSteps ? 'Complete' : 'Next'}
              {currentStep !== totalSteps && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
