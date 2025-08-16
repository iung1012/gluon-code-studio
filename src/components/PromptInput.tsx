import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Send, Sparkles, Loader2, Plus, Edit } from "lucide-react";

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

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">v0.dev Clone</h1>
            <p className="text-sm text-muted-foreground">Generate websites with AI</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 flex flex-col">
        <div className="flex-1 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">
              {hasExistingFiles ? 'Editar Website' : 'Descreva seu website'}
            </h2>
            {hasExistingFiles && onNewProject && (
              <Button
                variant="outline"
                size="sm"
                onClick={onNewProject}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Novo Projeto
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            {hasExistingFiles 
              ? 'Descreva EXATAMENTE o que você quer alterar (ex: "mude a cor do botão para azul", "adicione um campo email no formulário").'
              : 'Descreva sua ideia de website e eu vou gerar um arquivo HTML monolítico completo com tudo integrado.'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={hasExistingFiles 
                ? "Ex: Altere a cor do botão para azul, ou adicione um campo de email no formulário..."
                : "Ex: Crie um dashboard de vendas com gráficos interativos, ou uma landing page moderna para uma startup..."
              }
              className="min-h-[160px] resize-none bg-muted/30 border-border/50 focus:border-primary/50 transition-colors"
              disabled={isLoading}
            />
          </div>
          
          <Button 
            type="submit" 
            disabled={!prompt.trim() || isLoading}
            className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all duration-300 gap-2 hover-scale"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="animate-pulse">
                  {hasExistingFiles ? 'Aplicando Alteração...' : 'Gerando Website...'}
                </span>
              </>
            ) : (
              <>
                {hasExistingFiles ? <Edit className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                {hasExistingFiles ? 'Aplicar Alteração' : 'Enviar e Gerar'}
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};