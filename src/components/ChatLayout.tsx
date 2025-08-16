import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Download, ExternalLink, RotateCcw, MessageSquare, X, Monitor, Tablet, Smartphone, MousePointer } from "lucide-react";
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
  onSendMessage: (message: string) => Promise<void>;
  generatedCode?: string;
  isLoading: boolean;
}

interface SelectedElement {
  tag: string;
  text: string;
  selector: string;
  position: { x: number; y: number };
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

  const handleElementSelect = (elementInfo: SelectedElement) => {
    setSelectedElement(elementInfo);
    setIsSelectionMode(false);
    toast({
      title: "Elemento Selecionado",
      description: `${elementInfo.tag.toUpperCase()}: "${elementInfo.text.substring(0, 50)}${elementInfo.text.length > 50 ? '...' : ''}"`,
    });
  };

  const handleSendMessageWithElement = async (message: string) => {
    let enhancedMessage = message;
    
    if (selectedElement) {
      enhancedMessage = `Modifique o elemento ${selectedElement.tag.toUpperCase()} com o texto "${selectedElement.text}" (seletor: ${selectedElement.selector}). ${message}`;
      setSelectedElement(null);
    }
    
    await onSendMessage(enhancedMessage);
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
    <div className="h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex flex-col">
      {/* Header */}
      <div className="border-b bg-white/70 backdrop-blur-xl shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackToInput}
              className="gap-2 hover:bg-slate-100/80 text-slate-700"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Início
            </Button>
            <div className="h-4 w-px bg-slate-200" />
            <h2 className="font-medium text-slate-800">Website Gerado</h2>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={isSelectionMode ? "default" : "outline"}
              size="sm"
              onClick={() => setIsSelectionMode(!isSelectionMode)}
              className={cn(
                "gap-2 transition-all",
                isSelectionMode 
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md" 
                  : "bg-white/80 hover:bg-slate-100 text-slate-700 border-slate-200"
              )}
            >
              <MousePointer className="w-4 h-4" />
              {isSelectionMode ? 'Cancelar Seleção' : 'Selecionar Elemento'}
            </Button>
            
            <div className="h-4 w-px bg-slate-200" />
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setChatVisible(!chatVisible)}
              className="gap-2 bg-white/80 hover:bg-slate-100 text-slate-700 border-slate-200"
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
            
            <div className="h-4 w-px bg-slate-200" />
            
            {/* Device Selector */}
            <Select value={previewDevice} onValueChange={(value: any) => setPreviewDevice(value)}>
              <SelectTrigger className="w-[120px] bg-white/80 border-slate-200">
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
            
            <div className="h-4 w-px bg-slate-200" />
            
            <Button
              variant="outline"
              size="sm"
              onClick={downloadHtml}
              className="gap-2 bg-white/80 hover:bg-slate-100 text-slate-700 border-slate-200"
            >
              <Download className="w-4 h-4" />
              HTML
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadZip}
              className="gap-2 bg-white/80 hover:bg-slate-100 text-slate-700 border-slate-200"
            >
              <Download className="w-4 h-4" />
              ZIP
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={openInNewTab}
              className="gap-2 bg-white/80 hover:bg-slate-100 text-slate-700 border-slate-200"
            >
              <ExternalLink className="w-4 h-4" />
              Abrir
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onNewProject}
              className="gap-2 text-destructive hover:text-destructive bg-white/80 hover:bg-destructive/10"
            >
              <RotateCcw className="w-4 h-4" />
              Novo Projeto
            </Button>
          </div>
        </div>
      </div>

      {/* Selected Element Indicator */}
      {selectedElement && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-blue-700 font-medium">Elemento selecionado:</span>
            <span className="text-blue-600">
              {selectedElement.tag.toUpperCase()} - "{selectedElement.text.substring(0, 50)}{selectedElement.text.length > 50 ? '...' : ''}"
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedElement(null)}
              className="ml-auto h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {chatVisible && (
          <div className="w-80 border-r bg-white/40 backdrop-blur-xl shadow-sm">
            <ChatPanel
              onSendMessage={handleSendMessageWithElement}
              isLoading={isLoading}
              selectedElement={selectedElement}
            />
          </div>
        )}
        
        <div className="flex-1 bg-slate-50/50">
          <LivePreview
            files={files}
            generatedCode={generatedCode}
            device={previewDevice}
            isSelectionMode={isSelectionMode}
            onElementSelect={handleElementSelect}
          />
        </div>
      </div>
    </div>
  );
};
