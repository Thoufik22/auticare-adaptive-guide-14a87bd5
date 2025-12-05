import { useState, useEffect } from 'react';
import { Auth } from '@/components/Auth';
import RoleSelection from '@/components/RoleSelection';
import PatientIdEntry from '@/components/PatientIdEntry';
import ExcelUpload from '@/components/ExcelUpload';
import Questionnaire from '@/components/Questionnaire';
import ResultModal from '@/components/ResultModal';
import Dashboard from '@/components/Dashboard';
import CalmZone from '@/components/CalmZone';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { individualQuestions, parentQuestions, getQuestionWeights, ParentMetadata } from '@/data/questionBanks';
import { calculateScore, ScoringResult, Answer, AnswerValue } from '@/utils/scoring';
import { Sparkles, LogOut, AlertCircle } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useUserAssessmentData } from '@/hooks/useUserAssessmentData';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type AppState = 'role-selection' | 'patient-id' | 'excel-upload' | 'questionnaire' | 'results' | 'dashboard' | 'calm-zone';
type Role = 'individual' | 'parent' | 'clinician';

export default function Index() {
  const [appState, setAppState] = useState<AppState>('role-selection');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [scoringResult, setScoringResult] = useState<ScoringResult | null>(null);
  const [parentMetadata, setParentMetadata] = useState<ParentMetadata | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [patientId, setPatientId] = useState<string>('');
  const [excelAnswers, setExcelAnswers] = useState<Record<string, AnswerValue>>({});
  const [excelData, setExcelData] = useState<Record<string, any> | null>(null);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const { toast } = useToast();

  const { 
    assessmentData, 
    loading: loadingAssessmentData, 
    hasExistingData,
    saveAssessmentData,
    clearAssessmentData 
  } = useUserAssessmentData(user);

  // Auto-redirect to dashboard if user has existing data with a score
  useEffect(() => {
    if (hasExistingData && assessmentData && assessmentData.last_score !== null) {
      setSelectedRole(assessmentData.role as Role);
      setPatientId(assessmentData.patient_id);
      
      // Reconstruct the scoring result from saved data
      if (assessmentData.last_assessment_answers) {
        const questionWeights = getQuestionWeights(assessmentData.role as Role);
        const answerArray: Answer[] = Object.entries(assessmentData.last_assessment_answers).map(([questionId, value]) => ({
          questionId,
          value: value as AnswerValue,
        }));
        const result = calculateScore(answerArray, questionWeights, false);
        setScoringResult(result);
        
        if (assessmentData.child_data) {
          setParentMetadata(assessmentData.child_data as unknown as ParentMetadata);
        }
        
        setAppState('dashboard');
        toast({
          title: "Welcome back!",
          description: `Loaded your ${assessmentData.role} dashboard with ID: ${assessmentData.patient_id}`,
        });
      }
    }
  }, [hasExistingData, assessmentData]);

  const handleAuthSuccess = (authenticatedUser: User, role: string) => {
    setUser(authenticatedUser);
    setIsAuthenticated(true);
    setSelectedRole(role as Role);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAuthenticated(false);
    setSelectedRole(null);
    setScoringResult(null);
    setParentMetadata(null);
    setPatientId('');
    setExcelAnswers({});
    setExcelData(null);
    setAppState('role-selection');
  };

  const handleResetData = async () => {
    const result = await clearAssessmentData();
    if (result.success) {
      setSelectedRole(null);
      setScoringResult(null);
      setParentMetadata(null);
      setPatientId('');
      setExcelAnswers({});
      setExcelData(null);
      setAppState('role-selection');
      toast({
        title: "Data Reset",
        description: "Your assessment data has been cleared. You can now start fresh.",
      });
    }
    setShowResetDialog(false);
  };

  const handleRoleSelection = (role: Role) => {
    setSelectedRole(role);
    
    // Check if user already has data for this role
    if (hasExistingData && assessmentData) {
      if (assessmentData.role !== role) {
        toast({
          title: "Role Locked",
          description: `Your account is linked to the ${assessmentData.role} role. To use a different role, please log out and use a new email.`,
          variant: "destructive",
        });
        return;
      }
      setPatientId(assessmentData.patient_id);
    }
    
    setAppState('patient-id');
  };

  const handlePatientIdConfirm = (confirmedPatientId: string) => {
    setPatientId(confirmedPatientId);
    
    // For clinicians, go to Excel upload first
    if (selectedRole === 'clinician') {
      setAppState('excel-upload');
    } else {
      setAppState('questionnaire');
    }
  };

  const handleExcelComplete = (answers: Record<string, AnswerValue>, data: Record<string, any> | null, skipped: boolean) => {
    setExcelAnswers(answers);
    setExcelData(data);
    setAppState('questionnaire');
  };

  const handleQuestionnaireComplete = async (answers: Record<string, AnswerValue>, metadata?: any) => {
    if ((selectedRole === 'parent' || selectedRole === 'clinician') && metadata) {
      setParentMetadata(metadata);
    }

    const questionWeights = getQuestionWeights(selectedRole!);
    const answerArray: Answer[] = Object.entries(answers).map(([questionId, value]) => ({
      questionId,
      value,
    }));

    const hasFamilyHistory = selectedRole === 'parent' && answers['par_20'] === 'always';
    const videoPrediction = metadata?.videoPrediction;
    const result = calculateScore(answerArray, questionWeights, hasFamilyHistory, videoPrediction);
    setScoringResult(result);

    // Save assessment data to database
    if (user) {
      await saveAssessmentData(
        user.email || '',
        selectedRole!,
        patientId,
        metadata,
        excelData,
        answers,
        result.normalizedScore
      );
    }

    setAppState('results');
  };

  const handleResultsClose = () => {
    setAppState('dashboard');
  };

  const handleBackToHomeFromResults = () => {
    setAppState('role-selection');
    setSelectedRole(null);
    setScoringResult(null);
    setParentMetadata(null);
    setExcelAnswers({});
    setExcelData(null);
  };

  const handleBackToRoles = () => {
    setSelectedRole(null);
    setAppState('role-selection');
    setScoringResult(null);
    setParentMetadata(null);
    setExcelAnswers({});
    setExcelData(null);
  };

  const handleNavigateToCalmZone = () => {
    setAppState('calm-zone');
  };

  const handleBackToDashboard = () => {
    setAppState('dashboard');
  };

  const activateDemoMode = () => {
    setDemoMode(true);
    const demoAnswers: Record<string, AnswerValue> = {};
    individualQuestions.forEach((q, index) => {
      demoAnswers[q.id] = index % 3 === 0 ? 'never' : index % 3 === 1 ? 'rarely' : 'sometimes';
    });
    
    const questionWeights = getQuestionWeights('individual');
    const answerArray: Answer[] = Object.entries(demoAnswers).map(([questionId, value]) => ({
      questionId,
      value,
    }));
    
    const result = calculateScore(answerArray, questionWeights, false);
    setSelectedRole('individual');
    setScoringResult(result);
    setAppState('dashboard');
  };

  const activateDemoParent = () => {
    setDemoMode(true);
    const demoAnswers: Record<string, AnswerValue> = {};
    parentQuestions.forEach((q, index) => {
      demoAnswers[q.id] = index % 2 === 0 ? 'often' : 'sometimes';
    });
    
    const questionWeights = getQuestionWeights('parent');
    const answerArray: Answer[] = Object.entries(demoAnswers).map(([questionId, value]) => ({
      questionId,
      value,
    }));
    
    const result = calculateScore(answerArray, questionWeights, true);
    setSelectedRole('parent');
    setParentMetadata({
      childName: 'Alex',
      childAge: '3-5 years',
      pronouns: 'they/them',
      homeLanguage: 'English',
      schoolType: 'Mainstream',
      diagnosedConditions: ['ADHD'],
    });
    setScoringResult(result);
    setAppState('dashboard');
  };

  const activateDemoHigh = () => {
    setDemoMode(true);
    const demoAnswers: Record<string, AnswerValue> = {};
    parentQuestions.forEach((q) => {
      demoAnswers[q.id] = 'always';
    });
    
    const questionWeights = getQuestionWeights('parent');
    const answerArray: Answer[] = Object.entries(demoAnswers).map(([questionId, value]) => ({
      questionId,
      value,
    }));
    
    const result = calculateScore(answerArray, questionWeights, true);
    setSelectedRole('parent');
    setParentMetadata({
      childName: 'Jordan',
      childAge: '3-5 years',
      pronouns: 'he/him',
      homeLanguage: 'English',
      schoolType: 'Special Education',
      diagnosedConditions: ['Speech delay', 'Anxiety'],
    });
    setScoringResult(result);
    setAppState('dashboard');
  };

  // Show auth screen if not authenticated
  if (!isAuthenticated) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  // Show loading while checking for existing data
  if (loadingAssessmentData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header with Logout and Reset */}
      <div className="fixed top-4 left-4 z-50 flex gap-2">
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
        {hasExistingData && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowResetDialog(true)}
            className="text-destructive hover:text-destructive"
          >
            <AlertCircle className="w-4 h-4 mr-2" />
            Reset Data
          </Button>
        )}
      </div>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Assessment Data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your saved assessment data, including your patient/child ID and all assessment history. 
              You'll need to start fresh with a new ID. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetData} className="bg-destructive text-destructive-foreground">
              Reset Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Demo Mode Toggle */}
      {appState === 'role-selection' && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          <Badge variant="outline" className="bg-background">
            <Sparkles className="w-3 h-3 mr-1" />
            Demo Mode
          </Badge>
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={activateDemoMode}
              className="bg-mint hover:bg-mint/90"
            >
              Demo: Low
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={activateDemoParent}
              className="bg-lavender hover:bg-lavender/90"
            >
              Demo: Moderate
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={activateDemoHigh}
              className="bg-coral hover:bg-coral/90 text-white"
            >
              Demo: High
            </Button>
          </div>
        </div>
      )}

      {appState === 'role-selection' && (
        <RoleSelection onSelectRole={handleRoleSelection} />
      )}

      {appState === 'patient-id' && selectedRole && (
        <PatientIdEntry
          role={selectedRole}
          existingPatientId={hasExistingData ? assessmentData?.patient_id : undefined}
          onConfirm={handlePatientIdConfirm}
          onBack={handleBackToRoles}
        />
      )}

      {appState === 'excel-upload' && selectedRole === 'clinician' && (
        <ExcelUpload
          onComplete={handleExcelComplete}
          onBack={() => setAppState('patient-id')}
        />
      )}

      {appState === 'questionnaire' && selectedRole && (
        <Questionnaire
          role={selectedRole}
          questions={selectedRole === 'individual' ? individualQuestions : parentQuestions}
          onComplete={handleQuestionnaireComplete}
          onBack={() => selectedRole === 'clinician' ? setAppState('excel-upload') : setAppState('patient-id')}
          preFilledAnswers={excelAnswers}
          patientId={patientId}
          existingChildData={hasExistingData ? assessmentData?.child_data as unknown as ParentMetadata : undefined}
        />
      )}

      {appState === 'results' && scoringResult && (
        <ResultModal 
          result={scoringResult} 
          onClose={handleResultsClose} 
          onBackToHome={handleBackToHomeFromResults}
          videoUrl={parentMetadata?.videoUrl}
        />
      )}

      {appState === 'dashboard' && scoringResult && selectedRole && (
        <Dashboard
          role={selectedRole}
          result={scoringResult}
          metadata={parentMetadata || undefined}
          onNavigateToCalmZone={handleNavigateToCalmZone}
        />
      )}

      {appState === 'calm-zone' && (
        <CalmZone onBack={handleBackToDashboard} />
      )}

      {/* Footer Note */}
      {(appState === 'dashboard' || appState === 'calm-zone') && (
        <div className="fixed bottom-4 left-4">
          <Button variant="ghost" size="sm" onClick={handleBackToRoles}>
            ← Start New Assessment
          </Button>
        </div>
      )}
    </div>
  );
}
