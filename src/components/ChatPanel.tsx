
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Image as ImageIcon, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  elementContext?: {
    selector: string;
    type: string;
    text?: string;
  };
  images?: string[];
}

interface SelectedElement {
  element: HTMLElement;
  selector: string;
  type: string;
  text?: string;
  position: { x: number; y: number; width: number; height: number };
}

interface ChatPanelProps {
  onSendMessage: (message: string, elementContext?: SelectedElement, images?: string[]) => Promise<void>;
  isLoading: boolean;
  initialMessages?: Message[];
  selectedElement?: SelectedElement | null;
  isChatMode?: boolean;
  onToggleChatMode?: () => void;
}

export const ChatPanel = ({ 
  onSendMessage, 
  isLoading, 
  initialMessages = [], 
  selectedElement,
  isChatMode = false,
  onToggleChatMode
}: ChatPanelProps) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
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
      content: inputValue.trim() || "Imagem enviada",
      sender: 'user',
      timestamp: new Date(),
      elementContext: selectedElement ? {
        selector: selectedElement.selector,
        type: selectedElement.type,
        text: selectedElement.text
      } : undefined,
      images: selectedImages.length > 0 ? [...selectedImages] : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    const imagesToSend = [...selectedImages];
    setSelectedImages([]);

    try {
      await onSendMessage(userMessage.content, selectedElement || undefined, imagesToSend);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: selectedElement 
          ? `Elemento ${selectedElement.type} "${selectedElement.text}" foi atualizado com sucesso!`
          : "Website atualizado com sucesso! As alterações foram aplicadas.",
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

  const getPlaceholderText = () => {
    if (selectedElement) {
      return `Alterar ${selectedElement.type}: "${selectedElement.text?.substring(0, 30)}${selectedElement.text && selectedElement.text.length > 30 ? '...' : ''}"`;
    }
    return isChatMode ? "Converse com a IA sobre melhorias..." : "Descreva as alterações...";
  };

  return (
    <div className="h-full flex flex-col bg-card/30 backdrop-blur-sm border-r border-border/50">
      {/* Header */}
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-base">Assistente</h3>
              <p className="text-sm text-muted-foreground">
                {isChatMode ? 'Modo Conversa' : 'IA para edições'}
              </p>
            </div>
          </div>
          
          {onToggleChatMode && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleChatMode}
              className={cn(
                "gap-2 transition-colors",
                isChatMode ? "text-purple-600 bg-purple-100 hover:bg-purple-200" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <MessageSquare className="w-4 h-4" />
              Chat
            </Button>
          )}
        </div>
      </div>

      {/* Selected Element Context */}
      {selectedElement && (
        <div className="p-4 bg-purple-50 border-b border-border/50">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
            <span className="font-medium text-purple-800">
              {selectedElement.type} selecionado
            </span>
          </div>
          <p className="text-xs text-purple-600 mt-1 truncate">
            "{selectedElement.text}"
          </p>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Bot className="w-6 h-6 text-primary" />
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Como posso ajudar?</h4>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  {isChatMode 
                    ? "Converse comigo sobre melhorias para seu website."
                    : "Selecione um elemento na página ou descreva as alterações desejadas."
                  }
                </p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3 max-w-full",
                  message.sender === 'user' ? "justify-end" : "justify-start"
                )}
              >
                {message.sender === 'ai' && (
                  <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-3.5 h-3.5 text-primary" />
                  </div>
                )}
                
                <div
                  className={cn(
                    "rounded-2xl px-4 py-3 text-sm max-w-[80%]",
                    message.sender === 'user'
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 text-foreground border border-border/30"
                  )}
                >
                  {message.elementContext && (
                    <div className="text-xs opacity-70 mb-2 p-2 bg-black/10 rounded">
                      📍 {message.elementContext.type}: "{message.elementContext.text}"
                    </div>
                  )}
                  
                  {message.images && message.images.length > 0 && (
                    <div className="grid grid-cols-1 gap-2 mb-2">
                      {message.images.map((img, idx) => (
                        <img 
                          key={idx} 
                          src={img} 
                          alt="Uploaded" 
                          className="max-w-full h-auto rounded-lg"
                        />
                      ))}
                    </div>
                  )}
                  
                  <p className="whitespace-pre-wrap break-words">{message.content}</p>
                  <p className="text-xs opacity-60 mt-1">
                    {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {message.sender === 'user' && (
                  <div className="w-7 h-7 bg-muted/50 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="bg-muted/50 rounded-2xl px-4 py-3 text-sm border border-border/30">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                  <span className="text-xs text-muted-foreground">Processando...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-6 border-t border-border/50">
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Image Preview */}
          {selectedImages.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedImages.map((img, index) => (
                <div key={index} className="relative">
                  <img 
                    src={img} 
                    alt="Preview" 
                    className="w-16 h-16 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="relative">
            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={getPlaceholderText()}
              className="min-h-[60px] max-h-[120px] pr-20 text-sm resize-none border-border/50 bg-background/50 focus:ring-primary/10 focus:border-primary/50"
              disabled={isLoading}
            />
            
            <div className="absolute bottom-2 right-2 flex gap-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageUpload}
              />
              
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
                <ImageIcon className="w-3.5 h-3.5" />
              </Button>
              
              <Button
                type="submit"
                size="icon"
                className="h-7 w-7 bg-primary hover:bg-primary/90"
                disabled={(!inputValue.trim() && selectedImages.length === 0) || isLoading}
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </form>
      </div>

      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleImageUpload} />
    </div>
  );
};
