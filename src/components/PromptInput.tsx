import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Send, Sparkles, Loader2 } from "lucide-react";
import { ChatHistory, ChatMessage } from "./ChatHistory";
import { LoadingAnimation } from "./LoadingAnimation";
import { cn } from "@/lib/utils";

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
  className?: string;
}

export const PromptInput = ({ onSubmit, isLoading, className }: PromptInputProps) => {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Load chat history from localStorage
  useEffect(() => {
    const savedMessages = localStorage.getItem("chat-messages");
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        setMessages(parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })));
      } catch (error) {
        console.error("Error loading chat history:", error);
      }
    }
  }, []);

  // Save messages to localStorage
  const saveMessages = (newMessages: ChatMessage[]) => {
    setMessages(newMessages);
    localStorage.setItem("chat-messages", JSON.stringify(newMessages));
  };

  // Simulate loading progress
  useEffect(() => {
    if (isLoading) {
      setLoadingProgress(0);
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + Math.random() * 15;
        });
      }, 500);
      
      return () => clearInterval(interval);
    } else {
      setLoadingProgress(100);
      setTimeout(() => setLoadingProgress(0), 1000);
    }
  }, [isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isLoading) {
      // Add user message
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'user',
        content: prompt.trim(),
        timestamp: new Date(),
        status: 'sent'
      };

      const newMessages = [...messages, userMessage];
      saveMessages(newMessages);
      
      // Clear input
      const currentPrompt = prompt.trim();
      setPrompt("");
      
      // Submit to parent
      onSubmit(currentPrompt);
    }
  };

  // Add AI response when generation completes
  useEffect(() => {
    if (!isLoading && loadingProgress === 100 && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.type === 'user') {
        // Add AI response
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: "Site gerado com sucesso! Verifique o preview e o código gerado nas abas ao lado.",
          timestamp: new Date(),
          status: 'sent',
          metadata: {
            filesGenerated: 5,
            generationTime: 3.2,
            model: 'GLM-4'
          }
        };

        const newMessages = [...messages, aiMessage];
        saveMessages(newMessages);
      }
    }
  }, [isLoading, loadingProgress, messages]);

  if (isLoading && loadingProgress < 100) {
    return (
      <div className={cn("h-full flex items-center justify-center", className)}>
        <LoadingAnimation
          type="code-generation"
          message="Gerando seu site personalizado"
          submessage="Criando HTML, CSS, JavaScript e configurações de backend com IA avançada"
          progress={loadingProgress}
        />
      </div>
    );
  }

  return (
    <div className={cn("h-full flex flex-col", className)}>
      <ResizablePanelGroup direction="vertical" className="h-full">
        {/* Chat History */}
        <ResizablePanel defaultSize={70} minSize={50}>
          <ChatHistory 
            messages={messages} 
            isLoading={isLoading}
          />
        </ResizablePanel>
        
        <ResizableHandle />
        
        {/* Input Area */}
        <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Gerador de Sites IA</h3>
                <p className="text-xs text-muted-foreground">Descreva seu site e deixe a IA criar</p>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              {[
                "Crie um dashboard moderno com gráficos interativos",
                "Site de portfólio para desenvolvedor com dark theme",
                "E-commerce de produtos tecnológicos com carrinho",
              ].map((example, index) => (
                <Card 
                  key={index}
                  className="p-3 cursor-pointer hover:bg-accent/50 transition-colors border-border/50 text-xs"
                  onClick={() => setPrompt(example)}
                >
                  {example}
                </Card>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Descreva detalhadamente o site que você quer criar..."
                className="resize-none bg-muted/30 border-border/50 focus:border-primary/50 transition-colors text-sm"
                rows={3}
                disabled={isLoading}
              />
              
              <Button 
                type="submit" 
                disabled={!prompt.trim() || isLoading}
                className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                size="sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Gerar Site
                  </>
                )}
              </Button>
            </form>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};