
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Send, Sparkles, Loader2, Plus, Edit, Wand2, Code2, Palette } from "lucide-react";

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
    "Mude a cor do botão para azul",
    "Adicione um campo de email no formulário",
    "Altere o título da página"
  ] : [
    "Landing page moderna para uma startup de tecnologia",
    "Dashboard de vendas com gráficos interativos",
    "Portfolio pessoal com galeria de projetos"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 flex flex-col">
      {/* Enhanced Header */}
      <div className="relative p-8 border-b border-border/50 bg-gradient-to-r from-card/50 to-card/30 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary via-accent to-primary flex items-center justify-center shadow-2xl">
                <Sparkles className="w-8 h-8 text-primary-foreground animate-pulse" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                <Wand2 className="w-3 h-3 text-yellow-900" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Gerador de Websites IA
              </h1>
              <p className="text-muted-foreground text-lg">
                Crie websites profissionais instantaneamente com inteligência artificial
              </p>
            </div>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
              <Code2 className="w-8 h-8 text-primary" />
              <div>
                <h3 className="font-semibold text-sm">Código Limpo</h3>
                <p className="text-xs text-muted-foreground">HTML, CSS e JS otimizados</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-accent/5 border border-accent/10">
              <Palette className="w-8 h-8 text-accent" />
              <div>
                <h3 className="font-semibold text-sm">Design Moderno</h3>
                <p className="text-xs text-muted-foreground">Layouts responsivos e atuais</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/5 border border-green-500/10">
              <Sparkles className="w-8 h-8 text-green-500" />
              <div>
                <h3 className="font-semibold text-sm">IA Avançada</h3>
                <p className="text-xs text-muted-foreground">Geração inteligente de conteúdo</p>
              </div>
            </div>
          </div>
        </div>

        {/* Floating background elements */}
        <div className="absolute top-10 right-20 w-20 h-20 bg-primary/5 rounded-full animate-float opacity-50" />
        <div className="absolute bottom-10 left-20 w-16 h-16 bg-accent/5 rounded-full animate-float [animation-delay:1s] opacity-40" />
      </div>

      {/* Enhanced Content */}
      <div className="flex-1 p-8 max-w-4xl mx-auto w-full">
        <Card className="p-8 shadow-2xl border-border/50 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
          <div className="space-y-8">
            {/* Title and New Project Button */}
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">
                  {hasExistingFiles ? '✨ Editar Website' : '🚀 Descreva seu website'}
                </h2>
                <p className="text-muted-foreground max-w-2xl">
                  {hasExistingFiles 
                    ? 'Descreva EXATAMENTE o que você quer alterar. Seja específico para obter os melhores resultados.'
                    : 'Descreva sua ideia de website e eu vou gerar um arquivo HTML completo com todos os recursos integrados.'
                  }
                </p>
              </div>
              {hasExistingFiles && onNewProject && (
                <Button
                  variant="outline"
                  onClick={onNewProject}
                  className="gap-2 hover:bg-primary/10 hover:border-primary/30 transition-all duration-300"
                >
                  <Plus className="w-4 h-4" />
                  Novo Projeto
                </Button>
              )}
            </div>

            {/* Suggestion Examples */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                💡 Exemplos de prompts:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {suggestionExamples.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => setPrompt(example)}
                    className="p-3 text-left text-sm bg-muted/30 hover:bg-muted/50 rounded-lg border border-border/50 hover:border-primary/30 transition-all duration-300 group"
                  >
                    <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                      "{example}"
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Enhanced Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative group">
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={hasExistingFiles 
                    ? "Ex: Altere a cor do botão principal para azul royal e adicione um efeito de hover suave..."
                    : "Ex: Crie uma landing page moderna para uma startup de IA com seções hero, recursos, depoimentos e contato. Use cores azul e branco com design minimalista..."
                  }
                  className="min-h-[200px] resize-none text-base leading-relaxed bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all duration-300 group-hover:border-border/70"
                  disabled={isLoading}
                />
                <div className="absolute bottom-3 right-3 text-xs text-muted-foreground">
                  {prompt.length}/2000
                </div>
              </div>
              
              <Button 
                type="submit" 
                disabled={!prompt.trim() || isLoading}
                className="w-full h-14 bg-gradient-to-r from-primary via-accent to-primary hover:opacity-90 transition-all duration-500 gap-3 text-base font-semibold shadow-xl hover:shadow-2xl hover:scale-[1.02] transform"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="animate-pulse">
                      {hasExistingFiles ? '⚡ Aplicando Alteração...' : '🎨 Gerando Website...'}
                    </span>
                  </>
                ) : (
                  <>
                    {hasExistingFiles ? <Edit className="w-5 h-5" /> : <Send className="w-5 h-5" />}
                    {hasExistingFiles ? '✨ Aplicar Alteração' : '🚀 Gerar Website'}
                  </>
                )}
              </Button>

              {/* Tips */}
              <div className="text-center space-y-2">
                <p className="text-xs text-muted-foreground">
                  💡 Dica: Seja específico sobre cores, layout e funcionalidades desejadas
                </p>
                <p className="text-xs text-muted-foreground/70">
                  ⚡ Tempo estimado: 30-60 segundos
                </p>
              </div>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
};
