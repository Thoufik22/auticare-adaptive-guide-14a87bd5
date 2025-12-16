import { useState, useEffect } from 'react';
import { Auth } from '@/components/Auth';
import RoleSelection from '@/components/RoleSelection';
import PatientIdEntry from '@/components/PatientIdEntry';

import ReportLookup from '@/components/ReportLookup';
import Questionnaire from '@/components/Questionnaire';
import ResultModal from '@/components/ResultModal';
import Dashboard from '@/components/Dashboard';
import CalmZone from '@/components/CalmZone';
import { Button } from '@/components/ui/button';
import { individualQuestions, parentQuestions, getQuestionWeights, ParentMetadata } from '@/data/questionBanks';
import { calculateScore, ScoringResult, Answer, AnswerValue } from '@/utils/scoring';
import { calculateFusedScore, getSeverityFromScore } from '@/utils/fusedScoring';
import { LogOut, AlertCircle } from 'lucide-react';
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

type AppState = 'role-selection' | 'patient-id' | 'report-lookup' | 'questionnaire' | 'results' | 'dashboard' | 'calm-zone';
type Role = 'individual' | 'parent' | 'clinician';

export default function Index() {
  const [appState, setAppState] = useState<AppState>('role-selection');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [scoringResult, setScoringResult] = useState<ScoringResult | null>(null);
  const [parentMetadata, setParentMetadata] = useState<ParentMetadata | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [patientId, setPatientId] = useState<string>('');
  const [excelAnswers, setExcelAnswers] = useState<Record<string, AnswerValue>>({});
  const [excelData, setExcelData] = useState<Record<string, any> | null>(null);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [isFirstTimeAssessment, setIsFirstTimeAssessment] = useState(true);
  const { toast } = useToast();

  const { 
    assessmentData, 
    loading: loadingAssessmentData, 
    hasExistingData,
    saveAssessmentData,
    clearAssessmentData 
  } = useUserAssessmentData(user);

  // Auto-redirect to dashboard ONLY if user has existing COMPLETED assessment (login flow - returning users only)
  useEffect(() => {
    // Only auto-redirect if appState is still at initial state (role-selection)
    if (!loadingAssessmentData && hasExistingData && assessmentData && assessmentData.assessment_complete && appState === 'role-selection') {
      // This is a returning user - not first time
      setIsFirstTimeAssessment(false);
      
      // Set role and patient ID from stored data
      setSelectedRole(assessmentData.role as Role);
      setPatientId(assessmentData.patient_id);
      
      // Reconstruct the scoring result from saved data
      if (assessmentData.last_assessment_answers) {
        const questionWeights = getQuestionWeights(assessmentData.role as Role);
        const answerArray: Answer[] = Object.entries(assessmentData.last_assessment_answers).map(([questionId, value]) => ({
          questionId,
          value: value as AnswerValue,
        }));
        
        const storedFusedScore = assessmentData.fused_score;
        const storedModelScore = assessmentData.model_score;
        
        const videoPrediction = storedModelScore ? {
          prediction_score: storedModelScore,
          confidence: 0.7
        } : undefined;
        
        const result = calculateScore(answerArray, questionWeights, false, videoPrediction);
        
        if (storedFusedScore !== null && storedFusedScore !== undefined) {
          result.fusedScore = storedFusedScore;
          const severity = getSeverityFromScore(storedFusedScore);
          result.severity = severity.level as ScoringResult['severity'];
          result.severityLabel = severity.label;
        }
        
        setScoringResult(result);
        
        if (assessmentData.child_data) {
          setParentMetadata(assessmentData.child_data as unknown as ParentMetadata);
        }
        
        // Go directly to dashboard for returning users with completed assessment
        setAppState('dashboard');
        toast({
          title: "Welcome back!",
          description: `Loaded your ${assessmentData.role} dashboard with ID: ${assessmentData.patient_id}`,
        });
      }
    }
  }, [loadingAssessmentData, hasExistingData, assessmentData, appState]);

  const handleAuthSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    setIsAuthenticated(true);
    // Don't set role here - let user select after auth
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
    
    // For clinicians, go to Report Lookup first (RAG-based)
    if (selectedRole === 'clinician') {
      setAppState('report-lookup');
    } else {
      setAppState('questionnaire');
    }
  };

  const handleReportFound = async (
    answers: Record<string, AnswerValue>,
    metadata: {
      childName: string;
      childAge: string;
      pronoun: string;
      homeLanguage: string;
      problemsFaced: string;
      videoUrl?: string;
    }
  ) => {
    // Set metadata for clinician
    const clinicianMetadata: ParentMetadata = {
      childName: metadata.childName,
      childAge: metadata.childAge,
      pronouns: metadata.pronoun,
      homeLanguage: metadata.homeLanguage,
      schoolType: '',
      diagnosedConditions: [],
      videoUrl: metadata.videoUrl,
    };
    setParentMetadata(clinicianMetadata);

    // Calculate score directly from answers
    const questionWeights = getQuestionWeights('clinician');
    const answerArray: Answer[] = Object.entries(answers).map(([questionId, value]) => ({
      questionId,
      value,
    }));

    const hasFamilyHistory = answers['par_20'] === 'always';
    const result = calculateScore(answerArray, questionWeights, hasFamilyHistory, undefined);
    
    // Calculate fused score (no video prediction for RAG lookup)
    const fusedScore = calculateFusedScore(result.normalizedScore, null, 0.7);
    result.fusedScore = fusedScore;
    const fusedSeverity = getSeverityFromScore(fusedScore);
    result.severity = fusedSeverity.level as ScoringResult['severity'];
    result.severityLabel = fusedSeverity.label;
    
    setScoringResult(result);

    // Save assessment data
    if (user) {
      await saveAssessmentData(
        user.email || '',
        'clinician',
        patientId,
        clinicianMetadata,
        null,
        answers,
        result.normalizedScore,
        null,
        Math.round(fusedScore)
      );
    }

    // Go directly to results
    setAppState('results');
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
    
    // Calculate fused score using the formula: 60% questionnaire + 40% model
    const modelScore = videoPrediction?.prediction_score || null;
    const modelConfidence = videoPrediction?.confidence || 0.7;
    const fusedScore = calculateFusedScore(result.normalizedScore, modelScore, modelConfidence);
    
    // Update result with fused score
    result.fusedScore = fusedScore;
    const fusedSeverity = getSeverityFromScore(fusedScore);
    result.severity = fusedSeverity.level as ScoringResult['severity'];
    result.severityLabel = fusedSeverity.label;
    
    setScoringResult(result);

    // Save assessment data to database with fused scoring
    if (user) {
      await saveAssessmentData(
        user.email || '',
        selectedRole!,
        patientId,
        metadata,
        excelData,
        answers,
        result.normalizedScore,
        modelScore ? Math.round(modelScore) : null,
        Math.round(fusedScore)
      );
    }

    // Always show results page after questionnaire completion
    setAppState('results');
  };

  const handleStartNewAssessment = () => {
    // Allow user to retake assessment from dashboard
    if (selectedRole === 'clinician') {
      setAppState('report-lookup');
    } else {
      setAppState('questionnaire');
    }
  };

  const handleResultsClose = () => {
    // Go to dashboard when user clicks button
    setIsFirstTimeAssessment(false);
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

      {appState === 'report-lookup' && selectedRole === 'clinician' && (
        <ReportLookup
          onReportFound={handleReportFound}
        />
      )}


      {appState === 'questionnaire' && selectedRole && (
        <Questionnaire
          role={selectedRole}
          questions={selectedRole === 'individual' ? individualQuestions : parentQuestions}
          onComplete={handleQuestionnaireComplete}
          onBack={() => selectedRole === 'clinician' ? setAppState('report-lookup') : setAppState('patient-id')}
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
          userName={user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'}
          onStartAssessment={handleStartNewAssessment}
          patientName={selectedRole === 'clinician' ? parentMetadata?.childName : undefined}
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