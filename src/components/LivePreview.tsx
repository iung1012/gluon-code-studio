
import { useEffect, useRef, useState } from 'react';
import { cn } from "@/lib/utils";
import { FileNode } from "./FileTree";
import { AlertCircle, Monitor, Tablet, Smartphone, Eye, MousePointer } from "lucide-react";
import { ElementSelector } from "./ElementSelector";

interface LivePreviewProps {
  files: FileNode[];
  selectedFile?: { path: string; content: string };
  onFileSelect?: (path: string, content: string) => void;
  generatedCode?: string;
  device?: 'desktop' | 'tablet' | 'mobile';
  isSelectionMode?: boolean;
  onElementSelect?: (elementInfo: {
    tag: string;
    text: string;
    selector: string;
    position: { x: number; y: number };
  }) => void;
}

export const LivePreview = ({ 
  files, 
  generatedCode, 
  device = 'desktop',
  isSelectionMode = false,
  onElementSelect
}: LivePreviewProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const htmlContent = files.length > 0 && files[0].content ? files[0].content : generatedCode || "";
  
  useEffect(() => {
    if (!iframeRef.current || !htmlContent) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setPreviewError(null);

    try {
      const iframe = iframeRef.current;
      
      // Create a blob URL for the HTML content
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      // Set up load event listener
      const handleLoad = () => {
        setIsLoading(false);
        URL.revokeObjectURL(url);
      };
      
      const handleError = () => {
        setIsLoading(false);
        setPreviewError('Erro ao carregar o preview');
        URL.revokeObjectURL(url);
      };
      
      iframe.addEventListener('load', handleLoad);
      iframe.addEventListener('error', handleError);
      
      // Set the iframe source
      iframe.src = url;
      
      // Cleanup
      return () => {
        iframe.removeEventListener('load', handleLoad);
        iframe.removeEventListener('error', handleError);
        URL.revokeObjectURL(url);
      };
    } catch (error) {
      console.error('Error setting up preview:', error);
      setPreviewError('Erro ao configurar o preview');
      setIsLoading(false);
    }
  }, [htmlContent]);
  
  if (!htmlContent) {
    return (
      <div className="h-full flex items-center justify-center text-slate-600 bg-gradient-to-br from-white to-slate-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 bg-blue-50 rounded-2xl mx-auto mb-6 flex items-center justify-center">
            <Eye className="w-10 h-10 text-blue-400" />
          </div>
          <h3 className="text-xl font-medium mb-3 text-slate-800">Preview do Website</h3>
          <p className="text-slate-600 leading-relaxed">
            Gere um website para ver o preview ao vivo aqui. O resultado aparecerá instantaneamente conforme você faz alterações.
          </p>
        </div>
      </div>
    );
  }

  if (previewError) {
    return (
      <div className="h-full flex items-center justify-center text-slate-600 bg-gradient-to-br from-white to-slate-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-red-50 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-lg font-medium mb-2 text-slate-800">Erro no Preview</h3>
          <p className="text-slate-600 mb-4">{previewError}</p>
          <p className="text-sm text-slate-500">
            Tente gerar o website novamente ou verifique se o código HTML está válido.
          </p>
        </div>
      </div>
    );
  }

  const deviceStyles = {
    desktop: "w-full h-full",
    tablet: "w-[768px] h-[1024px] mx-auto border border-slate-200 rounded-xl shadow-lg overflow-hidden bg-white",
    mobile: "w-[375px] h-[667px] mx-auto border border-slate-200 rounded-2xl shadow-lg overflow-hidden bg-white"
  };

  const containerStyles = {
    desktop: "w-full h-full",
    tablet: "w-full h-full flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-blue-50/30",
    mobile: "w-full h-full flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-blue-50/30"
  };

  const deviceIcons = {
    desktop: Monitor,
    tablet: Tablet,
    mobile: Smartphone
  };

  return (
    <div className={cn("bg-gradient-to-br from-white to-slate-50 relative", containerStyles[device])}>
      {/* Selection mode indicator */}
      {isSelectionMode && (
        <div className="absolute top-4 right-4 z-10 bg-blue-600 text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
          <MousePointer className="w-4 h-4" />
          <span className="text-sm font-medium">Clique em um elemento para editá-lo</span>
        </div>
      )}

      {/* Device indicator for non-desktop views */}
      {device !== 'desktop' && (
        <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg px-3 py-2 flex items-center gap-2 shadow-sm">
          {(() => {
            const Icon = deviceIcons[device];
            return <Icon className="w-4 h-4 text-slate-600" />;
          })()}
          <span className="text-sm font-medium text-slate-700 capitalize">{device}</span>
        </div>
      )}
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-20">
          <div className="flex items-center gap-3 text-slate-600">
            <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
            <span className="text-sm font-medium">Carregando preview...</span>
          </div>
        </div>
      )}
      
      <iframe
        ref={iframeRef}
        className={cn(
          "border-0 bg-white transition-all duration-300",
          deviceStyles[device],
          isLoading && "opacity-0",
          isSelectionMode && "cursor-crosshair"
        )}
        title="Preview do Website"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
        style={{
          minHeight: device === 'desktop' ? '100%' : 'auto',
          pointerEvents: isSelectionMode ? 'auto' : 'auto'
        }}
      />

      {/* Element Selector */}
      {isSelectionMode && onElementSelect && (
        <ElementSelector
          iframeRef={iframeRef}
          isSelectionMode={isSelectionMode}
          onElementSelect={onElementSelect}
        />
      )}
    </div>
  );
};
