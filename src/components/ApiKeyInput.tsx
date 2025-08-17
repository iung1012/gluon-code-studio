
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Key, Eye, EyeOff, MessageCircle, Sparkles, Code } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ApiKeyInputProps {
  onApiKeySubmit: (apiKey: string) => void;
}

export const ApiKeyInput = ({ onApiKeySubmit }: ApiKeyInputProps) => {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      toast({
        title: "Chave API Obrigatória",
        description: "Por favor, insira sua chave API para continuar.",
        variant: "destructive"
      });
      return;
    }
    onApiKeySubmit(apiKey.trim());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/5 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-primary/3 to-accent/3 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative backdrop-blur-sm bg-card/80 border-border/50 shadow-2xl">
        <CardHeader className="text-center pb-8">
          {/* Logo/Brand section */}
          <div className="relative mx-auto mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary via-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25">
              <div className="relative">
                <Code className="w-8 h-8 text-primary-foreground" />
                <Sparkles className="w-4 h-4 text-primary-foreground absolute -top-1 -right-1 animate-pulse" />
              </div>
            </div>
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full blur-lg -z-10" />
          </div>
          
          {/* Brand name */}
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              CoderIA
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground/80">
              Crie websites incríveis com inteligência artificial
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <label htmlFor="api-key" className="text-sm font-medium text-foreground/90">
                Chave da API
              </label>
              <div className="relative group">
                <Input
                  id="api-key"
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="pr-12 h-12 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all duration-200"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 hover:bg-muted/50 transition-colors"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? (
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground/70 flex items-center gap-1">
                <Key className="w-3 h-3" />
                Sua chave é armazenada localmente e nunca enviada aos nossos servidores
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground font-medium shadow-lg shadow-primary/25 transition-all duration-200 hover:shadow-xl hover:shadow-primary/30"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Começar a Criar
            </Button>
            
            <div className="pt-4 border-t border-border/30">
              <Button
                variant="ghost"
                size="sm"
                className="w-full gap-2 text-muted-foreground/80 hover:text-foreground hover:bg-muted/50 transition-colors"
                onClick={() => window.open('https://t.me/coder_ai1', '_blank')}
              >
                <MessageCircle className="w-4 h-4" />
                Precisa de ajuda? Fale comigo no Telegram
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
