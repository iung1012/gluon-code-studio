import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Download, MessageSquare, X, Monitor, Tablet, Smartphone } from "lucide-react";
import logo from "@/assets/logo.png";
import { ChatPanel } from "./ChatPanel";
import { LivePreview } from "./LivePreview";
import { WebContainerPreview } from "./WebContainerPreview";
import { FileNode } from "./FileTree";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import JSZip from 'jszip';

interface WebsiteVersion {
  id: string;
  content: string;
  timestamp: Date;
  versionNumber: number;
}

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface ChatLayoutProps {
  files: FileNode[];
  selectedFile?: { path: string; content: string };
  onFileSelect: (path: string, content: string) => void;
  onBackToInput: () => void;
  onNewProject: () => void;
  onSendMessage: (message: string, images?: string[]) => Promise<void>;
  generatedCode?: string;
  isLoading: boolean;
  websiteVersions?: WebsiteVersion[];
  currentVersionId?: string;
  onRestoreVersion?: (versionId: string) => void;
  initialMessages?: ChatMessage[];
}

export const ChatLayout = ({
  files,
  selectedFile,
  onFileSelect,
  onBackToInput,
  onNewProject,
  onSendMessage,
  generatedCode,
  isLoading,
  websiteVersions = [],
  currentVersionId,
  onRestoreVersion,
  initialMessages = []
}: ChatLayoutProps) => {
  const [chatVisible, setChatVisible] = useState(true);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const { toast } = useToast();


  const downloadHtml = () => {
    if (files.length > 0 && files[0].content) {
      const blob = new Blob([files[0].content], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'index.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const downloadZip = async () => {
    if (files.length === 0 || !files[0].content) {
      toast({
        title: "Erro",
        description: "Nenhum arquivo para baixar",
        variant: "destructive"
      });
      return;
    }

    try {
      const zip = new JSZip();
      
      zip.file("index.html", files[0].content);
      
      zip.file("README.md", `# Website Gerado
      
Este website foi gerado automaticamente usando IA.

## Como usar:
1. Abra o arquivo \`index.html\` em qualquer navegador
2. O código HTML, CSS e JavaScript estão todos em um único arquivo
3. Personalize conforme necessário

Gerado em: ${new Date().toLocaleDateString('pt-BR')}
`);

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'website-gerado.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Download Concluído",
        description: "Website baixado em formato ZIP com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao criar ZIP:', error);
      toast({
        title: "Erro no Download",
        description: "Falha ao criar o arquivo ZIP. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const openInNewTab = () => {
    if (files.length > 0 && files[0].content) {
      const blob = new Blob([files[0].content], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  };

  const deviceIcons = {
    desktop: Monitor,
    tablet: Tablet,
    mobile: Smartphone
  };

  const deviceLabels = {
    desktop: "Desktop",
    tablet: "Tablet", 
    mobile: "Celular"
  };

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b bg-card/30 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap w-full sm:w-auto">
            <button
              onClick={onBackToInput}
              className="hover:opacity-80 transition-opacity"
            >
              <img src={logo} alt="Logo" className="h-8 w-auto" />
            </button>
            <div className="h-4 w-px bg-border/50 hidden sm:block" />
            <h2 className="font-medium text-foreground/90 text-sm sm:text-base">Website Gerado</h2>
            {websiteVersions.length > 0 && (
              <>
                <div className="h-4 w-px bg-border/50 hidden sm:block" />
                <span className="text-xs sm:text-sm text-muted-foreground">
                  Versão {websiteVersions.find(v => v.id === currentVersionId)?.versionNumber || websiteVersions.length}
                </span>
              </>
            )}
          </div>
          
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setChatVisible(!chatVisible)}
              className="gap-1.5 sm:gap-2 bg-background/50 hover:bg-muted/50 text-xs sm:text-sm px-2 sm:px-3 h-8"
            >
              {chatVisible ? (
                <>
                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden md:inline">Ocultar Chat</span>
                  <span className="md:hidden">Chat</span>
                </>
              ) : (
                <>
                  <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden md:inline">Mostrar Chat</span>
                  <span className="md:hidden">Chat</span>
                </>
              )}
            </Button>
            
            <div className="h-4 w-px bg-border/50 hidden sm:block" />
            
            {/* Device Selector */}
            <Select value={previewDevice} onValueChange={(value: any) => setPreviewDevice(value)}>
              <SelectTrigger className="w-[90px] sm:w-[120px] bg-background/50 text-xs sm:text-sm h-8">
                <SelectValue>
                  <div className="flex items-center gap-1 sm:gap-2">
                    {(() => {
                      const Icon = deviceIcons[previewDevice];
                      return <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />;
                    })()}
                    <span className="text-xs hidden sm:inline">{deviceLabels[previewDevice]}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(deviceIcons).map(([device, Icon]) => (
                  <SelectItem key={device} value={device}>
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <span>{deviceLabels[device as keyof typeof deviceLabels]}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="h-4 w-px bg-border/50 hidden sm:block" />
            
            <Button
              variant="outline"
              size="sm"
              onClick={downloadZip}
              className="gap-1.5 sm:gap-2 bg-background/50 hover:bg-muted/50 text-xs sm:text-sm px-2 sm:px-3 h-8"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">ZIP</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Content with Resizable Panels */}
      <div className="flex-1 overflow-hidden">
        {chatVisible ? (
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel
              defaultSize={25}
              minSize={20}
              maxSize={50}
              className="bg-card/20 backdrop-blur-sm"
            >
              <ChatPanel
                onSendMessage={onSendMessage}
                isLoading={isLoading}
                websiteVersions={websiteVersions}
                currentVersionId={currentVersionId}
                onRestoreVersion={onRestoreVersion}
                initialMessages={initialMessages}
              />
            </ResizablePanel>
            
            <ResizableHandle withHandle className="w-2 bg-border/50 hover:bg-border/80 transition-colors" />
            
            <ResizablePanel
              defaultSize={75}
              minSize={50}
              className="bg-muted/20"
            >
              <WebContainerPreview files={files} />
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          <div className="h-full bg-muted/20">
            <WebContainerPreview files={files} />
          </div>
        )}
      </div>
    </div>
  );
};
