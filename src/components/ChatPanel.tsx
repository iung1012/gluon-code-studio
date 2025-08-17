import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Image, X, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { VersionButton } from "./VersionButton";

interface WebsiteVersion {
  id: string;
  content: string;
  timestamp: Date;
  versionNumber: number;
}

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  images?: string[];
  websiteVersion?: WebsiteVersion;
}

interface ChatPanelProps {
  onSendMessage: (message: string, images?: string[], model?: 'basic' | 'pro') => Promise<void>;
  isLoading: boolean;
  initialMessages?: Message[];
  websiteVersions?: WebsiteVersion[];
  currentVersionId?: string;
  onRestoreVersion?: (versionId: string) => void;
}

export const ChatPanel = ({ 
  onSendMessage, 
  isLoading, 
  initialMessages = [],
  websiteVersions = [],
  currentVersionId,
  onRestoreVersion
}: ChatPanelProps) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [modelType, setModelType] = useState<'basic' | 'pro'>('basic');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update messages when new website version is created
  useEffect(() => {
    if (websiteVersions.length > messages.filter(m => m.websiteVersion).length) {
      // New version was created, add it to the last AI message
      // Using reverse iteration instead of findLastIndex for compatibility
      let lastAiMessageIndex = -1;
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].sender === 'ai') {
          lastAiMessageIndex = i;
          break;
        }
      }
      
      if (lastAiMessageIndex >= 0) {
        const latestVersion = websiteVersions[websiteVersions.length - 1];
        setMessages(prev => {
          const updated = [...prev];
          updated[lastAiMessageIndex] = {
            ...updated[lastAiMessageIndex],
            websiteVersion: latestVersion
          };
          return updated;
        });
      }
    }
  }, [websiteVersions, messages]);

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

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          setSelectedImages(prev => [...prev, result]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputValue.trim() && selectedImages.length === 0) || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      sender: 'user',
      timestamp: new Date(),
      images: selectedImages.length > 0 ? [...selectedImages] : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setSelectedImages([]);

    try {
      await onSendMessage(userMessage.content, userMessage.images, modelType);
      
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

  const handleRestoreVersion = (versionId: string) => {
    if (onRestoreVersion) {
      onRestoreVersion(versionId);
    }
  };

  return (
    <div className="h-full flex flex-col bg-background border-r border-border">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">Assistente IA</h3>
            <p className="text-sm text-muted-foreground">Online</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 px-4 py-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Bot className="w-6 h-6 text-primary" />
              </div>
              <h4 className="text-lg font-medium text-foreground mb-2">Como posso ajudar?</h4>
              <p className="text-sm text-muted-foreground max-w-sm">
                Faça alterações no seu website, adicione funcionalidades ou peça sugestões.
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3 items-start",
                  message.sender === 'user' ? "flex-row-reverse" : "flex-row"
                )}
              >
                {/* Avatar */}
                <div className={cn(
                  "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                  message.sender === 'user' 
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}>
                  {message.sender === 'user' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>
                
                {/* Message Bubble */}
                <div className={cn(
                  "flex flex-col max-w-[80%]",
                  message.sender === 'user' ? "items-end" : "items-start"
                )}>
                  <div
                    className={cn(
                      "rounded-lg px-3 py-2 text-sm",
                      message.sender === 'user'
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {/* Images */}
                    {message.images && message.images.length > 0 && (
                      <div className="mb-2 space-y-2">
                        {message.images.map((image, index) => (
                          <img
                            key={index}
                            src={image}
                            alt={`Imagem ${index + 1}`}
                            className="max-w-[200px] rounded-md"
                          />
                        ))}
                      </div>
                    )}
                    {message.content && <p className="whitespace-pre-wrap">{message.content}</p>}
                  </div>
                  
                  {/* Version Button for AI messages */}
                  {message.sender === 'ai' && message.websiteVersion && (
                    <VersionButton
                      versionNumber={message.websiteVersion.versionNumber}
                      isActive={currentVersionId === message.websiteVersion.id}
                      onRestore={() => handleRestoreVersion(message.websiteVersion!.id)}
                      timestamp={message.websiteVersion.timestamp}
                    />
                  )}
                  
                  <p className="text-xs text-muted-foreground mt-1">
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
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="bg-muted rounded-lg px-3 py-2">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-pulse" />
                  <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t border-border">
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Image Preview */}
          {selectedImages.length > 0 && (
            <div className="flex flex-wrap gap-2 p-2 bg-muted/30 rounded-lg">
              {selectedImages.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={image}
                    alt={`Preview ${index + 1}`}
                    className="w-16 h-16 object-cover rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs hover:bg-destructive/80"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Model Selection - positioned above textarea */}
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant={modelType === 'pro' ? "default" : "outline"}
              size="sm"
              onClick={() => setModelType(modelType === 'basic' ? 'pro' : 'basic')}
              className="gap-2 text-xs h-7"
              disabled={isLoading}
            >
              <Zap className="w-3 h-3" />
              {modelType === 'pro' ? 'PRO' : 'BASIC'}
            </Button>
            
            <p className="text-xs text-muted-foreground">
              {modelType === 'basic' ? 'GLM-4.5' : 'GLM-4.5-X'}
            </p>
          </div>

          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua mensagem..."
              className="min-h-[44px] pr-20 resize-none bg-background border-border focus:border-primary focus:ring-primary/20"
              disabled={isLoading}
              rows={1}
            />
            <div className="absolute bottom-2 right-2 flex items-center gap-1">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 hover:bg-muted"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
                <Image className="w-4 h-4" />
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={(!inputValue.trim() && selectedImages.length === 0) || isLoading}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Keyboard Shortcuts */}
          <div className="flex justify-end">
            <p className="text-xs text-muted-foreground">
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Enter</kbd> para enviar • <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Shift + Enter</kbd> para nova linha
            </p>
          </div>
        </form>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageSelect}
          className="hidden"
        />
      </div>
    </div>
  );
};
