import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, TrendingUp, AlertCircle } from 'lucide-react';
import { ScoringResult } from '@/utils/scoring';

interface ResultModalProps {
  result: ScoringResult;
  onClose: () => void;
}

export default function ResultModal({ result, onClose }: ResultModalProps) {
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <Card className={`max-w-2xl w-full animate-scale-in border-4 ${severityBorderColors[result.severity]}`}>
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>

          <div className="text-center space-y-4">
            <CardTitle className="text-3xl">Assessment Complete</CardTitle>
            
            <div className="py-8">
              <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full ${severityColors[result.severity]} mb-4`}>
                <span className="text-5xl font-bold">{result.fusedScore || result.normalizedScore}</span>
              </div>
              
              <Badge className={`${severityColors[result.severity]} text-lg px-6 py-2`}>
                {result.severityLabel}
              </Badge>

              {result.fusedScore && (
                <div className="mt-4 text-sm text-muted-foreground space-y-1">
                  <p>🤖 ML-Enhanced Score (Fused Analysis)</p>
                  <div className="flex justify-center gap-4 text-xs">
                    <span>Questionnaire: {result.normalizedScore}</span>
                    <span>ML Model: {result.videoPrediction?.prediction_score.toFixed(1)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
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
              <h3 className="font-semibold">Recommended Next Steps</h3>
            </div>
            
            {result.severity === 'low' && (
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Continue monitoring development and behaviors</li>
                <li>Maintain supportive environment and routines</li>
              </ul>
            )}
            
            {result.severity === 'mild' && (
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Consider scheduling a screening with a healthcare provider</li>
                <li>Document specific behaviors and patterns</li>
                <li>Explore supportive resources and strategies</li>
              </ul>
            )}
            
            {result.severity === 'moderate' && (
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Schedule a comprehensive evaluation with a specialist</li>
                <li>Consider early intervention services</li>
                <li>Connect with support groups and resources</li>
              </ul>
            )}
            
            {result.severity === 'high' && (
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li className="font-semibold text-coral">Seek clinical assessment as soon as possible</li>
                <li>Contact your healthcare provider or pediatrician</li>
                <li>Consider connecting with an autism specialist</li>
                <li>Explore immediate support resources</li>
              </ul>
            )}
          </div>

          <Button
            onClick={onClose}
            className={`w-full ${severityColors[result.severity]} text-lg py-6`}
            size="lg"
          >
            Continue to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
