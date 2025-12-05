import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  preFilledAnswers?: Record<string, AnswerValue>;
  patientId?: string;
  existingChildData?: ParentMetadata;
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

// Dropdown options for Parent Step0
const ageRangeOptions = ['0-2 years', '3-5 years', '6-8 years', '9-12 years', '13-17 years', '18+ years'];
const genderOptions = ['Male', 'Female', 'Other', 'Prefer not to say'];
const pronounOptions = ['he/him', 'she/her', 'they/them', 'other'];
const locationOptions = ['Urban', 'Suburban', 'Rural'];
const schoolTypeOptions = ['Mainstream', 'Mainstream with Support', 'Special Education', 'Home Schooled', 'Not in School'];
const conditionOptions = ['ADHD', 'Anxiety', 'Speech delay', 'Sensory Processing', 'Learning Disability', 'Other developmental conditions'];

export default function Questionnaire({ 
  role, 
  questions, 
  onComplete, 
  onBack,
  preFilledAnswers = {},
  patientId,
  existingChildData
}: QuestionnaireProps) {
  // For individual role, include video upload as extra step (16th question)
  const hasVideoStep = role === 'individual';
  const hasMetadataStep = role !== 'individual';
  
  // Calculate total steps
  const totalSteps = hasMetadataStep 
    ? questions.length + 1 
    : hasVideoStep 
      ? questions.length + 1 
      : questions.length;

  const [currentStep, setCurrentStep] = useState(hasMetadataStep ? 0 : 1);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>(preFilledAnswers);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [predictingVideo, setPredictingVideo] = useState(false);
  const { toast } = useToast();
  
  // Parent metadata state with dropdown-friendly values
  const [metadata, setMetadata] = useState<ParentMetadata & { videoUrl?: string; videoPrediction?: any; gender?: string; location?: string }>({
    childName: existingChildData?.childName || '',
    childAge: existingChildData?.childAge || '',
    pronouns: existingChildData?.pronouns || '',
    homeLanguage: existingChildData?.homeLanguage || 'English',
    schoolType: existingChildData?.schoolType || '',
    diagnosedConditions: existingChildData?.diagnosedConditions || [],
    videoUrl: '',
    videoPrediction: null,
    gender: '',
    location: '',
  });

  // Clinician metadata state
  const [clinicianMetadata, setClinicianMetadata] = useState<ClinicianMetadata & { videoUrl?: string; videoPrediction?: any }>({
    childName: '',
    childAge: '',
    pronoun: '',
    homeLanguage: '',
    problemsFaced: '',
    videoUrl: '',
    videoPrediction: null,
  });

  // Individual video state
  const [individualVideo, setIndividualVideo] = useState<{ videoUrl?: string; videoPrediction?: any }>({
    videoUrl: '',
    videoPrediction: null,
  });

  // Initialize with pre-filled answers if coming from Excel upload
  useEffect(() => {
    if (Object.keys(preFilledAnswers).length > 0) {
      setAnswers(preFilledAnswers);
      toast({
        title: "Data Imported",
        description: `${Object.keys(preFilledAnswers).length} questions auto-filled from Excel data`,
      });
    }
  }, []);

  // Pre-fill from existing data
  useEffect(() => {
    if (existingChildData) {
      setMetadata(prev => ({
        ...prev,
        childName: existingChildData.childName || prev.childName,
        childAge: existingChildData.childAge || prev.childAge,
        pronouns: existingChildData.pronouns || prev.pronouns,
        homeLanguage: existingChildData.homeLanguage || prev.homeLanguage,
        schoolType: existingChildData.schoolType || prev.schoolType,
        diagnosedConditions: existingChildData.diagnosedConditions || prev.diagnosedConditions,
      }));
    }
  }, [existingChildData]);

  const progress = (currentStep / totalSteps) * 100;
  
  // Calculate current question index based on role and step
  const getCurrentQuestionIndex = () => {
    if (hasMetadataStep) {
      return currentStep - 1;
    }
    return currentStep - 1;
  };
  
  const currentQuestionIndex = getCurrentQuestionIndex();
  const currentQuestion = questions[currentQuestionIndex];
  
  // Check if we're on the video step (for individual role)
  const isVideoStep = hasVideoStep && currentStep === questions.length + 1;

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
      
      if (role === 'parent') {
        setMetadata({ ...metadata, videoUrl: publicUrl });
      } else if (role === 'clinician') {
        setClinicianMetadata({ ...clinicianMetadata, videoUrl: publicUrl });
      } else if (role === 'individual') {
        setIndividualVideo({ ...individualVideo, videoUrl: publicUrl });
      }
      
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
          if (role === 'parent') {
            setMetadata(prev => ({ ...prev, videoPrediction: predictionData }));
          } else if (role === 'clinician') {
            setClinicianMetadata(prev => ({ ...prev, videoPrediction: predictionData }));
          } else if (role === 'individual') {
            setIndividualVideo(prev => ({ ...prev, videoPrediction: predictionData }));
          }
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
      // Complete the questionnaire
      let metadataToSend;
      if (role === 'parent') {
        metadataToSend = metadata;
      } else if (role === 'clinician') {
        metadataToSend = clinicianMetadata;
      } else if (role === 'individual') {
        metadataToSend = individualVideo.videoPrediction ? { videoPrediction: individualVideo.videoPrediction, videoUrl: individualVideo.videoUrl } : undefined;
      }
      onComplete(answers, metadataToSend);
    } else {
      setCurrentStep((prev) => prev + 1);
      if (ttsEnabled && !isVideoStep && currentQuestion) {
        const nextQuestion = questions[currentQuestionIndex + 1];
        if (nextQuestion) {
          speakQuestion(nextQuestion.text);
        }
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > (hasMetadataStep ? 0 : 1)) {
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
    if (currentStep === 0) {
      if (role === 'parent') {
        return metadata.childName && metadata.childAge;
      }
      if (role === 'clinician') {
        return clinicianMetadata.childName && clinicianMetadata.childAge && 
               clinicianMetadata.pronoun && clinicianMetadata.homeLanguage && 
               clinicianMetadata.problemsFaced;
      }
    }
    
    // Video step (individual role) - optional
    if (isVideoStep) {
      return true;
    }
    
    // Question steps
    if (currentStep > 0 && currentQuestionIndex < questions.length && currentQuestion) {
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
            {patientId && <span className="text-sm font-normal text-muted-foreground ml-2">ID: {patientId}</span>}
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
          {/* Parent Step 0 - Child Information with Dropdowns */}
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
                  disabled={!!existingChildData?.childName}
                />
                {existingChildData?.childName && (
                  <p className="text-xs text-muted-foreground">Name is locked to your account</p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="childAge">Age Range *</Label>
                  <Select 
                    value={metadata.childAge} 
                    onValueChange={(value) => setMetadata({ ...metadata, childAge: value })}
                    disabled={!!existingChildData?.childAge}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select age range" />
                    </SelectTrigger>
                    <SelectContent>
                      {ageRangeOptions.map(age => (
                        <SelectItem key={age} value={age}>{age}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select 
                    value={metadata.gender || ''} 
                    onValueChange={(value) => setMetadata({ ...metadata, gender: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      {genderOptions.map(g => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pronouns">Pronouns</Label>
                  <Select 
                    value={metadata.pronouns} 
                    onValueChange={(value) => setMetadata({ ...metadata, pronouns: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select pronouns" />
                    </SelectTrigger>
                    <SelectContent>
                      {pronounOptions.map(p => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location Type</Label>
                  <Select 
                    value={metadata.location || ''} 
                    onValueChange={(value) => setMetadata({ ...metadata, location: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locationOptions.map(l => (
                        <SelectItem key={l} value={l}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <Select 
                    value={metadata.schoolType} 
                    onValueChange={(value) => setMetadata({ ...metadata, schoolType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select school type" />
                    </SelectTrigger>
                    <SelectContent>
                      {schoolTypeOptions.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Diagnosed Conditions (if any)</Label>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    {conditionOptions.map((condition) => (
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
                    {metadata.videoUrl && !metadata.videoPrediction && !predictingVideo && (
                      <p className="text-xs text-green-600">✓ Video uploaded successfully</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : role === 'clinician' && currentStep === 0 ? (
            // Clinician Step 0
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Patient Information</h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clinician-childName">Patient Name *</Label>
                  <Input
                    id="clinician-childName"
                    value={clinicianMetadata.childName}
                    onChange={(e) => setClinicianMetadata({ ...clinicianMetadata, childName: e.target.value })}
                    placeholder="Enter patient's name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clinician-childAge">Patient Age *</Label>
                  <Select 
                    value={clinicianMetadata.childAge} 
                    onValueChange={(value) => setClinicianMetadata({ ...clinicianMetadata, childAge: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select age range" />
                    </SelectTrigger>
                    <SelectContent>
                      {ageRangeOptions.map(age => (
                        <SelectItem key={age} value={age}>{age}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clinician-pronoun">Pronoun *</Label>
                  <Select 
                    value={clinicianMetadata.pronoun} 
                    onValueChange={(value) => setClinicianMetadata({ ...clinicianMetadata, pronoun: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select pronoun" />
                    </SelectTrigger>
                    <SelectContent>
                      {pronounOptions.map(p => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                <Label htmlFor="clinician-problemsFaced">Problems/Challenges Faced by Patient *</Label>
                <Input
                  id="clinician-problemsFaced"
                  value={clinicianMetadata.problemsFaced}
                  onChange={(e) => setClinicianMetadata({ ...clinicianMetadata, problemsFaced: e.target.value })}
                  placeholder="Describe the challenges the patient is facing"
                />
              </div>

              <div className="space-y-4">
                <div className="border-t pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="clinician-video">Upload Video for ML Analysis (Optional)</Label>
                    <div className="flex items-center gap-2">
                      <Upload className="w-4 h-4 text-muted-foreground" />
                      <Label htmlFor="clinician-video" className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                        Upload a short video of the patient for enhanced ML-powered assessment
                      </Label>
                    </div>
                    <Input
                      id="clinician-video"
                      type="file"
                      accept="video/*"
                      onChange={handleVideoUpload}
                      disabled={uploading || predictingVideo}
                      className="cursor-pointer"
                    />
                    {uploading && <p className="text-sm text-muted-foreground">Uploading video...</p>}
                    {predictingVideo && <p className="text-sm text-muted-foreground">🤖 Analyzing video with ML model...</p>}
                    {clinicianMetadata.videoPrediction && (
                      <p className="text-sm text-green-600">✓ Video analysis complete (Score: {clinicianMetadata.videoPrediction.prediction_score?.toFixed(1)})</p>
                    )}
                    {clinicianMetadata.videoUrl && !clinicianMetadata.videoPrediction && !predictingVideo && (
                      <p className="text-xs text-green-600">✓ Video uploaded successfully</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : isVideoStep ? (
            // Individual Video Upload Step (16th step)
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Video Upload (Optional)</h3>
              <p className="text-muted-foreground">
                Upload a short video for enhanced ML-powered assessment. This step is optional but can improve the accuracy of your results.
              </p>
              
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <Input
                  id="individual-video"
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  disabled={uploading || predictingVideo}
                  className="max-w-xs mx-auto"
                />
                <p className="text-sm text-muted-foreground mt-2">Max file size: 20MB</p>
              </div>
              
              {uploading && <p className="text-center text-muted-foreground">Uploading video...</p>}
              {predictingVideo && <p className="text-center text-muted-foreground">🤖 Analyzing video with ML model...</p>}
              {individualVideo.videoPrediction && (
                <p className="text-center text-green-600">✓ Video analysis complete (Score: {individualVideo.videoPrediction.prediction_score?.toFixed(1)})</p>
              )}
              {individualVideo.videoUrl && !individualVideo.videoPrediction && !predictingVideo && (
                <p className="text-center text-green-600">✓ Video uploaded successfully</p>
              )}
            </div>
          ) : currentQuestion ? (
            // Question Display
            <div className="space-y-6">
              <div className="min-h-[120px]">
                <h3 className="text-xl font-medium leading-relaxed">
                  {currentQuestion.text}
                </h3>
                {preFilledAnswers[currentQuestion.id] && (
                  <p className="text-sm text-muted-foreground mt-2">
                    (Auto-filled from Excel data)
                  </p>
                )}
              </div>

              <RadioGroup
                value={answers[currentQuestion.id] || ''}
                onValueChange={(value) => handleAnswer(currentQuestion.id, value as AnswerValue)}
                className="space-y-3"
              >
                {answerOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`flex items-center space-x-3 p-4 rounded-lg border-2 hover:bg-accent/50 transition-colors cursor-pointer ${
                      preFilledAnswers[currentQuestion.id] === option.value ? 'border-primary bg-primary/5' : ''
                    }`}
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
              {currentStep === totalSteps ? 'Complete' : isVideoStep ? 'Skip & Complete' : 'Next'}
              {currentStep !== totalSteps && !isVideoStep && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
