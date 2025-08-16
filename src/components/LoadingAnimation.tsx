import { cn } from "@/lib/utils";
import { Sparkles, Code, Globe, Zap, Cpu, Database } from "lucide-react";

interface LoadingAnimationProps {
  type?: 'default' | 'code-generation' | 'website-build' | 'processing';
  message?: string;
  submessage?: string;
  progress?: number;
  className?: string;
}

export const LoadingAnimation = ({ 
  type = 'default', 
  message,
  submessage,
  progress,
  className 
}: LoadingAnimationProps) => {
  
  const getLoadingIcon = () => {
    switch (type) {
      case 'code-generation':
        return Code;
      case 'website-build':
        return Globe;
      case 'processing':
        return Cpu;
      default:
        return Sparkles;
    }
  };

  const getLoadingSteps = () => {
    switch (type) {
      case 'code-generation':
        return [
          { icon: Sparkles, text: "Analisando requisitos", delay: 0 },
          { icon: Code, text: "Gerando HTML/CSS", delay: 0.2 },
          { icon: Zap, text: "Criando JavaScript", delay: 0.4 },
          { icon: Database, text: "Configurando backend", delay: 0.6 }
        ];
      case 'website-build':
        return [
          { icon: Globe, text: "Estruturando projeto", delay: 0 },
          { icon: Code, text: "Compilando códigos", delay: 0.3 },
          { icon: Sparkles, text: "Otimizando assets", delay: 0.6 },
          { icon: Zap, text: "Preparando preview", delay: 0.9 }
        ];
      default:
        return [
          { icon: Sparkles, text: "Processando", delay: 0 },
          { icon: Cpu, text: "Executando IA", delay: 0.3 },
          { icon: Code, text: "Finalizando", delay: 0.6 }
        ];
    }
  };

  const Icon = getLoadingIcon();
  const steps = getLoadingSteps();

  return (
    <div className={cn("flex flex-col items-center justify-center space-y-6 p-8", className)}>
      {/* Main spinner */}
      <div className="relative">
        {/* Outer ring */}
        <div className="w-20 h-20 border-4 border-primary/20 rounded-full animate-spin border-t-primary"></div>
        
        {/* Inner glow */}
        <div className="absolute inset-2 w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center shadow-glow">
          <Icon className="w-8 h-8 text-primary-foreground animate-pulse" />
        </div>
        
        {/* Orbiting dots */}
        <div className="absolute inset-0 w-20 h-20 animate-spin [animation-duration:3s]">
          <div className="absolute top-0 left-1/2 w-2 h-2 bg-accent rounded-full -translate-x-1/2 -translate-y-1"></div>
          <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-primary rounded-full -translate-x-1/2 translate-y-1"></div>
        </div>
      </div>

      {/* Progress bar */}
      {progress !== undefined && (
        <div className="w-64 h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          ></div>
        </div>
      )}

      {/* Messages */}
      <div className="text-center space-y-2">
        {message && (
          <h3 className="text-lg font-medium text-foreground">
            {message}
          </h3>
        )}
        {submessage && (
          <p className="text-sm text-muted-foreground max-w-md">
            {submessage}
          </p>
        )}
        {progress !== undefined && (
          <p className="text-xs text-muted-foreground">
            {Math.round(progress)}% concluído
          </p>
        )}
      </div>

      {/* Loading steps */}
      <div className="flex flex-wrap justify-center gap-4 max-w-md">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isActive = progress !== undefined ? 
            progress >= (index / steps.length) * 100 : 
            true;
          
          return (
            <div
              key={index}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-full border transition-all duration-300",
                isActive 
                  ? "bg-primary/10 border-primary/30 text-primary" 
                  : "bg-muted/50 border-border text-muted-foreground"
              )}
              style={{ 
                animationDelay: `${step.delay}s`,
                animation: isActive ? 'pulse 2s infinite' : 'none'
              }}
            >
              <StepIcon className="w-4 h-4" />
              <span className="text-xs font-medium">{step.text}</span>
            </div>
          );
        })}
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-primary/30 rounded-full animate-float"
            style={{
              left: `${20 + (i * 12)}%`,
              top: `${30 + (i % 3) * 20}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + (i % 2)}s`
            }}
          ></div>
        ))}
      </div>
    </div>
  );
};