
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUp, Zap } from "lucide-react";
import { Header } from "@/components/Header";

interface WelcomeScreenProps {
  onSubmit: (prompt: string, model: string, temperature: number) => void;
  isLoading: boolean;
}

export const WelcomeScreen = ({ onSubmit, isLoading }: WelcomeScreenProps) => {
  const [prompt, setPrompt] = useState("");
  const [modelType, setModelType] = useState<'basic' | 'pro'>('basic');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isLoading) {
      const modelName = modelType === 'basic' ? "glm-4.5" : "glm-4.5-x";
      onSubmit(prompt.trim(), modelName, 0.4);
    }
  };

  const examples = [
    "Tela de login moderna com animações",
    "Portfólio moderno e profissional",
    "Landing page para produto SaaS", 
    "Site de menu para restaurante"
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 pt-20 sm:pt-24">
        <div className="w-full max-w-xl mx-auto space-y-8 sm:space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-4 sm:space-y-6">
          
          <div className="space-y-3 sm:space-y-4">
            <h1 className="text-3xl sm:text-4xl font-light tracking-tight leading-tight px-2">
              O que posso te ajudar a{" "}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent font-normal">
                construir?
              </span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-md mx-auto px-4">
              Descreva sua landing page e eu gero o código completo para você
            </p>
          </div>
        </div>

        {/* Input Form */}
        <div className="space-y-4 sm:space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Me ajude a construir uma landing page..."
                className="min-h-[120px] sm:min-h-[100px] pl-3 pr-12 pb-14 sm:pb-12 text-sm sm:text-base resize-none bg-card/50 border-border/40 focus:ring-primary/10 focus:border-primary/40 placeholder:text-muted-foreground/60"
                disabled={isLoading}
              />
              
              {/* Model Selection Button - Inside input, bottom left */}
              <Button
                type="button"
                variant={modelType === 'pro' ? "default" : "outline"}
                size="sm"
                onClick={() => setModelType(modelType === 'basic' ? 'pro' : 'basic')}
                className="absolute bottom-3 left-3 gap-1.5 sm:gap-2 text-xs h-7 px-2 sm:px-3"
                disabled={isLoading}
              >
                <Zap className="w-3 h-3" />
                <span className="hidden sm:inline">{modelType === 'pro' ? 'PRO' : 'BASIC'}</span>
                <span className="sm:hidden">{modelType === 'pro' ? 'P' : 'B'}</span>
              </Button>
              
              {/* Submit Button - Inside input, bottom right */}
              <Button
                type="submit"
                size="icon"
                className="absolute bottom-3 right-3 h-8 w-8 rounded-xl bg-primary hover:bg-primary/90"
                disabled={!prompt.trim() || isLoading}
              >
                <ArrowUp className="w-4 h-4" />
              </Button>
            </div>
          </form>

          {/* Example Prompts */}
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground/80 text-center font-medium uppercase tracking-wide">
              Experimente estes exemplos
            </p>
            <div className="flex flex-col gap-2">
              {examples.map((example, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  onClick={() => setPrompt(example)}
                  disabled={isLoading}
                  className="h-auto p-2.5 sm:p-3 text-xs sm:text-sm text-left justify-start bg-muted/20 hover:bg-muted/40 border border-border/20 hover:border-border/40 font-normal text-muted-foreground hover:text-foreground"
                >
                  {example}
                </Button>
              ))}
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};
