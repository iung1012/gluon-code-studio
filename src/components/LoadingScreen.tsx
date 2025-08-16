
import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Code, Palette, Zap, Wand2 } from "lucide-react";

interface LoadingScreenProps {
  isVisible: boolean;
  progress?: number;
  currentContent?: string;
}

export const LoadingScreen = ({ isVisible, progress: externalProgress, currentContent }: LoadingScreenProps) => {
  const [internalProgress, setInternalProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { icon: Sparkles, text: "Conectando à IA...", duration: 10, color: "text-blue-400" },
    { icon: Code, text: "Gerando estrutura HTML...", duration: 40, color: "text-green-400" },
    { icon: Palette, text: "Criando estilos visuais...", duration: 35, color: "text-purple-400" },
    { icon: Zap, text: "Finalizando detalhes...", duration: 15, color: "text-yellow-400" }
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
  const currentColor = steps[currentStep]?.color || "text-primary";

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-background via-background/95 to-primary/5 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="w-full max-w-lg mx-auto p-8">
        {/* Enhanced Animated Icon */}
        <div className="text-center mb-12">
          <div className="relative inline-flex items-center justify-center">
            {/* Outer pulsing ring */}
            <div className="absolute inset-0 w-32 h-32 bg-primary/10 rounded-full animate-ping" />
            <div className="absolute inset-2 w-28 h-28 bg-primary/20 rounded-full animate-pulse" />
            
            {/* Main icon container */}
            <div className="relative w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center shadow-2xl">
              <CurrentIcon className={`w-12 h-12 ${currentColor} animate-bounce`} />
              
              {/* Floating particles */}
              <div className="absolute -top-2 -right-2 w-3 h-3 bg-yellow-400 rounded-full animate-ping opacity-70" />
              <div className="absolute -bottom-1 -left-3 w-2 h-2 bg-blue-400 rounded-full animate-pulse opacity-60" />
              <div className="absolute top-1 -right-4 w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce opacity-80" />
            </div>

            {/* Magic wand effect */}
            <Wand2 className="absolute -top-8 -right-8 w-6 h-6 text-primary/60 animate-pulse" />
          </div>
        </div>

        {/* Enhanced Progress Section */}
        <div className="space-y-6">
          <div className="text-center space-y-3">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Criando seu website
            </h2>
            <p className="text-muted-foreground text-base font-medium">
              {steps[currentStep]?.text || "Processando..."}
            </p>
          </div>
          
          {/* Enhanced Progress Bar */}
          <div className="relative">
            <Progress 
              value={currentProgress} 
              className="h-3 bg-muted/50 shadow-inner"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent h-3 rounded-full animate-pulse" />
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground font-medium">
              {Math.round(currentProgress)}% concluído
            </span>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse [animation-delay:0.2s]" />
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse [animation-delay:0.4s]" />
            </div>
          </div>
        </div>

        {/* Enhanced Steps Indicator */}
        <div className="grid grid-cols-4 gap-3 mt-8">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep || currentProgress === 100;
            
            return (
              <div
                key={index}
                className={`relative flex flex-col items-center space-y-3 p-4 rounded-xl transition-all duration-300 transform ${
                  isActive 
                    ? "bg-gradient-to-br from-primary/20 to-accent/20 scale-110 shadow-lg border border-primary/30" 
                    : isCompleted 
                    ? "bg-gradient-to-br from-accent/20 to-muted/30 scale-105 shadow-md" 
                    : "bg-muted/20 hover:bg-muted/30"
                }`}
              >
                {/* Icon with enhanced effects */}
                <div className={`relative p-2 rounded-lg ${
                  isActive 
                    ? "bg-primary/20 shadow-lg" 
                    : isCompleted 
                    ? "bg-accent/20" 
                    : "bg-muted/30"
                }`}>
                  <StepIcon 
                    className={`w-5 h-5 transition-all duration-300 ${
                      isActive 
                        ? `${step.color} animate-pulse` 
                        : isCompleted 
                        ? "text-accent-foreground" 
                        : "text-muted-foreground"
                    }`} 
                  />
                  
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute -inset-1 bg-primary/30 rounded-lg animate-ping" />
                  )}
                  
                  {/* Completed checkmark */}
                  {isCompleted && !isActive && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full" />
                    </div>
                  )}
                </div>

                {/* Step label */}
                <div className={`text-xs font-medium text-center leading-tight ${
                  isActive 
                    ? "text-foreground" 
                    : isCompleted 
                    ? "text-accent-foreground" 
                    : "text-muted-foreground"
                }`}>
                  {step.text.split(' ').slice(0, 2).join(' ')}
                </div>

                {/* Progress line */}
                {index < steps.length - 1 && (
                  <div className="absolute top-8 left-full w-3 h-0.5 bg-gradient-to-r from-transparent to-muted/50 transform -translate-y-1/2" />
                )}
              </div>
            );
          })}
        </div>

        {/* Floating elements for extra flair */}
        <div className="absolute top-20 left-10 w-16 h-16 bg-primary/5 rounded-full animate-float opacity-60" />
        <div className="absolute bottom-20 right-10 w-12 h-12 bg-accent/5 rounded-full animate-float [animation-delay:1s] opacity-40" />
        <div className="absolute top-1/2 left-5 w-8 h-8 bg-muted/10 rounded-full animate-float [animation-delay:2s] opacity-30" />
      </div>
    </div>
  );
};
