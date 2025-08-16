import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Bot, Copy, Check, Sparkles, Code, Globe } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
  metadata?: {
    filesGenerated?: number;
    generationTime?: number;
    model?: string;
  };
}

interface ChatHistoryProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  className?: string;
}

export const ChatHistory = ({ messages, isLoading, className }: ChatHistoryProps) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isLoading]);

  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(messageId);
      setTimeout(() => setCopiedId(null), 2000);
      toast({
        title: "Copiado!",
        description: "Mensagem copiada para a área de transferência.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar a mensagem.",
        variant: "destructive"
      });
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderCodeBlocks = (content: string) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.slice(lastIndex, match.index)
        });
      }

      // Add code block
      parts.push({
        type: 'code',
        language: match[1] || 'text',
        content: match[2].trim()
      });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.slice(lastIndex)
      });
    }

    return parts.length > 0 ? parts : [{ type: 'text', content }];
  };

  const LoadingIndicator = () => (
    <div className="flex items-center space-x-2 text-muted-foreground">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
      </div>
      <span className="text-sm">A IA está gerando seu site...</span>
    </div>
  );

  if (messages.length === 0 && !isLoading) {
    return (
      <div className={cn("h-full flex items-center justify-center", className)}>
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-medium mb-2">Inicie uma conversa</h3>
          <p className="text-muted-foreground text-sm">
            Descreva o site que você quer criar e comece a conversar com a IA
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("h-full flex flex-col", className)}>
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        <div className="space-y-6">
          {messages.map((message) => (
            <div key={message.id} className="group">
              <div className={cn(
                "flex gap-3",
                message.type === 'user' ? "justify-end" : "justify-start"
              )}>
                {message.type === 'assistant' && (
                  <Avatar className="w-8 h-8 border-2 border-primary/20">
                    <div className="w-full h-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <Bot className="w-4 h-4 text-primary-foreground" />
                    </div>
                  </Avatar>
                )}

                <div className={cn(
                  "max-w-[80%] space-y-2",
                  message.type === 'user' && "flex flex-col items-end"
                )}>
                  {/* Message bubble */}
                  <Card className={cn(
                    "relative",
                    message.type === 'user' 
                      ? "bg-gradient-to-r from-primary to-accent text-primary-foreground" 
                      : "bg-muted/50 border-border/50",
                    message.status === 'sending' && "opacity-70",
                    message.status === 'error' && "border-destructive/50 bg-destructive/10"
                  )}>
                    <CardContent className="p-4">
                      {message.type === 'assistant' ? (
                        <div className="space-y-3">
                          {renderCodeBlocks(message.content).map((part, index) => 
                            part.type === 'code' ? (
                              <div key={index} className="relative">
                                <SyntaxHighlighter
                                  language={part.language}
                                  style={oneDark}
                                  customStyle={{
                                    margin: 0,
                                    borderRadius: '0.5rem',
                                    fontSize: '13px',
                                  }}
                                  showLineNumbers
                                >
                                  {part.content}
                                </SyntaxHighlighter>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  className="absolute top-2 right-2 h-6 px-2"
                                  onClick={() => copyToClipboard(part.content, `${message.id}-code-${index}`)}
                                >
                                  {copiedId === `${message.id}-code-${index}` ? (
                                    <Check className="w-3 h-3" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </Button>
                              </div>
                            ) : (
                              <p key={index} className="text-sm leading-relaxed whitespace-pre-wrap">
                                {part.content}
                              </p>
                            )
                          )}
                        </div>
                      ) : (
                        <p className="text-sm leading-relaxed">{message.content}</p>
                      )}

                      {/* Copy button for text messages */}
                      {message.type !== 'user' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => copyToClipboard(message.content, message.id)}
                        >
                          {copiedId === message.id ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      )}
                    </CardContent>
                  </Card>

                  {/* Metadata */}
                  <div className={cn(
                    "flex items-center gap-2 text-xs text-muted-foreground",
                    message.type === 'user' ? "justify-end" : "justify-start"
                  )}>
                    <span>{formatTime(message.timestamp)}</span>
                    
                    {message.status === 'sending' && (
                      <Badge variant="outline" className="h-5">
                        Enviando...
                      </Badge>
                    )}
                    
                    {message.status === 'error' && (
                      <Badge variant="destructive" className="h-5">
                        Erro
                      </Badge>
                    )}

                    {message.metadata?.filesGenerated && (
                      <Badge variant="secondary" className="h-5 gap-1">
                        <Code className="w-3 h-3" />
                        {message.metadata.filesGenerated} arquivos
                      </Badge>
                    )}

                    {message.metadata?.generationTime && (
                      <Badge variant="secondary" className="h-5 gap-1">
                        <Globe className="w-3 h-3" />
                        {message.metadata.generationTime}s
                      </Badge>
                    )}
                  </div>
                </div>

                {message.type === 'user' && (
                  <Avatar className="w-8 h-8 border-2 border-primary/20">
                    <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/20 flex items-center justify-center">
                      <User className="w-4 h-4 text-foreground" />
                    </div>
                  </Avatar>
                )}
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <Avatar className="w-8 h-8 border-2 border-primary/20">
                <div className="w-full h-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
              </Avatar>
              <Card className="bg-muted/50 border-border/50">
                <CardContent className="p-4">
                  <LoadingIndicator />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};