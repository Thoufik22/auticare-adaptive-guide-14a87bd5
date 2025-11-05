import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Volume2, VolumeX } from 'lucide-react';

interface CalmZoneProps {
  onBack: () => void;
}

export default function CalmZone({ onBack }: CalmZoneProps) {
  const [audioEnabled, setAudioEnabled] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-mint/20 via-background to-lavender/20">
      <div className="max-w-4xl w-full space-y-6 animate-fade-in">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card className="border-2 border-mint">
          <CardHeader className="text-center">
            <CardTitle className="text-4xl mb-2">Calm Zone</CardTitle>
            <CardDescription className="text-lg">
              Take a moment to breathe and relax
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* Breathing Circle */}
            <div className="flex flex-col items-center py-12">
              <div className="relative w-64 h-64">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-mint to-bright-blue opacity-30 animate-breathe" />
                <div className="absolute inset-8 rounded-full bg-gradient-to-br from-lavender to-mint opacity-40 animate-breathe" 
                     style={{ animationDelay: '0.5s' }} />
                <div className="absolute inset-16 rounded-full bg-gradient-to-br from-bright-blue to-lavender opacity-50 animate-breathe" 
                     style={{ animationDelay: '1s' }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <p className="text-2xl font-semibold">Breathe</p>
                    <p className="text-sm text-muted-foreground">Follow the circle</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Breathing Instructions */}
            <Card className="bg-accent/30">
              <CardContent className="pt-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="w-12 h-12 rounded-full bg-mint mx-auto mb-2 flex items-center justify-center text-xl font-bold">
                      4
                    </div>
                    <p className="text-sm font-medium">Breathe In</p>
                  </div>
                  <div>
                    <div className="w-12 h-12 rounded-full bg-bright-blue mx-auto mb-2 flex items-center justify-center text-xl font-bold text-white">
                      4
                    </div>
                    <p className="text-sm font-medium">Hold</p>
                  </div>
                  <div>
                    <div className="w-12 h-12 rounded-full bg-lavender mx-auto mb-2 flex items-center justify-center text-xl font-bold">
                      4
                    </div>
                    <p className="text-sm font-medium">Breathe Out</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Audio Control */}
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setAudioEnabled(!audioEnabled)}
                className="gap-2"
              >
                {audioEnabled ? (
                  <>
                    <Volume2 className="w-5 h-5" />
                    Ambient Sound On
                  </>
                ) : (
                  <>
                    <VolumeX className="w-5 h-5" />
                    Ambient Sound Off
                  </>
                )}
              </Button>
            </div>

            {/* Calming Visuals */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-2xl bg-gradient-to-br from-mint/30 via-lavender/30 to-bright-blue/30 animate-float"
                  style={{ animationDelay: `${i * 0.5}s` }}
                />
              ))}
            </div>

            {/* Positive Affirmations */}
            <Card className="bg-gradient-to-r from-mint/20 to-lavender/20">
              <CardContent className="pt-6 text-center">
                <p className="text-xl font-medium italic">
                  "You are doing great. Take your time. You've got this."
                </p>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
