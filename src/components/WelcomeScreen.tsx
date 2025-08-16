
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
    "Crie um portfólio moderno e profissional",
    "Desenvolva uma landing page para produto SaaS", 
    "Construa um site de menu para restaurante"
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl mx-auto space-y-8">
        {/* Logo */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-6">
            <Sparkles className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">
            O que posso te ajudar a{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              construir?
            </span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Descreva seu website e eu gero o código HTML completo para você
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Me ajude a construir um website..."
              className="min-h-[120px] pr-12 text-base resize-none bg-card border-border focus:ring-primary focus:border-primary"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              className="absolute bottom-3 right-3 h-8 w-8 rounded-lg"
              disabled={!prompt.trim() || isLoading}
            >
              <ArrowUp className="w-4 h-4" />
            </Button>
          </div>
        </form>

        {/* Example Prompts */}
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground text-center">Experimente estes exemplos:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {examples.map((example, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => setPrompt(example)}
                disabled={isLoading}
                className="text-xs h-8 px-3 bg-card hover:bg-accent border-border"
              >
                {example}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
