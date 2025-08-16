import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUp, Sparkles, Bot } from "lucide-react";

interface WelcomeScreenProps {
  onSubmit: (prompt: string, model: string) => void;
  isLoading: boolean;
}

export const WelcomeScreen = ({ onSubmit, isLoading }: WelcomeScreenProps) => {
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState("glm-4-plus");

  const models = [
    { value: "glm-4-plus", label: "GLM-4 Plus", description: "Modelo mais avançado e capaz" },
    { value: "glm-4-air", label: "GLM-4 Air", description: "Versão mais rápida e eficiente" },
    { value: "glm-4-airx", label: "GLM-4 AirX", description: "Versão otimizada" },
    { value: "glm-4-flash", label: "GLM-4 Flash", description: "Versão ultra-rápida" },
    { value: "glm-4-32b-0414-128k", label: "GLM-4 (32B)", description: "Modelo robusto com 128k contexto" }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isLoading) {
      onSubmit(prompt.trim(), selectedModel);
    }
  };

  const examples = [
    "Generate a modern portfolio website",
    "Create a landing page for a SaaS product", 
    "Build a restaurant menu website"
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
            What can I help you{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              build?
            </span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Describe your website and I'll generate the complete HTML code for you
          </p>
        </div>

        {/* Model Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">AI Model</label>
          <Select value={selectedModel} onValueChange={setSelectedModel} disabled={isLoading}>
            <SelectTrigger className="w-full bg-card border-border">
              <SelectValue placeholder="Selecione o modelo">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-primary" />
                  <span>{models.find(m => m.value === selectedModel)?.label}</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {models.map((model) => (
                <SelectItem key={model.value} value={model.value} className="focus:bg-accent">
                  <div className="flex flex-col">
                    <span className="font-medium">{model.label}</span>
                    <span className="text-xs text-muted-foreground">{model.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask me to build a website..."
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
          <p className="text-sm text-muted-foreground text-center">Try these examples:</p>
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