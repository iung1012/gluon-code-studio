import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Code, Palette, Zap } from "lucide-react";

interface LoadingScreenProps {
  isVisible: boolean;
  progress?: number;
  currentContent?: string;
}

export const LoadingScreen = ({ isVisible, progress: externalProgress, currentContent }: LoadingScreenProps) => {
  const [internalProgress, setInternalProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { icon: Sparkles, text: "Conectando à IA...", duration: 10 },
    { icon: Code, text: "Gerando estrutura HTML...", duration: 40 },
    { icon: Palette, text: "Criando estilos visuais...", duration: 35 },
    { icon: Zap, text: "Finalizando detalhes...", duration: 15 }
  ];

  // Use external progress if provided, otherwise use internal progress
  const currentProgress = externalProgress !== undefined ? externalProgress : internalProgress;

  useEffect(() => {
    if (!isVisible) {
      setInternalProgress(0);
      setCurrentStep(0);
      return;
    }

    // Only run internal progress if no external progress is provided
    if (externalProgress === undefined) {
      const interval = setInterval(() => {
        setInternalProgress((prev) => {
          const newProgress = Math.min(prev + 0.5, 95); // Stop at 95% to wait for real completion
          return newProgress;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [isVisible, externalProgress]);

  // Update current step based on progress
  useEffect(() => {
    let stepIndex = 0;
    let cumulativePercent = 0;
    for (let i = 0; i < steps.length; i++) {
      cumulativePercent += steps[i].duration;
      if (currentProgress <= cumulativePercent) {
        stepIndex = i;
        break;
      }
    }
    setCurrentStep(stepIndex);
  }, [currentProgress, steps]);

  // Calculate progress from content length for streaming
  useEffect(() => {
    if (currentContent && externalProgress === undefined) {
      // Estimate progress based on content length
      // Typical HTML might be 2000-10000 characters
      const estimatedProgress = Math.min((currentContent.length / 5000) * 100, 100);
      setInternalProgress(estimatedProgress);
    }
  }, [currentContent, externalProgress]);

  if (!isVisible) return null;

  const CurrentIcon = steps[currentStep]?.icon || Sparkles;

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="w-full max-w-md mx-auto p-6 space-y-8">
        {/* Animated Icon */}
        <div className="text-center">
          <div className="relative inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6">
            <CurrentIcon className="w-10 h-10 text-primary animate-pulse" />
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Criando seu website</h2>
            <p className="text-muted-foreground text-sm">
              {steps[currentStep]?.text || "Processando..."}
            </p>
          </div>
          
          <Progress value={currentProgress} className="h-2" />
          
          <div className="text-center">
            <span className="text-sm text-muted-foreground">
              {Math.round(currentProgress)}% concluído
            </span>
          </div>
        </div>

        {/* Steps Indicator */}
        <div className="grid grid-cols-4 gap-2">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep || currentProgress === 100;
            
            return (
              <div
                key={index}
                className={`flex flex-col items-center space-y-2 p-2 rounded-lg transition-all ${
                  isActive 
                    ? "bg-primary/10 scale-105" 
                    : isCompleted 
                    ? "bg-accent/50" 
                    : "bg-muted/30"
                }`}
              >
                <StepIcon 
                  className={`w-4 h-4 ${
                    isActive 
                      ? "text-primary" 
                      : isCompleted 
                      ? "text-accent-foreground" 
                      : "text-muted-foreground"
                  }`} 
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};