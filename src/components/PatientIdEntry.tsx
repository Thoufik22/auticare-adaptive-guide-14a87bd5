import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { generatePatientId } from '@/hooks/useUserAssessmentData';
import { RefreshCw, User, UserCheck } from 'lucide-react';

interface PatientIdEntryProps {
  role: 'individual' | 'parent' | 'clinician';
  existingPatientId?: string;
  onConfirm: (patientId: string) => void;
  onBack: () => void;
}

export default function PatientIdEntry({ role, existingPatientId, onConfirm, onBack }: PatientIdEntryProps) {
  const [patientId, setPatientId] = useState(existingPatientId || '');
  const [isNew, setIsNew] = useState(!existingPatientId);

  const handleGenerateId = () => {
    const newId = generatePatientId(role);
    setPatientId(newId);
  };

  const roleLabels = {
    individual: { title: 'Self-Assessment ID', desc: 'Your unique identifier for tracking your assessments' },
    parent: { title: 'Child ID', desc: 'A unique identifier for your child\'s assessment records' },
    clinician: { title: 'Patient Admission ID', desc: 'Enter or generate a patient admission ID' }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full animate-fade-in">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {existingPatientId ? (
              <UserCheck className="w-12 h-12 text-green-500" />
            ) : (
              <User className="w-12 h-12 text-primary" />
            )}
          </div>
          <CardTitle className="text-2xl">{roleLabels[role].title}</CardTitle>
          <CardDescription>{roleLabels[role].desc}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {existingPatientId && (
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">Your saved ID</p>
              <Badge variant="secondary" className="text-lg px-4 py-2">
                {existingPatientId}
              </Badge>
              <p className="text-xs text-muted-foreground mt-2">
                This ID is permanently linked to your account
              </p>
            </div>
          )}

          {!existingPatientId && (
            <>
              <div className="space-y-2">
                <Label htmlFor="patientId">
                  {role === 'clinician' ? 'Patient ID' : role === 'parent' ? 'Child ID' : 'Your ID'}
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="patientId"
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value.toUpperCase())}
                    placeholder={`Enter or generate ${role === 'clinician' ? 'patient' : role === 'parent' ? 'child' : 'your'} ID`}
                    className="font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGenerateId}
                    title="Generate new ID"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  ⚠️ <strong>Important:</strong> This ID will be permanently linked to your account. 
                  One email can only have one {role === 'clinician' ? 'patient' : role === 'parent' ? 'child' : 'assessment'} ID.
                </p>
              </div>
            </>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={onBack} className="flex-1">
              Back
            </Button>
            <Button 
              onClick={() => onConfirm(existingPatientId || patientId)} 
              className="flex-1"
              disabled={!existingPatientId && !patientId.trim()}
            >
              {existingPatientId ? 'Continue' : 'Confirm ID'}
            </Button>
          </div>

          {existingPatientId && (
            <p className="text-xs text-center text-muted-foreground">
              To use a different ID, please log out and register with a new email.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
