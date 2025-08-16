import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Sparkles, Code, Globe } from "lucide-react";

interface WelcomeScreenProps {
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
}

export const WelcomeScreen = ({ onSubmit, isLoading }: WelcomeScreenProps) => {
  const [prompt, setPrompt] = useState("");

  const examplePrompts = [
    "Crie um dashboard moderno com gráficos e métricas",
    "Site de portfólio para designer com animações",
    "E-commerce de roupas com carrinho de compras",
    "Landing page para startup de tecnologia"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isLoading) {
      onSubmit(prompt.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-2xl mb-6 shadow-glow">
            <Sparkles className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent mb-4">
            Crie Sites Incríveis
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Descreva sua ideia e deixe a IA criar um site completo com HTML, CSS, JavaScript e Node.js
          </p>
        </div>

        {/* Main Input */}
        <Card className="mb-8 shadow-elevated border-border/50">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Descreva o site que você quer criar... Ex: 'Um dashboard para gerenciar vendas com gráficos em tempo real'"
                  className="min-h-[120px] text-lg resize-none border-border/50 focus:border-primary focus:ring-primary/20"
                  disabled={isLoading}
                />
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={!prompt.trim() || isLoading}
                  className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 px-8 py-6 text-lg"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Gerar Site
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Example Prompts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          {examplePrompts.map((example, index) => (
            <Card
              key={index}
              className="cursor-pointer border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-glow group"
              onClick={() => setPrompt(example)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    {index % 2 === 0 ? (
                      <Code className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                    ) : (
                      <Globe className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    {example}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="space-y-2">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto">
              <Code className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold">Código Avançado</h3>
            <p className="text-sm text-muted-foreground">HTML, CSS, JavaScript e Node.js personalizados</p>
          </div>
          <div className="space-y-2">
            <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mx-auto">
              <Globe className="w-6 h-6 text-accent" />
            </div>
            <h3 className="font-semibold">Preview ao Vivo</h3>
            <p className="text-sm text-muted-foreground">Visualize seu site funcionando em tempo real</p>
          </div>
          <div className="space-y-2">
            <div className="w-12 h-12 bg-secondary/50 rounded-xl flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold">Download Completo</h3>
            <p className="text-sm text-muted-foreground">Baixe e modifique como quiser</p>
          </div>
        </div>
      </div>
    </div>
  );
};