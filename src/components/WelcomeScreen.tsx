
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { GlowCard } from "@/components/ui/glow-card";
import { ArrowUp, Sparkles } from "lucide-react";

interface WelcomeScreenProps {
  onSubmit: (prompt: string, model: string, temperature: number) => void;
  isLoading: boolean;
}

export const WelcomeScreen = ({ onSubmit, isLoading }: WelcomeScreenProps) => {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isLoading) {
      onSubmit(prompt.trim(), "glm-4.5", 0.4);
    }
  };

  const examples = [
    "Portfólio moderno e profissional",
    "Landing page para produto SaaS", 
    "Site de menu para restaurante"
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xl mx-auto space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-3xl mb-8">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          
          <div className="space-y-4">
            <h1 className="text-4xl font-light tracking-tight leading-tight">
              O que posso te ajudar a{" "}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent font-normal">
                construir?
              </span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-md mx-auto">
              Descreva seu website e eu gero o código completo para você
            </p>
          </div>
        </div>

        {/* Input Form with Glow Effect */}
        <div className="space-y-6">
          <GlowCard 
            glowColor="purple" 
            customSize={true}
            className="w-full h-auto aspect-auto p-0 bg-transparent border-0 shadow-none backdrop-blur-0"
          >
            <form onSubmit={handleSubmit} className="space-y-4 p-6">
              <div className="relative">
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Me ajude a construir um website..."
                  className="min-h-[100px] pr-12 text-base resize-none bg-card/50 border-0 focus:ring-0 focus:border-0 placeholder:text-muted-foreground/60 backdrop-blur-sm"
                  disabled={isLoading}
                />
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
          </GlowCard>

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
                  className="h-auto p-3 text-sm text-left justify-start bg-muted/20 hover:bg-muted/40 border border-border/20 hover:border-border/40 font-normal text-muted-foreground hover:text-foreground"
                >
                  {example}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
