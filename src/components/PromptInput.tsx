
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Send, Plus, ArrowRight, Sparkles } from "lucide-react";

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
      {/* Minimal Header */}
      <div className="border-b border-border/30">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <div className="text-center space-y-6">
            {/* Logo */}
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-2xl mb-4">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            
            <div className="space-y-3">
              <h1 className="text-3xl font-light text-foreground tracking-tight">
                {hasExistingFiles ? 'Editar Website' : 'Gerador de Websites'}
              </h1>
              <p className="text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
                {hasExistingFiles 
                  ? 'Descreva as alterações que gostaria de fazer'
                  : 'Crie websites profissionais com inteligência artificial'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <Card className="border border-border/50 bg-card/30 backdrop-blur-sm shadow-sm">
            <div className="p-8 space-y-6">
              {/* New Project Button */}
              {hasExistingFiles && onNewProject && (
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    onClick={onNewProject}
                    className="gap-2 text-muted-foreground hover:text-foreground"
                  >
                    <Plus className="w-4 h-4" />
                    Novo Projeto
                  </Button>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={hasExistingFiles 
                      ? "Descreva as alterações que deseja fazer..."
                      : "Descreva seu website ideal..."
                    }
                    className="min-h-[120px] resize-none text-base border-border/40 bg-background/50 focus:border-primary/40 focus:ring-primary/10 placeholder:text-muted-foreground/60"
                    disabled={isLoading}
                  />
                </div>
                
                <Button 
                  type="submit" 
                  disabled={!prompt.trim() || isLoading}
                  className="w-full h-11 bg-primary hover:bg-primary/90 gap-2 font-normal"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary-foreground/20 border-t-primary-foreground rounded-full animate-spin" />
                      <span>Gerando...</span>
                    </div>
                  ) : (
                    <>
                      <span>{hasExistingFiles ? 'Aplicar Alterações' : 'Gerar Website'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>

              {/* Suggestions */}
              <div className="space-y-3 pt-2">
                <p className="text-xs text-muted-foreground/80 font-medium uppercase tracking-wide">
                  Sugestões
                </p>
                <div className="grid gap-2">
                  {suggestionExamples.map((example, index) => (
                    <button
                      key={index}
                      onClick={() => setPrompt(example)}
                      className="p-3 text-left text-sm bg-muted/20 hover:bg-muted/40 rounded-xl border border-border/20 hover:border-border/40 transition-all text-muted-foreground hover:text-foreground"
                      disabled={isLoading}
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
