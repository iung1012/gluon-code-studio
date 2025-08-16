
import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Sparkles } from "lucide-react";

interface LoadingScreenProps {
  isVisible: boolean;
  progress?: number;
  currentContent?: string;
}

export const LoadingScreen = ({ isVisible, progress: externalProgress, currentContent }: LoadingScreenProps) => {
  const [internalProgress, setInternalProgress] = useState(0);

  const steps = [
    { text: "Conectando à IA...", threshold: 25 },
    { text: "Gerando estrutura...", threshold: 50 },
    { text: "Criando estilos...", threshold: 80 },
    { text: "Finalizando...", threshold: 100 }
  ];

  // Use external progress if provided, otherwise use internal progress
  const currentProgress = externalProgress !== undefined ? externalProgress : internalProgress;

  useEffect(() => {
    if (!isVisible) {
      setInternalProgress(0);
      return;
    }

    // Only run internal progress if no external progress is provided
    if (externalProgress === undefined) {
      const interval = setInterval(() => {
        setInternalProgress((prev) => {
          const newProgress = Math.min(prev + 0.8, 95);
          return newProgress;
        });
      }, 150);

      return () => clearInterval(interval);
    }
  }, [isVisible, externalProgress]);

  // Calculate progress from content length for streaming
  useEffect(() => {
    if (currentContent && externalProgress === undefined) {
      const estimatedProgress = Math.min((currentContent.length / 5000) * 100, 100);
      setInternalProgress(estimatedProgress);
    }
  }, [currentContent, externalProgress]);

  if (!isVisible) return null;

  // Find current step
  const currentStep = steps.find(step => currentProgress <= step.threshold) || steps[steps.length - 1];

  return (
    <div className="fixed inset-0 bg-background/95 backdro-blur-xl z-50 flex items-center justify-center">
      <div className="w-full max-w-sm mx-auto p-8 text-center">
        {/* Minimal Icon */}
        <div className="mb-12 flex justify-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-primary" />
            </div>
            <div className="absolute inset-0 w-16 h-16 rounded-2xl bg-primary/5 animate-ping" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-medium text-foreground mb-2 tracking-tight">
          Criando seu website
        </h2>
        
        {/* Current Step */}
        <p className="text-sm text-muted-foreground mb-8 font-normal">
          {currentStep.text}
        </p>
        
        {/* Progress Bar - Apple Style */}
        <div className="space-y-3 mb-8">
          <div className="w-full bg-muted/30 rounded-full h-1 overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
              style={{ width: `${currentProgress}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground font-medium">
            {Math.round(currentProgress)}%
          </div>
        </div>

        {/* Minimal Progress Dots */}
        <div className="flex justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                currentProgress > (i + 1) * 25 
                  ? 'bg-primary' 
                  : 'bg-muted/40'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
