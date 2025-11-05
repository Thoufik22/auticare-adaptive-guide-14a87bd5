import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, 
  Heart, 
  Download, 
  Phone, 
  Clock,
  CheckCircle2,
  Circle,
  Smile,
  Meh,
  Frown,
} from 'lucide-react';
import { ScoringResult, getScheduleComplexity } from '@/utils/scoring';
import { ParentMetadata } from '@/data/questionBanks';
import jsPDF from 'jspdf';

interface DashboardProps {
  role: 'individual' | 'parent' | 'clinician';
  result: ScoringResult;
  metadata?: ParentMetadata;
  onNavigateToCalmZone: () => void;
}

export default function Dashboard({ role, result, metadata, onNavigateToCalmZone }: DashboardProps) {
  const schedule = getScheduleComplexity(result.severity);
  
  const severityColors = {
    low: 'mint',
    mild: 'bright-blue',
    moderate: 'lavender',
    high: 'coral',
  };

  const accentColor = severityColors[result.severity];

  const tasks = generateTasks(result.severity, schedule.taskCount);

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('AutiCare Assessment Summary', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Assessment Score: ${result.normalizedScore}`, 20, 40);
    doc.text(`Severity Level: ${result.severityLabel}`, 20, 50);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 60);
    
    doc.text('Top Contributing Factors:', 20, 80);
    result.topContributors.forEach((contrib, index) => {
      doc.text(`${index + 1}. ${contrib.question}`, 20, 90 + (index * 10));
    });
    
    doc.text('Recommended Next Steps:', 20, 130);
    const recommendations = getRecommendations(result.severity);
    recommendations.forEach((rec, index) => {
      doc.text(`- ${rec}`, 20, 140 + (index * 10));
    });
    
    if (metadata) {
      doc.text(`Child Name: ${metadata.childName}`, 20, 180);
      doc.text(`Age: ${metadata.childAge}`, 20, 190);
    }
    
    doc.text(`Consent timestamp: ${new Date().toISOString()}`, 20, 210);
    
    doc.save('auticare-assessment-summary.pdf');
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              {role === 'individual' && 'My Dashboard'}
              {role === 'parent' && `${metadata?.childName}'s Dashboard`}
              {role === 'clinician' && 'Clinical Dashboard'}
            </h1>
            <p className="text-muted-foreground">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleDownloadPDF}>
              <Download className="w-4 h-4 mr-2" />
              Download Summary
            </Button>
            {result.severity === 'high' && (
              <Button className="bg-coral hover:bg-coral/90">
                <Phone className="w-4 h-4 mr-2" />
                Contact Clinician
              </Button>
            )}
          </div>
        </div>

        {/* Score Summary Card */}
        <Card className={`border-2 border-${accentColor}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Current Assessment</CardTitle>
                <CardDescription>Based on your recent evaluation</CardDescription>
              </div>
              <div className={`text-5xl font-bold text-${accentColor}`}>
                {result.normalizedScore}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Badge className={`bg-${accentColor} text-${accentColor}-foreground text-lg px-4 py-2`}>
              {result.severityLabel}
            </Badge>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Today's Schedule */}
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Today's Schedule
                  </CardTitle>
                  <CardDescription>
                    {schedule.description}
                  </CardDescription>
                </div>
                <Badge variant="outline">
                  {schedule.level} Complexity
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {tasks.map((task, index) => (
                <Card key={index} className={`p-4 border-l-4 border-l-${accentColor}`}>
                  <div className="flex items-start gap-3">
                    {task.completed ? (
                      <CheckCircle2 className={`w-5 h-5 text-${accentColor} flex-shrink-0`} />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold">{task.title}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          {task.duration}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                      {role === 'parent' && task.parentTip && (
                        <p className="text-sm text-primary mt-2">💡 {task.parentTip}</p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5" />
                  Quick Mood Check
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-around">
                  <button className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-accent transition-colors">
                    <Smile className="w-8 h-8 text-mint" />
                    <span className="text-xs">Good</span>
                  </button>
                  <button className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-accent transition-colors">
                    <Meh className="w-8 h-8 text-bright-blue" />
                    <span className="text-xs">Okay</span>
                  </button>
                  <button className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-accent transition-colors">
                    <Frown className="w-8 h-8 text-coral" />
                    <span className="text-xs">Tough</span>
                  </button>
                </div>
              </CardContent>
            </Card>

            <Card className={`bg-${accentColor}/10 border-${accentColor}`}>
              <CardHeader>
                <CardTitle>Calm Zone</CardTitle>
                <CardDescription>
                  Take a mindful break
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className={`w-full bg-${accentColor}`}
                  onClick={onNavigateToCalmZone}
                >
                  Enter Calm Zone
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Tasks Completed</span>
                    <span>2/7</span>
                  </div>
                  <Progress value={28} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function generateTasks(severity: ScoringResult['severity'], count: number) {
  const taskPool = [
    {
      title: 'Morning Routine',
      description: 'Complete morning self-care activities',
      duration: '15 min',
      parentTip: 'Use visual schedule cards to help guide each step',
      completed: true,
    },
    {
      title: 'Sensory Break',
      description: 'Take a calming sensory break',
      duration: '10 min',
      parentTip: 'Offer fidget toys or weighted blanket',
      completed: true,
    },
    {
      title: 'Learning Activity',
      description: 'Engage in structured learning',
      duration: severity === 'high' ? '8 min' : '20 min',
      parentTip: 'Break into 2-minute segments with rewards',
      completed: false,
    },
    {
      title: 'Social Interaction',
      description: 'Practice social skills',
      duration: '12 min',
      parentTip: 'Start with one-on-one interaction',
      completed: false,
    },
    {
      title: 'Physical Activity',
      description: 'Movement and exercise',
      duration: '15 min',
      parentTip: 'Allow for breaks and water as needed',
      completed: false,
    },
    {
      title: 'Quiet Time',
      description: 'Independent relaxation period',
      duration: '20 min',
      parentTip: 'Provide calming activities like coloring',
      completed: false,
    },
    {
      title: 'Creative Play',
      description: 'Open-ended creative activity',
      duration: '18 min',
      parentTip: 'Join in and model appropriate play',
      completed: false,
    },
  ];

  return taskPool.slice(0, count);
}

function getRecommendations(severity: ScoringResult['severity']): string[] {
  const recommendations = {
    low: [
      'Continue monitoring development',
      'Maintain supportive routines',
    ],
    mild: [
      'Consider scheduling a screening',
      'Document behaviors and patterns',
      'Explore supportive resources',
    ],
    moderate: [
      'Schedule comprehensive evaluation',
      'Consider early intervention services',
      'Connect with support groups',
    ],
    high: [
      'Seek clinical assessment immediately',
      'Contact healthcare provider',
      'Connect with autism specialist',
      'Explore immediate support resources',
    ],
  };

  return recommendations[severity];
}
