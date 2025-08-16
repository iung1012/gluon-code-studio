import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Code, Palette, Zap } from "lucide-react";

interface LoadingScreenProps {
  isVisible: boolean;
}

export const LoadingScreen = ({ isVisible }: LoadingScreenProps) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { icon: Sparkles, text: "Analyzing your request...", duration: 20 },
    { icon: Code, text: "Generating HTML structure...", duration: 40 },
    { icon: Palette, text: "Designing beautiful styles...", duration: 30 },
    { icon: Zap, text: "Adding final touches...", duration: 10 }
  ];

  useEffect(() => {
    if (!isVisible) {
      setProgress(0);
      setCurrentStep(0);
      return;
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + 1;
        
        // Update current step based on progress
        let stepIndex = 0;
        let cumulativePercent = 0;
        for (let i = 0; i < steps.length; i++) {
          cumulativePercent += steps[i].duration;
          if (newProgress <= cumulativePercent) {
            stepIndex = i;
            break;
          }
        }
        setCurrentStep(stepIndex);
        
        return Math.min(newProgress, 100);
      });
    }, 80);

    return () => clearInterval(interval);
  }, [isVisible]);

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
            <h2 className="text-xl font-semibold mb-2">Creating your website</h2>
            <p className="text-muted-foreground text-sm">
              {steps[currentStep]?.text || "Processing..."}
            </p>
          </div>
          
          <Progress value={progress} className="h-2" />
          
          <div className="text-center">
            <span className="text-sm text-muted-foreground">
              {Math.round(progress)}% complete
            </span>
          </div>
        </div>

        {/* Steps Indicator */}
        <div className="grid grid-cols-4 gap-2">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep || progress === 100;
            
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