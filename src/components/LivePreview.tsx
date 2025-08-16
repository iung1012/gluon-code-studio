
import { useEffect, useRef, useState } from 'react';
import { cn } from "@/lib/utils";
import { FileNode } from "./FileTree";
import { AlertCircle, Monitor, Tablet, Smartphone, Eye } from "lucide-react";

interface LivePreviewProps {
  files: FileNode[];
  selectedFile?: { path: string; content: string };
  onFileSelect?: (path: string, content: string) => void;
  generatedCode?: string;
  device?: 'desktop' | 'tablet' | 'mobile';
}

export const LivePreview = ({ files, generatedCode, device = 'desktop' }: LivePreviewProps) => {
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
      <div className="h-full flex items-center justify-center text-muted-foreground bg-gradient-to-br from-background to-muted/20">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 bg-primary/10 rounded-2xl mx-auto mb-6 flex items-center justify-center">
            <Eye className="w-10 h-10 text-primary/60" />
          </div>
          <h3 className="text-xl font-medium mb-3 text-foreground">Preview do Website</h3>
          <p className="text-muted-foreground leading-relaxed">
            Gere um website para ver o preview ao vivo aqui. O resultado aparecerá instantaneamente conforme você faz alterações.
          </p>
        </div>
      </div>
    );
  }

  if (previewError) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground bg-gradient-to-br from-background to-muted/20">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-destructive/10 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-destructive/60" />
          </div>
          <h3 className="text-lg font-medium mb-2 text-foreground">Erro no Preview</h3>
          <p className="text-muted-foreground mb-4">{previewError}</p>
          <p className="text-sm text-muted-foreground">
            Tente gerar o website novamente ou verifique se o código HTML está válido.
          </p>
        </div>
      </div>
    );
  }

  const deviceStyles = {
    desktop: "w-full h-full",
    tablet: "w-[768px] h-[1024px] mx-auto border border-border/40 rounded-xl shadow-lg overflow-hidden",
    mobile: "w-[375px] h-[667px] mx-auto border border-border/40 rounded-2xl shadow-lg overflow-hidden"
  };

  const containerStyles = {
    desktop: "w-full h-full",
    tablet: "w-full h-full flex items-center justify-center p-6 bg-gradient-to-br from-muted/10 to-muted/30",
    mobile: "w-full h-full flex items-center justify-center p-6 bg-gradient-to-br from-muted/10 to-muted/30"
  };

  const deviceIcons = {
    desktop: Monitor,
    tablet: Tablet,
    mobile: Smartphone
  };

  return (
    <div className={cn("bg-gradient-to-br from-background to-muted/20 relative", containerStyles[device])}>
      {/* Device indicator for non-desktop views */}
      {device !== 'desktop' && (
        <div className="absolute top-4 left-4 z-10 bg-background/80 backdrop-blur-sm border border-border/40 rounded-lg px-3 py-2 flex items-center gap-2">
          {(() => {
            const Icon = deviceIcons[device];
            return <Icon className="w-4 h-4 text-muted-foreground" />;
          })()}
          <span className="text-sm font-medium text-muted-foreground capitalize">{device}</span>
        </div>
      )}
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-20">
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            <span className="text-sm font-medium">Carregando preview...</span>
          </div>
        </div>
      )}
      
      <iframe
        ref={iframeRef}
        className={cn(
          "border-0 bg-white transition-all duration-300",
          deviceStyles[device],
          isLoading && "opacity-0"
        )}
        title="Preview do Website"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
        style={{
          minHeight: device === 'desktop' ? '100%' : 'auto'
        }}
      />
    </div>
  );
};
