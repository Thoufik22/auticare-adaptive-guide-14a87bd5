import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AssessmentRecord } from '@/hooks/useAssessmentHistory';
import { format } from 'date-fns';

interface AssessmentChartProps {
  history: AssessmentRecord[];
}

export default function AssessmentChart({ history }: AssessmentChartProps) {
  const chartData = history
    .slice()
    .reverse()
    .map((record) => ({
      date: format(new Date(record.created_at), 'MMM dd'),
      'Questionnaire Score': record.questionnaire_score,
      'ML Prediction': record.ml_score || 0,
      'Fused Score': record.fused_score,
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assessment History Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              className="text-xs"
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis 
              domain={[0, 100]}
              className="text-xs"
              stroke="hsl(var(--muted-foreground))"
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="Questionnaire Score" 
              stroke="hsl(var(--bright-blue))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--bright-blue))' }}
            />
            <Line 
              type="monotone" 
              dataKey="ML Prediction" 
              stroke="hsl(var(--lavender))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--lavender))' }}
            />
            <Line 
              type="monotone" 
              dataKey="Fused Score" 
              stroke="hsl(var(--coral))" 
              strokeWidth={3}
              dot={{ fill: 'hsl(var(--coral))', r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
