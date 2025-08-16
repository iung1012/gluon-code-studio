import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { ArrowUp, Sparkles, Bot, Thermometer } from "lucide-react";

interface WelcomeScreenProps {
  onSubmit: (prompt: string, model: string, temperature: number) => void;
  isLoading: boolean;
}

export const WelcomeScreen = ({ onSubmit, isLoading }: WelcomeScreenProps) => {
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState("glm-4.5-flash");
  const [temperature, setTemperature] = useState([0.7]);

  const models = [
    { value: "glm-4.5", label: "GLM-4.5", description: "Modelo mais poderoso, 355B parâmetros" },
    { value: "glm-4.5-ar", label: "GLM-4.5-Ar", description: "Leve e robusto, boa relação custo-benefício" },
    { value: "glm-4.5-x", label: "GLM-4.5-X", description: "Alto desempenho, resposta ultrarrápida" },
    { value: "glm-4.5-airx", label: "GLM-4.5-AirX", description: "Leve e forte, resposta ultrarrápida" },
    { value: "glm-4.5-flash", label: "GLM-4.5-Flash", description: "Gratuito, excelente para programação" }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isLoading) {
      onSubmit(prompt.trim(), selectedModel, temperature[0]);
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

        {/* Model Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Modelo de IA</label>
          <Select value={selectedModel} onValueChange={setSelectedModel} disabled={isLoading}>
            <SelectTrigger className="w-full bg-card border-border">
              <SelectValue placeholder="Selecione o modelo de IA">
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

        {/* Temperature Control */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-primary" />
            <Label className="text-sm font-medium">
              Criatividade: {temperature[0].toFixed(1)} 
              <span className="text-xs text-muted-foreground ml-2">
                ({temperature[0] <= 0.3 ? 'Precisa' : temperature[0] <= 0.7 ? 'Equilibrada' : 'Criativa'})
              </span>
            </Label>
          </div>
          <Slider
            value={temperature}
            onValueChange={setTemperature}
            max={1}
            min={0.1}
            step={0.1}
            className="w-full"
            disabled={isLoading}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Mais Precisa</span>
            <span>Mais Criativa</span>
          </div>
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