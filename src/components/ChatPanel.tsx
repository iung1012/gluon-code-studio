
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Image, Paperclip, Plus } from "lucide-react";
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

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [inputValue]);

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
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Website atualizado com sucesso! As alterações foram aplicadas.",
        sender: 'ai',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Não foi possível processar sua solicitação. Tente novamente.",
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
    <div className="h-full flex flex-col bg-background/80 backdrop-blur-xl border-r border-border/20">
      {/* Apple-style Header */}
      <div className="px-6 py-6 border-b border-border/10 bg-card/20 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center ring-1 ring-border/20">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full ring-2 ring-background" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-foreground tracking-tight">Assistente IA</h3>
            <p className="text-sm text-muted-foreground/80 font-medium">Online • Pronto para ajudar</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 px-4 py-6" ref={scrollAreaRef}>
        <div className="space-y-6 max-w-none">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="relative mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center mb-4">
                  <Bot className="w-8 h-8 text-primary" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary/10 rounded-full animate-pulse" />
              </div>
              <div className="space-y-3">
                <h4 className="text-xl font-semibold text-foreground tracking-tight">Como posso ajudar?</h4>
                <p className="text-base text-muted-foreground/80 max-w-sm leading-relaxed">
                  Faça alterações no seu website, adicione funcionalidades ou peça sugestões.
                </p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-4 items-start max-w-full group",
                  message.sender === 'user' ? "flex-row-reverse" : "flex-row"
                )}
              >
                {/* Avatar */}
                <div className={cn(
                  "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ring-2 ring-background shadow-sm",
                  message.sender === 'user' 
                    ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground"
                    : "bg-gradient-to-br from-muted to-muted/60 text-muted-foreground"
                )}>
                  {message.sender === 'user' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>
                
                {/* Message Bubble */}
                <div className={cn(
                  "flex flex-col max-w-[85%] min-w-0",
                  message.sender === 'user' ? "items-end" : "items-start"
                )}>
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-3 shadow-sm ring-1 backdrop-blur-sm transition-all duration-200 group-hover:shadow-md",
                      message.sender === 'user'
                        ? "bg-primary text-primary-foreground ring-primary/20 rounded-br-md"
                        : "bg-card/60 text-card-foreground ring-border/20 rounded-bl-md"
                    )}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words font-medium">
                      {message.content}
                    </p>
                  </div>
                  <p className={cn(
                    "text-xs text-muted-foreground/60 mt-2 px-2 font-medium",
                    message.sender === 'user' ? "text-right" : "text-left"
                  )}>
                    {message.timestamp.toLocaleTimeString('pt-BR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
          
          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-muted to-muted/60 rounded-full flex items-center justify-center ring-2 ring-background shadow-sm">
                <Bot className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="bg-card/60 rounded-2xl rounded-bl-md px-4 py-4 ring-1 ring-border/20 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-sm text-muted-foreground font-medium">Processando...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Modern Apple-style Input Area */}
      <div className="p-6 border-t border-border/5 bg-gradient-to-t from-card/30 to-card/10 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Main Input Container */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/3 to-primary/5 rounded-3xl blur-xl opacity-0 group-focus-within:opacity-100 transition-all duration-500" />
            <div className="relative bg-background/90 backdrop-blur-xl rounded-3xl border border-border/30 shadow-lg transition-all duration-300 hover:shadow-xl focus-within:shadow-xl focus-within:border-primary/40 focus-within:bg-background/95 group">
              <div className="flex items-end p-4 gap-3">
                {/* Action Buttons */}
                <div className="flex gap-2 items-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-9 h-9 p-0 rounded-full bg-muted/40 hover:bg-muted/60 border border-border/20 transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    <Plus className="w-4 h-4 text-muted-foreground" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-9 h-9 p-0 rounded-full bg-muted/40 hover:bg-muted/60 border border-border/20 transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    <Image className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>
                
                {/* Enhanced Textarea */}
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Digite sua mensagem..."
                    className="w-full bg-transparent border-0 outline-none resize-none text-base placeholder:text-muted-foreground/50 min-h-[28px] max-h-[120px] py-2 px-1 leading-7 font-medium text-foreground selection:bg-primary/20"
                    disabled={isLoading}
                    rows={1}
                    style={{ 
                      height: 'auto',
                      lineHeight: '1.75rem'
                    }}
                  />
                </div>
                
                {/* Enhanced Send Button */}
                <Button
                  type="submit"
                  size="sm"
                  className={cn(
                    "w-10 h-10 p-0 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95 border-0",
                    inputValue.trim() && !isLoading
                      ? "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-primary/25"
                      : "bg-muted/60 text-muted-foreground cursor-not-allowed opacity-50"
                  )}
                  disabled={!inputValue.trim() || isLoading}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Enhanced Hint Text */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/60">
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-muted/30 rounded-md border border-border/20 font-mono text-xs">⏎</kbd>
              <span>Enviar</span>
            </div>
            <span className="text-muted-foreground/40">•</span>
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-muted/30 rounded-md border border-border/20 font-mono text-xs">⇧⏎</kbd>
              <span>Nova linha</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
