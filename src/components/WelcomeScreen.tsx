import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Send, Sparkles, Loader2, Code, Smartphone, Monitor, Tablet } from "lucide-react";

interface WelcomeScreenProps {
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
}

export const WelcomeScreen = ({ onSubmit, isLoading }: WelcomeScreenProps) => {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isLoading) {
      onSubmit(prompt.trim());
    }
  };

  const examples = [
    "Criar uma landing page moderna para startup de tecnologia com seções hero, recursos, preços e contato",
    "Desenvolver um dashboard administrativo com gráficos, tabelas e métricas em tempo real",
    "Construir um portfólio pessoal responsivo com galeria de projetos e formulário de contato",
    "Fazer um e-commerce simples com catálogo de produtos, carrinho e checkout",
    "Criar um blog moderno com sistema de posts, categorias e busca"
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="w-full max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-6">
            <Code className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Studio de Desenvolvimento
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Crie websites completos com personalização avançada via CSS, JavaScript e Node.js
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="p-6 text-center border-primary/20">
            <Monitor className="w-10 h-10 mx-auto mb-4 text-primary" />
            <h3 className="font-semibold mb-2">Preview Responsivo</h3>
            <p className="text-sm text-muted-foreground">
              Visualize como ficará em desktop, tablet e mobile
            </p>
          </Card>
          <Card className="p-6 text-center border-primary/20">
            <Sparkles className="w-10 h-10 mx-auto mb-4 text-primary" />
            <h3 className="font-semibold mb-2">IA Avançada</h3>
            <p className="text-sm text-muted-foreground">
              Gera código CSS, JavaScript e Node.js personalizado
            </p>
          </Card>
          <Card className="p-6 text-center border-primary/20">
            <Send className="w-10 h-10 mx-auto mb-4 text-primary" />
            <h3 className="font-semibold mb-2">Download Direto</h3>
            <p className="text-sm text-muted-foreground">
              Baixe e modifique o projeto conforme necessário
            </p>
          </Card>
        </div>

        {/* Main Input */}
        <Card className="p-8 border-primary/20 bg-card/50 backdrop-blur">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-lg font-medium block mb-4">
                Descreva seu projeto em detalhes:
              </label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ex: Criar uma landing page moderna para uma empresa de consultoria, com seção hero animada, apresentação dos serviços com ícones, depoimentos de clientes em carrossel, formulário de contato e footer completo. Usar cores azul e branco, design minimalista e animações sutis."
                className="min-h-[120px] resize-none text-base"
                disabled={isLoading}
              />
            </div>
            
            <Button 
              type="submit" 
              disabled={!prompt.trim() || isLoading}
              className="w-full h-12 text-lg bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                  Gerando projeto...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-3" />
                  Gerar Website Completo
                </>
              )}
            </Button>
          </form>

          {/* Examples */}
          <div className="mt-8">
            <h3 className="font-medium mb-4 text-muted-foreground">Exemplos de projetos:</h3>
            <div className="grid gap-3">
              {examples.map((example, index) => (
                <Card 
                  key={index}
                  className="p-4 cursor-pointer hover:bg-primary/5 hover:border-primary/30 transition-all border-border/50 text-sm"
                  onClick={() => setPrompt(example)}
                >
                  {example}
                </Card>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};