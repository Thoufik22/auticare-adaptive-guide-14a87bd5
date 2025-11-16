import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, AlertCircle, Download, Gamepad2 } from 'lucide-react';
import { ScoringResult } from '@/utils/scoring';
import VideoPreview from './VideoPreview';
import ASDScoreChart from './ASDScoreChart';
import jsPDF from 'jspdf';

interface ResultModalProps {
  result: ScoringResult;
  onClose: () => void;
  onBackToHome?: () => void;
  videoUrl?: string;
}

export default function ResultModal({ result, onClose, onBackToHome, videoUrl }: ResultModalProps) {
  const severityColors = {
    low: 'bg-mint text-mint-foreground',
    mild: 'bg-bright-blue text-bright-blue-foreground',
    moderate: 'bg-lavender text-lavender-foreground',
    high: 'bg-coral text-coral-foreground',
  };

  const severityBorderColors = {
    low: 'border-mint',
    mild: 'border-bright-blue',
    moderate: 'border-lavender',
    high: 'border-coral',
  };

  const finalScore = result.fusedScore || result.normalizedScore;
  const isHighScore = finalScore >= 60;

  const handleDownloadReport = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPos = 20;

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('ASD Assessment Report', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Score Section
    doc.setFontSize(16);
    doc.text(`Final Score: ${finalScore}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
    doc.setFontSize(12);
    doc.text(`Severity: ${result.severityLabel}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Score Interpretation
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Score Interpretation:', margin, yPos);
    yPos += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const interpretations = [
      '• Score < 25: Very Low ASD Behavior (Normal Range)',
      '• Score 25-40: Low ASD Indicators - Clinical Assessment Requested',
      '• Score 40-60: Moderate ASD Indicators - Clinical Assessment Required',
      '• Score 60-75: High ASD Indicators - Clinical Assessment Mandatory',
      '• Score > 75: Very High ASD Indicators - Regular Checkup Needed',
    ];
    
    interpretations.forEach(text => {
      doc.text(text, margin, yPos);
      yPos += 6;
    });
    yPos += 5;

    // Statistics
    if (result.fusedScore) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Score Statistics:', margin, yPos);
      yPos += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Questionnaire Score: ${result.normalizedScore}`, margin, yPos);
      yPos += 6;
      if (result.videoPrediction) {
        doc.text(`ML Analysis Score: ${result.videoPrediction.prediction_score.toFixed(1)}`, margin, yPos);
        yPos += 6;
        doc.text(`Model Confidence: ${((result.videoPrediction.confidence || 0.7) * 100).toFixed(0)}%`, margin, yPos);
        yPos += 6;
      }
      yPos += 5;
    }

    // Top Contributors
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Top Contributing Factors:', margin, yPos);
    yPos += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    result.topContributors.forEach((contributor, index) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}. ${contributor.question}`, margin, yPos);
      yPos += 6;
      doc.setFont('helvetica', 'normal');
      const actionLines = doc.splitTextToSize(`Action: ${contributor.action}`, pageWidth - 2 * margin);
      doc.text(actionLines, margin + 5, yPos);
      yPos += actionLines.length * 5 + 3;
    });

    // Recommendations
    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
    }
    yPos += 5;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Recommended Next Steps:', margin, yPos);
    yPos += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    let recommendations: string[] = [];
    if (finalScore < 25) {
      recommendations = [
        '• Continue monitoring development and behaviors regularly',
        '• Maintain supportive environment and consistent routines',
        '• Celebrate strengths and provide positive reinforcement',
      ];
    } else if (finalScore < 40) {
      recommendations = [
        '• Schedule a screening with a healthcare provider for evaluation',
        '• Document specific behaviors, patterns, and contexts',
        '• Explore supportive resources and early intervention strategies',
        '• Maintain open communication with caregivers and educators',
      ];
    } else if (finalScore < 60) {
      recommendations = [
        '• Schedule a comprehensive evaluation with a developmental specialist',
        '• Consider early intervention services and therapies',
        '• Connect with support groups and community resources',
        '• Develop individualized support strategies',
      ];
    } else if (finalScore < 75) {
      recommendations = [
        '• IMPORTANT: Seek clinical assessment as soon as possible',
        '• Contact your healthcare provider or pediatrician immediately',
        '• Consider connecting with an autism specialist or clinic',
        '• Explore comprehensive intervention programs',
        '• Join support networks for families and caregivers',
      ];
    } else {
      recommendations = [
        '• URGENT: Schedule immediate clinical assessment',
        '• Contact specialized autism diagnostic centers',
        '• Begin comprehensive intervention planning',
        '• Establish regular checkup schedule with specialists',
        '• Access intensive support services and resources',
        '• Connect with experienced support communities',
      ];
    }

    recommendations.forEach(text => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      const lines = doc.splitTextToSize(text, pageWidth - 2 * margin);
      doc.text(lines, margin, yPos);
      yPos += lines.length * 5 + 2;
    });

    // Footer
    yPos = doc.internal.pageSize.getHeight() - 15;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('This report is generated for informational purposes only and should not replace professional medical advice.', 
      pageWidth / 2, yPos, { align: 'center' });

    doc.save(`ASD_Assessment_Report_${new Date().toLocaleDateString()}.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
      <div className="w-full max-w-4xl my-8">
        <Card className={`w-full animate-scale-in border-4 ${severityBorderColors[result.severity]}`}>
          <CardHeader className="relative pb-2">
            <div className="text-center space-y-6">
              <CardTitle className="text-4xl font-bold">Assessment Results</CardTitle>
              
              <div className="flex justify-center py-6">
                <div className={`inline-flex flex-col items-center justify-center w-48 h-48 rounded-full ${severityColors[result.severity]} shadow-xl animate-scale-in`}>
                  <span className="text-7xl font-bold mb-2">{finalScore.toFixed(1)}</span>
                  <Badge className={`${severityColors[result.severity]} text-lg px-6 py-2 border-2 border-background`}>
                    {result.severityLabel}
                  </Badge>
                </div>
              </div>

              {result.fusedScore && (
                <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                  <p className="text-sm font-semibold mb-2">🤖 ML-Enhanced Score (Fused Analysis)</p>
                  <div className="flex justify-center gap-6 text-sm">
                    <div className="text-center">
                      <p className="text-muted-foreground">Questionnaire</p>
                      <p className="text-2xl font-bold">{result.normalizedScore}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground">ML Model</p>
                      <p className="text-2xl font-bold">{result.videoPrediction?.prediction_score.toFixed(1)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardHeader>

        <CardContent className="space-y-6">
          {videoUrl && (
            <VideoPreview videoUrl={videoUrl} className="mb-4" />
          )}

          <ASDScoreChart 
            normalizedScore={result.normalizedScore}
            mlScore={result.videoPrediction?.prediction_score}
            fusedScore={result.fusedScore}
          />

          {result.videoPrediction && (
            <div className="space-y-3 bg-primary/10 p-4 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  🎥
                </div>
                <h3 className="font-semibold">Video Analysis Results</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <p className="text-muted-foreground">ML Prediction Score</p>
                  <p className="text-2xl font-bold">{result.videoPrediction.prediction_score.toFixed(1)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Model Confidence</p>
                  <p className="text-2xl font-bold">{((result.videoPrediction.confidence || 0.7) * 100).toFixed(0)}%</p>
                </div>
              </div>
              {result.videoPrediction.features_detected && (
                <div className="pt-2 border-t border-primary/20">
                  <p className="text-xs text-muted-foreground mb-2">Detected Features:</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {Object.entries(result.videoPrediction.features_detected).map(([key, value]) => (
                      <div key={key} className="space-y-1">
                        <p className="capitalize">{key.replace(/_/g, ' ')}</p>
                        <p className="font-semibold">{(value as number).toFixed(1)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-xs text-muted-foreground italic">
                * The final score combines questionnaire responses (60%) with ML video analysis (40%)
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-muted-foreground" />
              <h3 className="text-xl font-semibold">Top Contributing Factors</h3>
            </div>
            
            {result.topContributors.map((contributor, index) => (
              <Card key={index} className="p-4 bg-muted/50">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full ${severityColors[result.severity]} flex items-center justify-center flex-shrink-0`}>
                    <span className="font-bold">{index + 1}</span>
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="font-medium">{contributor.question}</p>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-semibold">Suggested action:</span> {contributor.action}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="space-y-3 bg-accent/20 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <h3 className="font-semibold">Score Interpretation & Recommended Next Steps</h3>
            </div>
            
            <div className="bg-background/50 p-3 rounded-md space-y-2 text-sm">
              <p className="font-semibold">Understanding Your Score:</p>
              <ul className="space-y-1 text-xs">
                <li>• <span className="font-semibold">Score &lt; 25:</span> Very Low ASD Behavior (Normal Range)</li>
                <li>• <span className="font-semibold">Score 25-40:</span> Low ASD Indicators - Clinical Assessment Requested</li>
                <li>• <span className="font-semibold">Score 40-60:</span> Moderate ASD Indicators - Clinical Assessment Required</li>
                <li>• <span className="font-semibold">Score 60-75:</span> High ASD Indicators - Clinical Assessment Mandatory</li>
                <li>• <span className="font-semibold">Score &gt; 75:</span> Very High ASD Indicators - Regular Checkup Needed</li>
              </ul>
            </div>

            {finalScore < 25 && (
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Continue monitoring development and behaviors regularly</li>
                <li>Maintain supportive environment and consistent routines</li>
                <li>Celebrate strengths and provide positive reinforcement</li>
              </ul>
            )}
            
            {finalScore >= 25 && finalScore < 40 && (
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Schedule a screening with a healthcare provider for evaluation</li>
                <li>Document specific behaviors, patterns, and contexts</li>
                <li>Explore supportive resources and early intervention strategies</li>
                <li>Maintain open communication with caregivers and educators</li>
              </ul>
            )}
            
            {finalScore >= 40 && finalScore < 60 && (
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Schedule a comprehensive evaluation with a developmental specialist</li>
                <li>Consider early intervention services and therapies</li>
                <li>Connect with support groups and community resources</li>
                <li>Develop individualized support strategies</li>
              </ul>
            )}
            
            {finalScore >= 60 && finalScore < 75 && (
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li className="font-semibold text-coral">IMPORTANT: Seek clinical assessment as soon as possible</li>
                <li>Contact your healthcare provider or pediatrician immediately</li>
                <li>Consider connecting with an autism specialist or clinic</li>
                <li>Explore comprehensive intervention programs</li>
                <li>Join support networks for families and caregivers</li>
              </ul>
            )}

            {finalScore >= 75 && (
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li className="font-semibold text-destructive">URGENT: Schedule immediate clinical assessment</li>
                <li>Contact specialized autism diagnostic centers</li>
                <li>Begin comprehensive intervention planning</li>
                <li>Establish regular checkup schedule with specialists</li>
                <li>Access intensive support services and resources</li>
                <li>Connect with experienced support communities</li>
              </ul>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex gap-3">
              <Button
                onClick={handleDownloadReport}
                variant="outline"
                className="flex-1 text-lg py-6 font-semibold"
                size="lg"
              >
                <Download className="w-5 h-5 mr-2" />
                Download Report
              </Button>
              {isHighScore && (
                <Button
                  onClick={onClose}
                  className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground text-lg py-6 font-semibold"
                  size="lg"
                >
                  <Gamepad2 className="w-5 h-5 mr-2" />
                  Try Gamification
                </Button>
              )}
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={onClose}
                className={`flex-1 ${severityColors[result.severity]} text-lg py-6 font-semibold`}
                size="lg"
              >
                Go to Dashboard
              </Button>
              {onBackToHome && (
                <Button
                  onClick={onBackToHome}
                  variant="outline"
                  className="flex-1 text-lg py-6 font-semibold"
                  size="lg"
                >
                  Back to Home
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
