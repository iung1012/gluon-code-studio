import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Plus, Clock, MessageSquare, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatHistory {
  id: string;
  title: string;
  timestamp: Date;
  preview: string;
}

interface SidebarMenuProps {
  onNewChat: () => void;
  onSelectHistory?: (historyId: string) => void;
}

export const SidebarMenu = ({ onNewChat, onSelectHistory }: SidebarMenuProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [history, setHistory] = useState<ChatHistory[]>([]);

  // Load chat history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem("chat-history");
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setHistory(parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        })));
      } catch (error) {
        console.error("Error loading chat history:", error);
      }
    }
  }, []);

  // Save chat history to localStorage
  const saveHistory = (newHistory: ChatHistory[]) => {
    setHistory(newHistory);
    localStorage.setItem("chat-history", JSON.stringify(newHistory));
  };

  // Add new chat to history
  const addToHistory = (title: string, preview: string) => {
    const newChat: ChatHistory = {
      id: Date.now().toString(),
      title: title.slice(0, 50) + (title.length > 50 ? "..." : ""),
      timestamp: new Date(),
      preview: preview.slice(0, 100) + (preview.length > 100 ? "..." : "")
    };

    const newHistory = [newChat, ...history].slice(0, 20); // Keep only last 20
    saveHistory(newHistory);
  };

  // Delete chat from history
  const deleteFromHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newHistory = history.filter(item => item.id !== id);
    saveHistory(newHistory);
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return "Agora";
  };

  return (
    <>
      {/* Invisible hover trigger */}
      <div
        className="fixed left-0 top-0 w-4 h-full z-40"
        onMouseEnter={() => setIsHovered(true)}
      />

      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 h-full bg-sidebar-background border-r border-sidebar-border z-50 transition-all duration-300 ease-out",
          isHovered ? "w-80 shadow-2xl" : "w-0 overflow-hidden"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="p-4 h-full flex flex-col">
          {/* Header */}
          <div className="mb-6">
            <Button
              onClick={onNewChat}
              className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Chat
            </Button>
          </div>

          <Separator className="mb-4" />

          {/* History */}
          <div className="flex-1 overflow-hidden">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-medium text-sm text-sidebar-foreground">Histórico</h3>
            </div>

            <ScrollArea className="h-full">
              <div className="space-y-2">
                {history.length === 0 ? (
                  <Card className="bg-sidebar-accent/50 border-sidebar-border">
                    <CardContent className="p-3">
                      <p className="text-xs text-muted-foreground text-center">
                        Nenhum histórico ainda
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  history.map((item) => (
                    <Card
                      key={item.id}
                      className="bg-sidebar-accent/50 border-sidebar-border hover:bg-sidebar-accent cursor-pointer transition-colors group"
                      onClick={() => onSelectHistory?.(item.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-medium text-xs text-sidebar-foreground line-clamp-1">
                            {item.title}
                          </h4>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground">
                              {formatTimeAgo(item.timestamp)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 hover:bg-destructive/20 hover:text-destructive"
                              onClick={(e) => deleteFromHistory(item.id, e)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {item.preview}
                        </p>
                        <div className="flex items-center gap-1 mt-2">
                          <MessageSquare className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            Chat de desenvolvimento
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>

      {/* Backdrop */}
      {isHovered && (
        <div
          className="fixed inset-0 bg-black/20 z-30"
          onClick={() => setIsHovered(false)}
        />
      )}
    </>
  );
};