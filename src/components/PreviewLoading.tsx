
import { Sparkles, Code, Palette, Zap } from "lucide-react";
import { useEffect, useState } from "react";

interface PreviewLoadingProps {
  progress?: number;
}

export const PreviewLoading = ({ progress: externalProgress }: PreviewLoadingProps) => {
  const [internalProgress, setInternalProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { 
      text: "Processando alterações", 
      subtext: "Analisando suas modificações",
      threshold: 25,
      icon: Sparkles,
    },
    { 
      text: "Gerando código", 
      subtext: "Aplicando mudanças solicitadas",
      threshold: 50,
      icon: Code,
    },
    { 
      text: "Otimizando layout", 
      subtext: "Ajustando design responsivo",
      threshold: 75,
      icon: Palette,
    },
    { 
      text: "Finalizando", 
      subtext: "Preparando preview",
      threshold: 100,
      icon: Zap,
    }
  ];

  const currentProgress = externalProgress !== undefined ? externalProgress : internalProgress;

  useEffect(() => {
    if (externalProgress === undefined) {
      const interval = setInterval(() => {
        setInternalProgress((prev) => {
          const newProgress = Math.min(prev + 2, 95);
          return newProgress;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [externalProgress]);

  useEffect(() => {
    const step = steps.findIndex(step => currentProgress <= step.threshold);
    setCurrentStep(step === -1 ? steps.length - 1 : step);
  }, [currentProgress]);

  return (
    <div className="h-full flex items-center justify-center bg-gray-900/80 backdrop-blur-md">
      <div className="w-full max-w-sm mx-auto p-8 text-center">
        {/* Central Loading Animation */}
        <div className="relative mb-8">
          <div className="w-16 h-16 mx-auto relative">
            <div className="absolute inset-0 rounded-full border-2 border-white/30"></div>
            <div 
              className="absolute inset-0 rounded-full border-2 border-white border-t-transparent animate-spin"
              style={{ animationDuration: '1s' }}
            ></div>
            <div className="absolute inset-2 rounded-full bg-white/10 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white animate-pulse" />
            </div>
          </div>
        </div>

        <h3 className="text-xl font-medium text-white mb-2">
          Atualizando website
        </h3>
        
        <div className="text-sm text-white/70 mb-8">
          <span className="font-medium">{Math.round(currentProgress)}%</span> completo
        </div>

        {/* Current Step */}
        <div className="space-y-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = currentProgress > step.threshold;
            
            return (
              <div 
                key={index}
                className={`flex items-center gap-3 transition-all duration-300 ${
                  isActive ? 'opacity-100' : isCompleted ? 'opacity-80' : 'opacity-40'
                }`}
              >
                <div className={`
                  w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300
                  ${isCompleted 
                    ? 'bg-white/20 text-white' 
                    : isActive 
                      ? 'bg-white/15 text-white animate-pulse' 
                      : 'bg-white/10 text-white/60'
                  }
                `}>
                  <Icon className="w-4 h-4" />
                </div>
                
                <div className="flex-1 text-left">
                  <h4 className={`font-medium text-sm ${
                    isCompleted || isActive ? 'text-white' : 'text-white/60'
                  }`}>
                    {step.text}
                  </h4>
                  <p className={`text-xs ${
                    isCompleted || isActive ? 'text-white/70' : 'text-white/40'
                  }`}>
                    {step.subtext}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="mt-8">
          <div className="w-full bg-white/20 rounded-full h-1 overflow-hidden">
            <div 
              className="h-full bg-white rounded-full transition-all duration-500 ease-out"
              style={{ width: `${currentProgress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
