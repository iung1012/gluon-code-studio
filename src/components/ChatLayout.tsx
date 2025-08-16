import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Download, ExternalLink, RotateCcw, MessageSquare, X, Monitor, Tablet, Smartphone } from "lucide-react";
import { ChatPanel } from "./ChatPanel";
import { LivePreview } from "./LivePreview";
import { FileNode } from "./FileTree";
import { cn } from "@/lib/utils";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import JSZip from 'jszip';
import { ElementSelector } from "./ElementSelector";

interface SelectedElement {
  element: HTMLElement;
  selector: string;
  type: string;
  text?: string;
  position: { x: number; y: number; width: number; height: number };
}

interface ChatLayoutProps {
  files: FileNode[];
  selectedFile?: { path: string; content: string };
  onFileSelect: (path: string, content: string) => void;
  onBackToInput: () => void;
  onNewProject: () => void;
  onSendMessage: (message: string) => Promise<void>;
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
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
  const [isChatMode, setIsChatMode] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
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
      
      // Add the main HTML file
      zip.file("index.html", files[0].content);
      
      // Add a README
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

  const handleElementSelect = (element: SelectedElement | null) => {
    setSelectedElement(element);
    if (element) {
      toast({
        title: "Elemento Selecionado",
        description: `${element.type} selecionado: "${element.text?.substring(0, 50)}${element.text && element.text.length > 50 ? '...' : ''}"`,
      });
    }
  };

  const handleChatMessage = async (message: string, elementContext?: SelectedElement, images?: string[]) => {
    let contextualMessage = message;
    
    if (elementContext) {
      contextualMessage = `Alterar o ${elementContext.type} que contém "${elementContext.text}" para: ${message}`;
    }
    
    console.log('Chat message with context:', { message, elementContext, images });
    
    await onSendMessage(contextualMessage);
    
    // Clear selection after sending message
    setSelectedElement(null);
    setIsSelectionMode(false);
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (!isSelectionMode) {
      setSelectedElement(null);
    }
    toast({
      title: isSelectionMode ? "Modo Seleção Desativado" : "Modo Seleção Ativado",
      description: isSelectionMode 
        ? "Você pode agora usar o chat normalmente" 
        : "Clique em elementos da página para selecioná-los",
    });
  };

  const toggleChatMode = () => {
    setIsChatMode(!isChatMode);
    if (!isChatMode) {
      setSelectedElement(null);
      setIsSelectionMode(false);
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

            <Button
              variant="outline"
              size="sm"
              onClick={toggleSelectionMode}
              className={cn(
                "gap-2 bg-background/50 hover:bg-muted/50",
                isSelectionMode && "bg-purple-100 text-purple-700 border-purple-300"
              )}
            >
              <span className="w-4 h-4 text-center">🎯</span>
              {isSelectionMode ? 'Sair da Seleção' : 'Selecionar'}
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

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {chatVisible && (
          <div className="w-80 border-r bg-card/20 backdrop-blur-sm">
            <ChatPanel
              onSendMessage={handleChatMessage}
              isLoading={isLoading}
              selectedElement={selectedElement}
              isChatMode={isChatMode}
              onToggleChatMode={toggleChatMode}
            />
          </div>
        )}
        
        <div className="flex-1 bg-muted/20 relative">
          <LivePreview
            files={files}
            generatedCode={generatedCode}
            device={previewDevice}
            ref={iframeRef}
          />
          
          <ElementSelector
            isActive={isSelectionMode}
            onElementSelect={handleElementSelect}
            iframeRef={iframeRef}
          />
          
          {isSelectionMode && (
            <div className="absolute top-4 left-4 bg-purple-100 text-purple-800 px-3 py-2 rounded-lg text-sm font-medium border border-purple-300">
              🎯 Modo Seleção Ativo - Clique em elementos para selecioná-los
            </div>
          )}
          
          {selectedElement && (
            <div 
              className="absolute bg-purple-600 text-white px-2 py-1 rounded text-xs font-medium pointer-events-none z-50"
              style={{
                left: selectedElement.position.x,
                top: selectedElement.position.y - 30,
              }}
            >
              {selectedElement.type} selecionado
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
