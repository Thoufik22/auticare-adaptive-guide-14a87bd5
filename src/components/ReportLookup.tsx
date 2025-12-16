import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, FileText, Loader2 } from 'lucide-react';
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
}

export default function ReportLookup({ onReportFound }: ReportLookupProps) {
  const [applicationNumber, setApplicationNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
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

      toast({
        title: "Report Found!",
        description: `Processing assessment for ${data.patient_name}...`,
      });

      // Directly proceed to results
      onReportFound(parsedReport.answers, {
        childName: parsedReport.patient_name,
        childAge: parsedReport.patient_age,
        pronoun: parsedReport.pronoun,
        homeLanguage: parsedReport.home_language,
        problemsFaced: parsedReport.problems_faced || '',
        videoUrl: parsedReport.video_url || undefined,
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full animate-fade-in">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <FileText className="w-6 h-6 text-bright-blue" />
            Clinical Assessment
          </CardTitle>
          <CardDescription>
            Enter the patient's application number to retrieve assessment data
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="applicationNumber">Application Number</Label>
            <Input
              id="applicationNumber"
              value={applicationNumber}
              onChange={(e) => setApplicationNumber(e.target.value.toUpperCase())}
              placeholder="Enter application number"
              className="text-center text-lg font-mono"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              disabled={isSearching}
            />
          </div>

          <Button 
            onClick={handleSearch} 
            disabled={isSearching || !applicationNumber.trim()}
            className="w-full bg-bright-blue hover:bg-bright-blue/90"
            size="lg"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Retrieving Assessment...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Retrieve Assessment
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
