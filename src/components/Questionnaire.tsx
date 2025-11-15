import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Volume2, ArrowLeft, ArrowRight, Upload } from 'lucide-react';
import { Question, ParentMetadata } from '@/data/questionBanks';
import { AnswerValue } from '@/utils/scoring';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface QuestionnaireProps {
  role: 'individual' | 'parent' | 'clinician';
  questions: Question[];
  onComplete: (answers: Record<string, AnswerValue>, metadata?: any) => void;
  onBack: () => void;
}

interface ClinicianMetadata {
  childName: string;
  childAge: string;
  pronoun: string;
  homeLanguage: string;
  problemsFaced: string;
}

const answerOptions: { value: AnswerValue; label: string }[] = [
  { value: 'never', label: 'Never' },
  { value: 'rarely', label: 'Rarely' },
  { value: 'sometimes', label: 'Sometimes' },
  { value: 'often', label: 'Often' },
  { value: 'always', label: 'Always' },
];

export default function Questionnaire({ role, questions, onComplete, onBack }: QuestionnaireProps) {
  // Individual: Step 0=Video, Step 1+=Questions
  // Parent/Clinician: Step 0=Metadata, Step 1=Video, Step 2+=Questions
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [predictingVideo, setPredictingVideo] = useState(false);
  const { toast } = useToast();
  
  // Parent metadata state
  const [metadata, setMetadata] = useState<ParentMetadata & { videoUrl?: string; videoPrediction?: any }>({
    childName: '',
    childAge: '',
    pronouns: '',
    homeLanguage: '',
    schoolType: '',
    diagnosedConditions: [],
    videoUrl: '',
    videoPrediction: null,
  });

  // Clinician metadata state
  const [clinicianMetadata, setClinicianMetadata] = useState<ClinicianMetadata>({
    childName: '',
    childAge: '',
    pronoun: '',
    homeLanguage: '',
    problemsFaced: '',
  });

  const videoStep = role === 'individual' ? 0 : 1;
  const firstQuestionStep = role === 'individual' ? 1 : 2;
  const totalSteps = role === 'individual' ? questions.length + 1 : questions.length + 2;
  const progress = (currentStep / totalSteps) * 100;
  const currentQuestionIndex = currentStep < firstQuestionStep ? -1 : currentStep - firstQuestionStep;
  const currentQuestion = currentQuestionIndex >= 0 ? questions[currentQuestionIndex] : null;

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Video must be under 20MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to upload videos",
        variant: "destructive",
      });
      setUploading(false);
      return;
    }

    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('assessment-videos')
      .upload(filePath, file);

    if (uploadError) {
      toast({
        title: "Upload failed",
        description: uploadError.message,
        variant: "destructive",
      });
    } else {
      const { data: { publicUrl } } = supabase.storage
        .from('assessment-videos')
        .getPublicUrl(filePath);
      
      setMetadata({ ...metadata, videoUrl: publicUrl });
      toast({
        title: "Success",
        description: "Video uploaded successfully",
      });

      // Get prediction from ML model
      setPredictingVideo(true);
      try {
        const { data: predictionData, error: predictionError } = await supabase.functions.invoke('predict-video', {
          body: { videoUrl: publicUrl }
        });

        if (predictionError) {
          console.error('Prediction error:', predictionError);
          toast({
            title: "Analysis Warning",
            description: "Video uploaded but ML analysis unavailable. Continuing with questionnaire only.",
            variant: "default",
          });
        } else if (predictionData) {
          setMetadata(prev => ({ ...prev, videoPrediction: predictionData }));
          toast({
            title: "Video Analyzed",
            description: "ML model prediction completed successfully!",
          });
        }
      } catch (predError) {
        console.error('Prediction error:', predError);
      } finally {
        setPredictingVideo(false);
      }
    }

    setUploading(false);
  };

  const handleAnswer = (questionId: string, value: AnswerValue) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (currentStep === totalSteps) {
      const metadataToSend = role === 'parent' ? metadata : role === 'clinician' ? clinicianMetadata : undefined;
      onComplete(answers, metadataToSend);
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
    // Step 0: Metadata or Video upload
    if (currentStep === 0) {
      if (role === 'individual') return metadata.videoUrl !== '';
      if (role === 'parent') return metadata.childName && metadata.childAge;
      if (role === 'clinician') {
        return clinicianMetadata.childName && clinicianMetadata.childAge && 
               clinicianMetadata.pronoun && clinicianMetadata.homeLanguage && 
               clinicianMetadata.problemsFaced;
      }
    }
    // Video step for parent/clinician
    if (currentStep === videoStep && role !== 'individual') {
      return metadata.videoUrl !== '';
    }
    // Question steps
    if (currentStep >= firstQuestionStep && currentQuestion) {
      return answers[currentQuestion.id] !== undefined;
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
                <div className="grid md:grid-cols-2 gap-4">
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

                  <div className="space-y-2">
                    <Label htmlFor="videoUpload" className="flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Upload Video (Optional)
                    </Label>
                    <Input
                      id="videoUpload"
                      type="file"
                      accept="video/*"
                      onChange={handleVideoUpload}
                      disabled={uploading || predictingVideo}
                      className="cursor-pointer"
                    />
                    {uploading && <p className="text-sm text-muted-foreground">Uploading video...</p>}
                    {predictingVideo && <p className="text-sm text-muted-foreground">🤖 Analyzing video with ML model...</p>}
                    {metadata.videoPrediction && (
                      <p className="text-sm text-green-600">✓ Video analysis complete (Score: {metadata.videoPrediction.prediction_score?.toFixed(1)})</p>
                    )}
                    {uploading && <p className="text-xs text-muted-foreground">Uploading...</p>}
                    {metadata.videoUrl && (
                      <p className="text-xs text-green-600">✓ Video uploaded successfully</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : role === 'clinician' && currentStep === 0 ? (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Child Information</h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clinician-childName">Child's Name *</Label>
                  <Input
                    id="clinician-childName"
                    value={clinicianMetadata.childName}
                    onChange={(e) => setClinicianMetadata({ ...clinicianMetadata, childName: e.target.value })}
                    placeholder="Enter child's name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clinician-childAge">Child's Age *</Label>
                  <Input
                    id="clinician-childAge"
                    value={clinicianMetadata.childAge}
                    onChange={(e) => setClinicianMetadata({ ...clinicianMetadata, childAge: e.target.value })}
                    placeholder="e.g., 5 years"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clinician-pronoun">Pronoun *</Label>
                  <Input
                    id="clinician-pronoun"
                    value={clinicianMetadata.pronoun}
                    onChange={(e) => setClinicianMetadata({ ...clinicianMetadata, pronoun: e.target.value })}
                    placeholder="he/him, she/her, they/them"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clinician-homeLanguage">Home Language *</Label>
                  <Input
                    id="clinician-homeLanguage"
                    value={clinicianMetadata.homeLanguage}
                    onChange={(e) => setClinicianMetadata({ ...clinicianMetadata, homeLanguage: e.target.value })}
                    placeholder="Primary language at home"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="clinician-problemsFaced">Problems/Challenges Faced by Child *</Label>
                <Input
                  id="clinician-problemsFaced"
                  value={clinicianMetadata.problemsFaced}
                  onChange={(e) => setClinicianMetadata({ ...clinicianMetadata, problemsFaced: e.target.value })}
                  placeholder="Describe the challenges the child is facing"
                />
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
