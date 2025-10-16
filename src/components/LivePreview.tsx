import { useEffect, useRef, useState } from 'react';
import { cn } from "@/lib/utils";
import { FileNode } from "./FileTree";
import { AlertCircle, Monitor, Tablet, Smartphone, Eye } from "lucide-react";
import { PreviewLoading } from "./PreviewLoading";

interface LivePreviewProps {
  files: FileNode[];
  selectedFile?: { path: string; content: string };
  onFileSelect?: (path: string, content: string) => void;
  generatedCode?: string;
  device?: 'desktop' | 'tablet' | 'mobile';
  isGenerating?: boolean;
  generationProgress?: number;
}

export const LivePreview = ({ 
  files, 
  generatedCode, 
  device = 'desktop',
  isGenerating = false,
  generationProgress
}: LivePreviewProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Find the main HTML file
  const findFile = (nodes: FileNode[], name: string): FileNode | undefined => {
    for (const node of nodes) {
      if (node.type === 'file' && node.name === name) return node;
      if (node.type === 'folder' && node.children) {
        const found = findFile(node.children, name);
        if (found) return found;
      }
    }
    return undefined;
  };

  const getAllFiles = (nodes: FileNode[]): FileNode[] => {
    let result: FileNode[] = [];
    for (const node of nodes) {
      if (node.type === 'file') {
        result.push(node);
      } else if (node.type === 'folder' && node.children) {
        result = result.concat(getAllFiles(node.children));
      }
    }
    return result;
  };

  const htmlFile = findFile(files, 'index.html') || files.find(f => f.type === 'file' && f.name.endsWith('.html'));
  const htmlContent = htmlFile?.content || generatedCode || "";
  const allFiles = getAllFiles(files);
  
  useEffect(() => {
    if (!iframeRef.current) {
      setIsLoading(false);
      return;
    }

    if (!htmlContent) {
      setIsLoading(false);
      setPreviewError(null);
      return;
    }

    setIsLoading(true);
    setPreviewError(null);

    try {
      const iframe = iframeRef.current;
      
      // Clean up previous content
      iframe.src = 'about:blank';
      
      setTimeout(() => {
        try {
          let processedHtml = htmlContent;
          
          // Inject external CSS files
          const cssFiles = allFiles.filter(f => f.path.endsWith('.css') && f.content);
          if (cssFiles.length > 0) {
            const cssLinks = cssFiles.map(cssFile => {
              const blob = new Blob([cssFile.content!], { type: 'text/css' });
              const url = URL.createObjectURL(blob);
              return `<link rel="stylesheet" href="${url}">`;
            }).join('\n');
            
            processedHtml = processedHtml.replace('</head>', `${cssLinks}\n</head>`);
          }
          
          // Inject external JS files
          const jsFiles = allFiles.filter(f => f.path.endsWith('.js') && f.content);
          if (jsFiles.length > 0) {
            const jsScripts = jsFiles.map(jsFile => {
              const blob = new Blob([jsFile.content!], { type: 'text/javascript' });
              const url = URL.createObjectURL(blob);
              return `<script src="${url}"></script>`;
            }).join('\n');
            
            processedHtml = processedHtml.replace('</body>', `${jsScripts}\n</body>`);
          }

          // Write content directly to iframe
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (iframeDoc) {
            iframeDoc.open();
            iframeDoc.write(processedHtml);
            iframeDoc.close();
            setIsLoading(false);
            console.log('LivePreview - Multi-file content written successfully');
          } else {
            // Fallback to blob URL if direct write fails
            const blob = new Blob([processedHtml], { type: 'text/html;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            iframe.src = url;
            
            const handleLoad = () => {
              setIsLoading(false);
              URL.revokeObjectURL(url);
              console.log('LivePreview - Blob URL loaded successfully');
            };
            
            const handleError = () => {
              setIsLoading(false);
              setPreviewError('Erro ao carregar o preview');
              URL.revokeObjectURL(url);
              console.error('LivePreview - Error loading blob URL');
            };
            
            iframe.addEventListener('load', handleLoad, { once: true });
            iframe.addEventListener('error', handleError, { once: true });
          }
        } catch (error) {
          console.error('LivePreview - Error writing to iframe:', error);
          setPreviewError('Erro ao renderizar o preview');
          setIsLoading(false);
        }
      }, 100);
      
    } catch (error) {
      console.error('LivePreview - Error setting up preview:', error);
      setPreviewError('Erro ao configurar o preview');
      setIsLoading(false);
    }
  }, [htmlContent, allFiles]);

  // Show generation loading when generating
  if (isGenerating) {
    return <PreviewLoading progress={generationProgress} />;
  }
  
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
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals"
        style={{
          minHeight: device === 'desktop' ? '100%' : 'auto'
        }}
      />
    </div>
  );
};
