
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface ChatPanelProps {
  onSendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
  initialMessages?: Message[];
}

export const ChatPanel = ({ onSendMessage, isLoading, initialMessages = [] }: ChatPanelProps) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");

    try {
      await onSendMessage(userMessage.content);
      
      // Add AI response (this will be handled by the parent component)
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "✨ Website atualizado com sucesso! As alterações foram aplicadas.",
        sender: 'ai',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "❌ Desculpe, não consegui processar sua solicitação. Tente novamente em alguns instantes.",
        sender: 'ai',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-card to-card/80 backdrop-blur-sm border-r border-border/50">
      {/* Enhanced Header */}
      <div className="p-6 border-b border-border/50 bg-gradient-to-r from-primary/10 to-accent/10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg">
              <Bot className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-card animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-base">🤖 Assistente IA</h3>
            <p className="text-sm text-muted-foreground">Faça alterações em tempo real</p>
          </div>
        </div>
      </div>

      {/* Enhanced Messages */}
      <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
        <div className="space-y-6">
          {messages.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="relative mx-auto w-16 h-16">
                <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                  <span className="text-xs">✨</span>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-lg">Pronto para ajudar!</h4>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                  Peça para modificar cores, textos, layout ou adicionar novos recursos ao seu website.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center max-w-sm mx-auto">
                {[
                  "Mude a cor do botão",
                  "Adicione uma seção",
                  "Altere o texto"
                ].map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => setInputValue(suggestion)}
                    className="px-3 py-1.5 text-xs bg-muted/50 hover:bg-muted rounded-full border border-border/50 hover:border-primary/30 transition-all duration-300"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-4 max-w-full group",
                  message.sender === 'user' ? "justify-end" : "justify-start"
                )}
              >
                {message.sender === 'ai' && (
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center flex-shrink-0 mt-1 shadow-md">
                    <Bot className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
                
                <div
                  className={cn(
                    "rounded-2xl px-4 py-3 text-sm max-w-[85%] shadow-sm transition-all duration-300 group-hover:shadow-md",
                    message.sender === 'user'
                      ? "bg-gradient-to-br from-primary to-accent text-primary-foreground ml-12"
                      : "bg-gradient-to-br from-muted/80 to-muted/60 text-foreground border border-border/30"
                  )}
                >
                  <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
                  <p className="text-xs opacity-70 mt-2 font-medium">
                    {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {message.sender === 'user' && (
                  <div className="w-8 h-8 bg-gradient-to-br from-accent/80 to-accent rounded-xl flex items-center justify-center flex-shrink-0 mt-1 shadow-md">
                    <User className="w-4 h-4 text-accent-foreground" />
                  </div>
                )}
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="flex gap-4 justify-start">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center flex-shrink-0 mt-1 shadow-md">
                <Bot className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="bg-gradient-to-br from-muted/80 to-muted/60 rounded-2xl px-4 py-3 text-sm border border-border/30">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">Processando...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Enhanced Input */}
      <div className="p-6 border-t border-border/50 bg-gradient-to-r from-card/50 to-card/30">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative group">
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Descreva as alterações que deseja fazer..."
              className="min-h-[80px] max-h-[160px] pr-14 text-sm resize-none bg-background/50 border-border/50 focus:ring-primary/20 focus:border-primary/50 transition-all duration-300 rounded-xl"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              className="absolute bottom-3 right-3 h-8 w-8 rounded-lg bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all duration-300 shadow-md hover:shadow-lg"
              disabled={!inputValue.trim() || isLoading}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border">Enter</kbd> para enviar, 
              <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border ml-1">Shift+Enter</kbd> para quebrar linha
            </p>
            <div className="text-xs text-muted-foreground">
              {inputValue.length}/500
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
