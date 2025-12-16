import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, AlertCircle, Download, Gamepad2, Home, ArrowRight, Users } from 'lucide-react';
import { ScoringResult } from '@/utils/scoring';
import VideoPreview from './VideoPreview';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import jsPDF from 'jspdf';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ResultModalProps {
  result: ScoringResult;
  onClose: () => void;
  onBackToHome?: () => void;
  videoUrl?: string;
}

// Question text mappings for better display
const questionTextMap: Record<string, { text: string; commonResponse: string }> = {
  'ind_1': { text: 'Difficulty making eye contact during conversations', commonResponse: '60% report sometimes, 25% rarely' },
  'ind_2': { text: 'Preference for familiar routines', commonResponse: '45% report often, 30% sometimes' },
  'ind_3': { text: 'Trouble understanding jokes or sarcasm', commonResponse: '50% report sometimes, 20% often' },
  'ind_4': { text: 'Sensitivity to sounds, lights, or textures', commonResponse: '55% report sometimes, 25% often' },
  'ind_5': { text: 'Difficulty starting or maintaining conversations', commonResponse: '40% report sometimes, 35% rarely' },
  'ind_6': { text: 'Intense focus on specific interests', commonResponse: '70% report often, 20% always' },
  'ind_7': { text: 'Struggle understanding emotions from facial expressions', commonResponse: '35% report sometimes, 25% rarely' },
  'ind_8': { text: 'Preference for solo activities', commonResponse: '45% report sometimes, 30% often' },
  'ind_9': { text: 'Repetitive movements (hand-flapping, rocking)', commonResponse: '25% report sometimes, 50% rarely' },
  'ind_10': { text: 'Difficulty adapting to new social situations', commonResponse: '50% report sometimes, 25% often' },
  'ind_11': { text: 'Trouble joining group conversations', commonResponse: '45% report sometimes, 20% often' },
  'ind_12': { text: 'Need for specific organization', commonResponse: '55% report often, 25% sometimes' },
  'ind_13': { text: 'Social exhaustion from prolonged interactions', commonResponse: '60% report often, 25% sometimes' },
  'ind_14': { text: 'Taking things literally, missing implied meanings', commonResponse: '40% report sometimes, 30% often' },
  'ind_15': { text: 'Delayed speech or communication development', commonResponse: '30% report sometimes, 45% rarely' },
  'par_1': { text: 'Child avoids eye contact', commonResponse: '50% report sometimes, 25% often' },
  'par_2': { text: 'Child upset by routine changes', commonResponse: '55% report often, 30% sometimes' },
  'par_3': { text: 'Child has difficulty understanding social cues', commonResponse: '45% report sometimes, 30% often' },
  'par_4': { text: 'Child oversensitive to sensory input', commonResponse: '50% report sometimes, 25% often' },
  'par_5': { text: 'Child rarely initiates conversations', commonResponse: '40% report sometimes, 25% often' },
  'par_6': { text: 'Child has intense focused interests', commonResponse: '65% report often, 25% always' },
  'par_7': { text: 'Child struggles to make/keep friends', commonResponse: '45% report sometimes, 30% often' },
  'par_8': { text: 'Child engages in repetitive behaviors', commonResponse: '35% report sometimes, 40% rarely' },
  'par_9': { text: 'Child has difficulty understanding emotions', commonResponse: '40% report sometimes, 25% often' },
  'par_10': { text: 'Child prefers playing alone', commonResponse: '50% report sometimes, 30% often' },
  'par_11': { text: 'Child has trouble adapting to new environments', commonResponse: '55% report often, 25% sometimes' },
  'par_12': { text: 'Child rarely shares interests/achievements', commonResponse: '35% report sometimes, 30% rarely' },
  'par_13': { text: 'Child insists on sameness', commonResponse: '50% report often, 30% sometimes' },
  'par_14': { text: 'Child has difficulty with imaginative play', commonResponse: '40% report sometimes, 35% rarely' },
  'par_15': { text: 'Child makes unusual vocalizations', commonResponse: '30% report sometimes, 45% rarely' },
  'par_16': { text: 'Child had developmental delays', commonResponse: '35% report sometimes, 40% rarely' },
  'par_17': { text: 'Child has difficulty taking turns', commonResponse: '45% report sometimes, 25% often' },
  'par_18': { text: 'Child shows little interest in others', commonResponse: '35% report sometimes, 30% rarely' },
  'par_19': { text: 'Child has unusual sensory reactions', commonResponse: '45% report sometimes, 30% often' },
  'par_20': { text: 'Family history of autism', commonResponse: '20% report yes, 80% report no' },
};

export default function ResultModal({ result, onClose, onBackToHome, videoUrl }: ResultModalProps) {
  const severityColors: Record<string, string> = {
    low: 'bg-mint text-mint-foreground',
    mild: 'bg-bright-blue text-white',
    moderate: 'bg-lavender text-lavender-foreground',
    high: 'bg-coral text-white',
  };

  const severityBorderColors: Record<string, string> = {
    low: 'border-mint',
    mild: 'border-bright-blue',
    moderate: 'border-lavender',
    high: 'border-coral',
  };

  const finalScore = result.fusedScore || result.normalizedScore;
  const isHighScore = finalScore >= 60;

  // Chart data for score comparison
  const scoreComparisonData = [
    { 
      name: 'Questionnaire', 
      score: result.normalizedScore, 
      fill: 'hsl(var(--bright-blue))' 
    },
    ...(result.videoPrediction ? [{ 
      name: 'Video Analysis', 
      score: result.videoPrediction.prediction_score, 
      fill: 'hsl(var(--lavender))' 
    }] : []),
    ...(result.fusedScore ? [{ 
      name: 'Final (Fused)', 
      score: result.fusedScore, 
      fill: 'hsl(var(--primary))' 
    }] : []),
  ];

  // Severity ranges data
  const severityRangesData = [
    { name: 'Very Low', range: '0-24', value: 25, fill: 'hsl(var(--mint))', active: finalScore < 25 },
    { name: 'Low', range: '25-39', value: 15, fill: 'hsl(var(--bright-blue))', active: finalScore >= 25 && finalScore < 40 },
    { name: 'Moderate', range: '40-59', value: 20, fill: 'hsl(var(--lavender))', active: finalScore >= 40 && finalScore < 60 },
    { name: 'High', range: '60-74', value: 15, fill: 'hsl(var(--coral))', active: finalScore >= 60 && finalScore < 75 },
    { name: 'Very High', range: '75-100', value: 25, fill: 'hsl(var(--destructive))', active: finalScore >= 75 },
  ];

  const getContributorDetails = (questionId: string) => {
    return questionTextMap[questionId] || { 
      text: questionId, 
      commonResponse: 'Data not available' 
    };
  };

  const getRecommendations = () => {
    if (finalScore < 25) {
      return [
        'Continue monitoring development and behaviors regularly',
        'Maintain supportive environment and consistent routines',
        'Celebrate strengths and provide positive reinforcement',
      ];
    } else if (finalScore < 40) {
      return [
        'Schedule a screening with a healthcare provider',
        'Document specific behaviors, patterns, and contexts',
        'Explore supportive resources and early intervention',
        'Maintain open communication with caregivers and educators',
      ];
    } else if (finalScore < 60) {
      return [
        'Schedule a comprehensive evaluation with a specialist',
        'Consider early intervention services and therapies',
        'Connect with support groups and community resources',
        'Develop individualized support strategies',
      ];
    } else if (finalScore < 75) {
      return [
        'IMPORTANT: Seek clinical assessment as soon as possible',
        'Contact your healthcare provider immediately',
        'Consider connecting with an autism specialist',
        'Explore comprehensive intervention programs',
        'Join support networks for families',
      ];
    } else {
      return [
        'URGENT: Schedule immediate clinical assessment',
        'Contact specialized autism diagnostic centers',
        'Begin comprehensive intervention planning',
        'Establish regular checkup schedule with specialists',
        'Access intensive support services',
      ];
    }
  };

  const handleDownloadReport = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPos = 20;

    // Title
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('ASD Assessment Report', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Overall Score Section
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Overall Assessment Score', pageWidth / 2, yPos, { align: 'center' });
    yPos += 12;
    doc.setFontSize(32);
    doc.text(`${finalScore.toFixed(1)}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
    doc.setFontSize(14);
    doc.text(`Severity: ${result.severityLabel}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Score Breakdown
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Score Breakdown:', margin, yPos);
    yPos += 8;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`• Questionnaire Score: ${result.normalizedScore}`, margin, yPos);
    yPos += 6;
    if (result.videoPrediction) {
      doc.text(`• Video Analysis Score: ${result.videoPrediction.prediction_score.toFixed(1)}`, margin, yPos);
      yPos += 6;
      doc.text(`• Model Confidence: ${((result.videoPrediction.confidence || 0.7) * 100).toFixed(0)}%`, margin, yPos);
      yPos += 6;
    }
    if (result.fusedScore) {
      doc.text(`• Final Fused Score: ${result.fusedScore.toFixed(1)}`, margin, yPos);
      yPos += 6;
    }
    yPos += 8;

    // Severity Ranges Reference
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Severity Ranges Reference:', margin, yPos);
    yPos += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const severityInfo = [
      '• Very Low (0-24): Normal range - continue monitoring',
      '• Low (25-39): Clinical assessment requested',
      '• Moderate (40-59): Clinical assessment required',
      '• High (60-74): Clinical assessment mandatory',
      '• Very High (75-100): Regular specialist checkups needed',
    ];
    severityInfo.forEach(text => {
      doc.text(text, margin, yPos);
      yPos += 5;
    });
    yPos += 8;

    // Top Contributing Factors
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Top Contributing Factors:', margin, yPos);
    yPos += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    result.topContributors.forEach((contributor, index) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      const details = getContributorDetails(contributor.question);
      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}. ${details.text}`, margin, yPos);
      yPos += 5;
      doc.setFont('helvetica', 'normal');
      doc.text(`   Contribution Score: ${contributor.contribution.toFixed(1)}`, margin, yPos);
      yPos += 5;
      doc.text(`   Common Response: ${details.commonResponse}`, margin, yPos);
      yPos += 5;
      doc.text(`   Suggested Action: ${contributor.action}`, margin, yPos);
      yPos += 8;
    });

    // Recommendations
    if (yPos > 200) {
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

    const recommendations = getRecommendations();
    recommendations.forEach(text => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      const lines = doc.splitTextToSize(`• ${text}`, pageWidth - 2 * margin);
      doc.text(lines, margin, yPos);
      yPos += lines.length * 5 + 2;
    });

    // Disclaimer
    yPos = doc.internal.pageSize.getHeight() - 20;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('This report is for informational purposes only and should not replace professional medical advice.', 
      pageWidth / 2, yPos, { align: 'center' });
    yPos += 4;
    doc.text('Please consult with a qualified healthcare professional for proper diagnosis and treatment.', 
      pageWidth / 2, yPos, { align: 'center' });

    doc.save(`ASD_Assessment_Report_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-hidden">
      <ScrollArea className="h-full w-full">
        <div className="min-h-screen py-6 px-4">
          <div className="max-w-5xl mx-auto space-y-6">
            
            {/* Header with Overall Score */}
            <Card className={`border-4 ${severityBorderColors[result.severity] || 'border-primary'}`}>
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-3xl font-bold mb-4">Assessment Results</CardTitle>
                <div className="flex flex-col items-center gap-4">
                  <div className={`w-40 h-40 rounded-full ${severityColors[result.severity] || 'bg-primary'} flex flex-col items-center justify-center shadow-lg`}>
                    <span className="text-6xl font-bold">{finalScore.toFixed(0)}</span>
                    <span className="text-sm opacity-90">out of 100</span>
                  </div>
                  <Badge className={`${severityColors[result.severity] || 'bg-primary'} text-lg px-6 py-2`}>
                    {result.severityLabel}
                  </Badge>
                </div>
              </CardHeader>
            </Card>

            {/* Video Preview if available */}
            {videoUrl && (
              <Card>
                <CardContent className="p-4">
                  <VideoPreview videoUrl={videoUrl} className="max-w-md mx-auto" />
                </CardContent>
              </Card>
            )}

            {/* Charts Section - Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Score Comparison Bar Chart */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Score Comparison
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      score: { label: 'Score', color: 'hsl(var(--primary))' },
                    }}
                    className="h-[220px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={scoreComparisonData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis domain={[0, 100]} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                          {scoreComparisonData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Severity Ranges Chart */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Severity Ranges
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      value: { label: 'Range', color: 'hsl(var(--primary))' },
                    }}
                    className="h-[220px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={severityRangesData} layout="vertical" margin={{ top: 10, right: 20, bottom: 10, left: 60 }}>
                        <XAxis type="number" domain={[0, 100]} hide />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={60} />
                        <ChartTooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-popover p-2 rounded shadow border text-sm">
                                  <p className="font-semibold">{data.name}</p>
                                  <p>Range: {data.range}</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                          {severityRangesData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.fill} 
                              opacity={entry.active ? 1 : 0.3}
                              stroke={entry.active ? 'hsl(var(--foreground))' : 'transparent'}
                              strokeWidth={entry.active ? 2 : 0}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    Your score falls in the <span className="font-semibold">{severityRangesData.find(s => s.active)?.name}</span> range
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Top Contributing Factors */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-xl flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Top Contributing Factors
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  These responses had the highest influence on your assessment score
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.topContributors.map((contributor, index) => {
                  const details = getContributorDetails(contributor.question);
                  return (
                    <div key={index} className="border rounded-lg p-4 bg-muted/30">
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full ${severityColors[result.severity] || 'bg-primary'} flex items-center justify-center flex-shrink-0`}>
                          <span className="font-bold text-sm">{index + 1}</span>
                        </div>
                        <div className="flex-1 space-y-2">
                          <p className="font-semibold">{details.text}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <span className="font-medium">Impact Score:</span>
                              <span className="font-bold text-foreground">{contributor.contribution.toFixed(1)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Users className="w-4 h-4" />
                              <span className="text-xs">{details.commonResponse}</span>
                            </div>
                          </div>
                          <div className="bg-background/50 rounded p-2 text-sm">
                            <span className="font-medium text-primary">Suggested Action: </span>
                            <span>{contributor.action}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Recommendations Section */}
            <Card className="bg-accent/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Recommended Next Steps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {getRecommendations().map((rec, index) => (
                    <li key={index} className={`flex items-start gap-2 ${rec.includes('URGENT') || rec.includes('IMPORTANT') ? 'text-destructive font-semibold' : ''}`}>
                      <ArrowRight className="w-4 h-4 mt-1 flex-shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={handleDownloadReport}
                    variant="outline"
                    className="flex-1 py-5 text-base font-semibold"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Download Report
                  </Button>
                  {isHighScore && (
                    <Button
                      onClick={onClose}
                      className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground py-5 text-base font-semibold"
                    >
                      <Gamepad2 className="w-5 h-5 mr-2" />
                      Try Gamification
                    </Button>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-3 mt-3">
                  <Button
                    onClick={onClose}
                    className={`flex-1 ${severityColors[result.severity] || 'bg-primary'} py-5 text-base font-semibold`}
                  >
                    Go to Dashboard
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                  {onBackToHome && (
                    <Button
                      onClick={onBackToHome}
                      variant="outline"
                      className="flex-1 py-5 text-base font-semibold"
                    >
                      <Home className="w-5 h-5 mr-2" />
                      Back to Home
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Footer Disclaimer */}
            <p className="text-center text-xs text-muted-foreground pb-6">
              This assessment is for informational purposes only. Please consult a healthcare professional for diagnosis.
            </p>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
