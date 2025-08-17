import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { ArrowLeft, Download, ExternalLink, RotateCcw, MessageSquare, X, Monitor, Tablet, Smartphone } from "lucide-react";
import { ChatPanel } from "./ChatPanel";
import { LivePreview } from "./LivePreview";
import { FileNode } from "./FileTree";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import JSZip from 'jszip';

interface ChatLayoutProps {
  files: FileNode[];
  selectedFile?: { path: string; content: string };
  onFileSelect: (path: string, content: string) => void;
  onBackToInput: () => void;
  onNewProject: () => void;
  onSendMessage: (message: string, images?: string[]) => Promise<void>;
  generatedCode?: string;
  isLoading: boolean;
}

export const ChatLayout = ({
  files,
  selectedFile,
  onFileSelect,
  onBackToInput,
  onNewProject,
  onSendMessage,
  generatedCode,
  isLoading
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
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackToInput}
              className="gap-2 hover:bg-muted/50"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Início
            </Button>
            <div className="h-4 w-px bg-border/50" />
            <h2 className="font-medium text-foreground/90">Website Gerado</h2>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setChatVisible(!chatVisible)}
              className="gap-2 bg-background/50 hover:bg-muted/50"
            >
              {chatVisible ? (
                <>
                  <X className="w-4 h-4" />
                  Ocultar Chat
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4" />
                  Mostrar Chat
                </>
              )}
            </Button>
            
            <div className="h-4 w-px bg-border/50" />
            
            {/* Device Selector */}
            <Select value={previewDevice} onValueChange={(value: any) => setPreviewDevice(value)}>
              <SelectTrigger className="w-[120px] bg-background/50">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const Icon = deviceIcons[previewDevice];
                      return <Icon className="w-4 h-4" />;
                    })()}
                    <span className="text-xs">{deviceLabels[previewDevice]}</span>
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
            
            <div className="h-4 w-px bg-border/50" />
            
            <Button
              variant="outline"
              size="sm"
              onClick={downloadHtml}
              className="gap-2 bg-background/50 hover:bg-muted/50"
            >
              <Download className="w-4 h-4" />
              HTML
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadZip}
              className="gap-2 bg-background/50 hover:bg-muted/50"
            >
              <Download className="w-4 h-4" />
              ZIP
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={openInNewTab}
              className="gap-2 bg-background/50 hover:bg-muted/50"
            >
              <ExternalLink className="w-4 h-4" />
              Abrir
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onNewProject}
              className="gap-2 text-destructive hover:text-destructive bg-background/50 hover:bg-destructive/10"
            >
              <RotateCcw className="w-4 h-4" />
              Novo Projeto
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
              />
            </ResizablePanel>
            
            <ResizableHandle withHandle className="w-2 bg-border/50 hover:bg-border/80 transition-colors" />
            
            <ResizablePanel
              defaultSize={75}
              minSize={50}
              className="bg-muted/20"
            >
              <LivePreview
                files={files}
                generatedCode={generatedCode}
                device={previewDevice}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          <div className="h-full bg-muted/20">
            <LivePreview
              files={files}
              generatedCode={generatedCode}
              device={previewDevice}
            />
          </div>
        )}
      </div>
    </div>
  );
};
