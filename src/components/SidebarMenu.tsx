import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { 
  History, 
  Plus, 
  Trash2, 
  Calendar,
  Code,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatHistory {
  id: string;
  title: string;
  date: string;
  preview: string;
}

interface SidebarMenuProps {
  onNewChat: () => void;
  onSelectChat: (chatId: string) => void;
  currentChatId?: string;
}

export const SidebarMenu = ({ onNewChat, onSelectChat, currentChatId }: SidebarMenuProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);

  useEffect(() => {
    // Carregar histórico do localStorage
    const savedHistory = localStorage.getItem('chatHistory');
    if (savedHistory) {
      setChatHistory(JSON.parse(savedHistory));
    }
  }, []);

  const saveChatHistory = (history: ChatHistory[]) => {
    setChatHistory(history);
    localStorage.setItem('chatHistory', JSON.stringify(history));
  };

  const addToHistory = (title: string, preview: string) => {
    const newChat: ChatHistory = {
      id: Date.now().toString(),
      title: title.slice(0, 50) + (title.length > 50 ? '...' : ''),
      date: new Date().toLocaleDateString('pt-BR'),
      preview: preview.slice(0, 100) + (preview.length > 100 ? '...' : '')
    };
    
    const updatedHistory = [newChat, ...chatHistory.slice(0, 19)]; // Manter apenas 20 itens
    saveChatHistory(updatedHistory);
    return newChat.id;
  };

  const removeFromHistory = (chatId: string) => {
    const updatedHistory = chatHistory.filter(chat => chat.id !== chatId);
    saveChatHistory(updatedHistory);
  };

  const clearHistory = () => {
    saveChatHistory([]);
  };

  return (
    <>
      {/* Trigger Area */}
      <div 
        className={cn(
          "fixed left-0 top-0 h-full z-40 transition-all duration-300",
          isExpanded ? "w-80" : "w-6"
        )}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        {/* Overlay Background */}
        <div className={cn(
          "absolute inset-0 bg-background/80 backdrop-blur border-r border-border transition-all duration-300",
          isExpanded ? "opacity-100" : "opacity-0"
        )} />
        
        {/* Hover Trigger */}
        <div className="absolute left-0 top-0 w-6 h-full bg-primary/10 hover:bg-primary/20 transition-colors" />
        
        {/* Content */}
        <div className={cn(
          "absolute inset-0 flex flex-col transition-all duration-300 p-4",
          isExpanded ? "opacity-100" : "opacity-0 pointer-events-none"
        )}>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              <h2 className="font-semibold">Histórico</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>

          {/* New Chat Button */}
          <Button
            onClick={onNewChat}
            className="w-full mb-4 bg-gradient-to-r from-primary to-accent hover:opacity-90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Chat
          </Button>

          <Separator className="mb-4" />

          {/* Chat History */}
          <ScrollArea className="flex-1">
            <div className="space-y-2">
              {chatHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Code className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Nenhum histórico ainda</p>
                  <p className="text-xs">Seus chats aparecerão aqui</p>
                </div>
              ) : (
                chatHistory.map((chat) => (
                  <Card
                    key={chat.id}
                    className={cn(
                      "p-3 cursor-pointer hover:bg-primary/5 transition-all border-border/50",
                      currentChatId === chat.id && "border-primary/50 bg-primary/5"
                    )}
                    onClick={() => onSelectChat(chat.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-sm font-medium line-clamp-1">
                        {chat.title}
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromHistory(chat.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {chat.preview}
                    </p>
                    
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3 mr-1" />
                      {chat.date}
                    </div>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          {chatHistory.length > 0 && (
            <>
              <Separator className="my-4" />
              <Button
                variant="outline"
                size="sm"
                onClick={clearHistory}
                className="w-full text-xs"
              >
                <Trash2 className="w-3 h-3 mr-2" />
                Limpar Histórico
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Content Padding */}
      <div className={cn(
        "transition-all duration-300",
        isExpanded ? "ml-80" : "ml-0"
      )} />
    </>
  );
};