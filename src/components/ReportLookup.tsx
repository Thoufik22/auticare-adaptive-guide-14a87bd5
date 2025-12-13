import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Search, FileText, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AnswerValue } from '@/utils/scoring';

interface PatientReport {
  id: string;
  application_number: string;
  patient_name: string;
  patient_age: string;
  pronoun: string;
  home_language: string;
  problems_faced: string;
  video_url: string | null;
  answers: Record<string, AnswerValue>;
}

interface ReportLookupProps {
  onReportFound: (
    answers: Record<string, AnswerValue>,
    metadata: {
      childName: string;
      childAge: string;
      pronoun: string;
      homeLanguage: string;
      problemsFaced: string;
      videoUrl?: string;
    }
  ) => void;
  onBack: () => void;
  onManualEntry: () => void;
}

export default function ReportLookup({ onReportFound, onBack, onManualEntry }: ReportLookupProps) {
  const [applicationNumber, setApplicationNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundReport, setFoundReport] = useState<PatientReport | null>(null);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!applicationNumber.trim()) {
      toast({
        title: "Enter Application Number",
        description: "Please enter a valid application number to search",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    setFoundReport(null);

    try {
      const { data, error } = await supabase
        .from('patient_reports')
        .select('*')
        .eq('application_number', applicationNumber.trim().toUpperCase())
        .maybeSingle();

      if (error) {
        console.error('Search error:', error);
        toast({
          title: "Search Error",
          description: "Failed to search for report. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (!data) {
        toast({
          title: "Report Not Found",
          description: `No report found with application number: ${applicationNumber}`,
          variant: "destructive",
        });
        return;
      }

      // Parse answers from JSON
      const parsedReport: PatientReport = {
        ...data,
        answers: typeof data.answers === 'string' ? JSON.parse(data.answers) : data.answers,
      };

      setFoundReport(parsedReport);
      toast({
        title: "Report Found!",
        description: `Found report for ${data.patient_name}`,
      });
    } catch (err) {
      console.error('Search error:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleProceed = () => {
    if (!foundReport) return;

    onReportFound(foundReport.answers, {
      childName: foundReport.patient_name,
      childAge: foundReport.patient_age,
      pronoun: foundReport.pronoun,
      homeLanguage: foundReport.home_language,
      problemsFaced: foundReport.problems_faced || '',
      videoUrl: foundReport.video_url || undefined,
    });
  };

  // Available demo application numbers
  const demoNumbers = [
    { id: 'AC-2024-001', name: 'Arjun Kumar', severity: 'High' },
    { id: 'AC-2024-002', name: 'Priya Sharma', severity: 'Moderate' },
    { id: 'AC-2024-003', name: 'Rahul Patel', severity: 'Low' },
    { id: 'AC-2024-004', name: 'Meera Reddy', severity: 'Very High' },
    { id: 'AC-2024-005', name: 'Vikram Singh', severity: 'Mild' },
    { id: 'AC-2024-006', name: 'Ananya Gupta', severity: 'Moderate-High' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full animate-fade-in">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
          
          <CardTitle className="text-2xl flex items-center gap-2">
            <FileText className="w-6 h-6 text-bright-blue" />
            Patient Report Lookup
          </CardTitle>
          <CardDescription>
            Enter the application number to auto-fill all assessment data from existing reports
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Search Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="applicationNumber">Application Number</Label>
              <div className="flex gap-2">
                <Input
                  id="applicationNumber"
                  value={applicationNumber}
                  onChange={(e) => setApplicationNumber(e.target.value.toUpperCase())}
                  placeholder="e.g., AC-2024-001"
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button 
                  onClick={handleSearch} 
                  disabled={isSearching}
                  className="bg-bright-blue hover:bg-bright-blue/90"
                >
                  {isSearching ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Demo Application Numbers */}
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm font-medium mb-3">Available Demo Reports:</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {demoNumbers.map((demo) => (
                  <button
                    key={demo.id}
                    onClick={() => setApplicationNumber(demo.id)}
                    className="text-left p-2 rounded-md bg-background hover:bg-accent transition-colors border text-sm"
                  >
                    <span className="font-mono text-bright-blue">{demo.id}</span>
                    <p className="text-xs text-muted-foreground truncate">{demo.name}</p>
                    <span className="text-xs text-muted-foreground">({demo.severity})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Found Report Preview */}
          {foundReport && (
            <div className="border rounded-lg p-4 bg-fresh-mint/10 border-fresh-mint/30 space-y-3">
              <div className="flex items-center gap-2 text-fresh-mint">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Report Found</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Patient Name</p>
                  <p className="font-medium">{foundReport.patient_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Age</p>
                  <p className="font-medium">{foundReport.patient_age}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Pronoun</p>
                  <p className="font-medium">{foundReport.pronoun}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Language</p>
                  <p className="font-medium">{foundReport.home_language}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Problems Faced</p>
                  <p className="font-medium">{foundReport.problems_faced}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Questions Auto-filled</p>
                  <p className="font-medium">{Object.keys(foundReport.answers).length} answers loaded</p>
                </div>
              </div>

              <Button 
                onClick={handleProceed} 
                className="w-full bg-fresh-mint hover:bg-fresh-mint/90 text-background"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Proceed to Results
              </Button>
            </div>
          )}

          {/* Manual Entry Option */}
          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground text-center mb-3">
              Don't have an application number?
            </p>
            <Button 
              variant="outline" 
              onClick={onManualEntry}
              className="w-full"
            >
              <FileText className="w-4 h-4 mr-2" />
              Manual Assessment Entry
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
