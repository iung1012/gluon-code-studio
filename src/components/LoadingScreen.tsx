
import { useEffect, useState } from "react";
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
    { 
      text: "Conectando à IA", 
      subtext: "Estabelecendo conexão segura",
      threshold: 20,
      icon: Zap,
      color: "text-blue-500"
    },
    { 
      text: "Analisando pedido", 
      subtext: "Processando suas especificações",
      threshold: 40,
      icon: Sparkles,
      color: "text-purple-500"
    },
    { 
      text: "Gerando código", 
      subtext: "Criando estrutura HTML e CSS",
      threshold: 70,
      icon: Code,
      color: "text-green-500"
    },
    { 
      text: "Aplicando estilos", 
      subtext: "Finalizando design responsivo",
      threshold: 90,
      icon: Palette,
      color: "text-orange-500"
    }
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
          const newProgress = Math.min(prev + 0.5, 95);
          return newProgress;
        });
      }, 200);

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

  // Update current step based on progress
  useEffect(() => {
    const step = steps.findIndex(step => currentProgress <= step.threshold);
    setCurrentStep(step === -1 ? steps.length - 1 : step);
  }, [currentProgress]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-background/98 backdrop-blur-xl z-50 flex items-center justify-center">
      <div className="w-full max-w-md mx-auto p-8">
        {/* Main Loading Animation */}
        <div className="text-center mb-16">
          <div className="relative mb-8">
            {/* Central animated logo */}
            <div className="w-20 h-20 mx-auto relative">
              <div className="absolute inset-0 rounded-full border-2 border-primary/20"></div>
              <div 
                className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin"
                style={{ animationDuration: '1.5s' }}
              ></div>
              <div className="absolute inset-2 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
            </div>
            
            {/* Floating particles */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-primary/40 rounded-full animate-ping"
                  style={{
                    left: `${20 + (i * 10)}%`,
                    top: `${30 + (i % 2) * 40}%`,
                    animationDelay: `${i * 0.2}s`,
                    animationDuration: '2s'
                  }}
                />
              ))}
            </div>
          </div>

          <h2 className="text-2xl font-light text-foreground mb-3 tracking-tight">
            Criando seu website
          </h2>
          
          <div className="text-sm text-muted-foreground mb-12">
            <span className="font-medium">{Math.round(currentProgress)}%</span> completo
          </div>
        </div>

        {/* Process Steps */}
        <div className="space-y-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = currentProgress > step.threshold;
            
            return (
              <div 
                key={index}
                className={`flex items-start gap-4 transition-all duration-500 ${
                  isActive ? 'scale-105' : isCompleted ? 'opacity-60' : 'opacity-30'
                }`}
              >
                {/* Step Icon */}
                <div className={`
                  w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300
                  ${isCompleted 
                    ? 'bg-primary/20 border-2 border-primary/30' 
                    : isActive 
                      ? 'bg-primary/10 border-2 border-primary/20 animate-pulse' 
                      : 'bg-muted/30 border-2 border-transparent'
                  }
                `}>
                  <Icon className={`w-5 h-5 ${isCompleted || isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                
                {/* Step Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`font-medium text-sm ${
                      isCompleted || isActive ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {step.text}
                    </h3>
                    {isCompleted && (
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                    )}
                    {isActive && (
                      <div className="flex gap-1">
                        {[...Array(3)].map((_, i) => (
                          <div
                            key={i}
                            className="w-1 h-1 bg-primary rounded-full animate-bounce"
                            style={{ animationDelay: `${i * 0.1}s` }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <p className={`text-xs ${
                    isCompleted || isActive ? 'text-muted-foreground' : 'text-muted-foreground/50'
                  }`}>
                    {step.subtext}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Minimal Progress Bar */}
        <div className="mt-12 space-y-2">
          <div className="w-full bg-muted/20 rounded-full h-0.5 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${currentProgress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
