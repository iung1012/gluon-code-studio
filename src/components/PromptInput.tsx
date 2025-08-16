
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Send, Plus, ArrowRight } from "lucide-react";

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
  hasExistingFiles?: boolean;
  onNewProject?: () => void;
}

export const PromptInput = ({ onSubmit, isLoading, hasExistingFiles = false, onNewProject }: PromptInputProps) => {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isLoading) {
      onSubmit(prompt.trim());
    }
  };

  const suggestionExamples = hasExistingFiles ? [
    "Altere a cor do botão para azul",
    "Adicione um campo de email",
    "Mude o título da página"
  ] : [
    "Landing page para startup de tecnologia",
    "Dashboard com gráficos de vendas",
    "Portfolio pessoal minimalista"
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Clean Header */}
      <div className="border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-8 py-12">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-light text-foreground tracking-tight">
              Gerador de Websites
            </h1>
            <p className="text-lg text-muted-foreground font-normal max-w-2xl mx-auto">
              Crie websites profissionais com inteligência artificial
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-2xl">
          <Card className="border border-border/50 bg-card/50 backdrop-blur-sm shadow-lg">
            <div className="p-8 space-y-8">
              {/* Title and New Project Button */}
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-medium text-foreground">
                  {hasExistingFiles ? 'Editar Website' : 'Descreva seu projeto'}
                </h2>
                {hasExistingFiles && onNewProject && (
                  <Button
                    variant="outline"
                    onClick={onNewProject}
                    className="gap-2 border-border/50 hover:bg-muted/50"
                  >
                    <Plus className="w-4 h-4" />
                    Novo
                  </Button>
                )}
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={hasExistingFiles 
                    ? "Descreva as alterações que deseja fazer..."
                    : "Descreva seu website ideal..."
                  }
                  className="min-h-[140px] resize-none text-base border-border/50 bg-background/50 focus:border-primary/50 focus:ring-primary/10"
                  disabled={isLoading}
                />
                
                <Button 
                  type="submit" 
                  disabled={!prompt.trim() || isLoading}
                  className="w-full h-12 bg-primary hover:bg-primary/90 gap-2 font-medium"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary-foreground/20 border-t-primary-foreground rounded-full animate-spin" />
                      Gerando...
                    </div>
                  ) : (
                    <>
                      {hasExistingFiles ? 'Aplicar' : 'Gerar'}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>

              {/* Suggestions */}
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground font-medium">
                  Sugestões:
                </p>
                <div className="grid gap-2">
                  {suggestionExamples.map((example, index) => (
                    <button
                      key={index}
                      onClick={() => setPrompt(example)}
                      className="p-3 text-left text-sm bg-muted/30 hover:bg-muted/50 rounded-lg border border-border/30 hover:border-border/50 transition-all text-muted-foreground hover:text-foreground"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
