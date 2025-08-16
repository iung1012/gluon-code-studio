
import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Code, Palette, Zap } from "lucide-react";

interface LoadingScreenProps {
  isVisible: boolean;
  progress: number;
  currentContent?: string;
}

export const LoadingScreen = ({ isVisible, progress, currentContent }: LoadingScreenProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { icon: Sparkles, text: "Conectando à IA...", minProgress: 0 },
    { icon: Code, text: "Gerando estrutura HTML...", minProgress: 20 },
    { icon: Palette, text: "Criando estilos visuais...", minProgress: 50 },
    { icon: Zap, text: "Finalizando detalhes...", minProgress: 80 }
  ];

  // Update current step based on real progress
  useEffect(() => {
    let stepIndex = 0;
    for (let i = steps.length - 1; i >= 0; i--) {
      if (progress >= steps[i].minProgress) {
        stepIndex = i;
        break;
      }
    }
    setCurrentStep(stepIndex);
  }, [progress, steps]);

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
          
          <Progress value={progress} className="h-2" />
          
          <div className="text-center">
            <span className="text-sm text-muted-foreground">
              {Math.round(progress)}% concluído
            </span>
            {currentContent && (
              <div className="text-xs text-muted-foreground mt-1">
                {currentContent.length} caracteres processados
              </div>
            )}
          </div>
        </div>

        {/* Steps Indicator */}
        <div className="grid grid-cols-4 gap-2">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = progress >= step.minProgress && progress > step.minProgress + 10;
            
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

        {/* Real-time content preview */}
        {currentContent && currentContent.length > 100 && (
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-2">Preview em tempo real:</div>
            <div className="bg-muted/30 rounded-lg p-3 text-xs font-mono text-left max-h-20 overflow-hidden">
              {currentContent.substring(0, 150)}...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
