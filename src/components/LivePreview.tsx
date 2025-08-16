import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, RotateCcw, Monitor, Tablet, Smartphone } from "lucide-react";
import { ProjectFile } from "@/services/advancedCodeGenerator";

interface LivePreviewProps {
  files: ProjectFile[];
  className?: string;
}

type DeviceType = 'desktop' | 'tablet' | 'mobile';

export const LivePreview = ({ files, className }: LivePreviewProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [device, setDevice] = useState<DeviceType>('desktop');

  const deviceSizes = {
    desktop: { width: '100%', height: '100%' },
    tablet: { width: '768px', height: '1024px' },
    mobile: { width: '375px', height: '667px' }
  };

  const createPreviewContent = () => {
    // Find the main HTML file
    const htmlFile = files.find(file => 
      file.name.toLowerCase() === 'index.html' || 
      file.path.toLowerCase().includes('index.html')
    );

    if (!htmlFile || !htmlFile.content) {
      return '<html><body><div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;color:#666;">Nenhum arquivo HTML encontrado</div></body></html>';
    }

    let htmlContent = htmlFile.content;

    // Inject CSS files
    const cssFiles = files.filter(file => file.name.endsWith('.css') && file.content);
    cssFiles.forEach(cssFile => {
      const cssContent = `<style>\n${cssFile.content}\n</style>`;
      htmlContent = htmlContent.replace('</head>', `${cssContent}\n</head>`);
    });

    // Inject JavaScript files
    const jsFiles = files.filter(file => file.name.endsWith('.js') && file.content);
    jsFiles.forEach(jsFile => {
      const scriptContent = `<script>\n${jsFile.content}\n</script>`;
      htmlContent = htmlContent.replace('</body>', `${scriptContent}\n</body>`);
    });

    // Add meta viewport if not present
    if (!htmlContent.includes('viewport')) {
      const viewportMeta = '<meta name="viewport" content="width=device-width, initial-scale=1.0">';
      htmlContent = htmlContent.replace('<head>', `<head>\n${viewportMeta}`);
    }

    return htmlContent;
  };

  const loadPreview = () => {
    if (!iframeRef.current || files.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (!doc) {
        setError('Erro ao acessar o preview');
        setIsLoading(false);
        return;
      }

      const content = createPreviewContent();
      
      doc.open();
      doc.write(content);
      doc.close();

      // Handle iframe load
      const handleLoad = () => {
        setIsLoading(false);
        setError(null);
      };

      const handleError = () => {
        setError('Erro ao carregar o preview');
        setIsLoading(false);
      };

      iframe.onload = handleLoad;
      iframe.onerror = handleError;

      // Fallback timeout
      setTimeout(() => {
        if (isLoading) {
          setIsLoading(false);
        }
      }, 3000);

    } catch (err) {
      setError('Erro ao gerar o preview');
      setIsLoading(false);
    }
  };

  const refreshPreview = () => {
    loadPreview();
  };

  const openInNewTab = () => {
    const content = createPreviewContent();
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(content);
      newWindow.document.close();
    }
  };

  useEffect(() => {
    loadPreview();
  }, [files]);

  const DeviceButton = ({ 
    type, 
    icon: Icon, 
    label 
  }: { 
    type: DeviceType; 
    icon: any; 
    label: string; 
  }) => (
    <Button
      variant={device === type ? "default" : "ghost"}
      size="sm"
      onClick={() => setDevice(type)}
      className="gap-2"
    >
      <Icon className="w-4 h-4" />
      {label}
    </Button>
  );

  if (files.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-full p-8">
          <div className="text-center">
            <Monitor className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Preview não disponível</h3>
            <p className="text-muted-foreground">
              Gere um projeto primeiro para ver o preview ao vivo
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-0 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <h3 className="font-medium">Preview ao Vivo</h3>
            <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">
              Executando
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Device Selector */}
            <div className="flex items-center gap-1 border border-border rounded-lg p-1">
              <DeviceButton type="desktop" icon={Monitor} label="Desktop" />
              <DeviceButton type="tablet" icon={Tablet} label="Tablet" />
              <DeviceButton type="mobile" icon={Smartphone} label="Mobile" />
            </div>
            
            {/* Actions */}
            <Button variant="ghost" size="sm" onClick={refreshPreview}>
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={openInNewTab}>
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 p-4 bg-muted/30 overflow-auto">
          <div 
            className="mx-auto bg-background rounded-lg shadow-lg border border-border overflow-hidden transition-all duration-300"
            style={{
              width: deviceSizes[device].width,
              height: device === 'desktop' ? 'calc(100% - 2rem)' : deviceSizes[device].height,
              minHeight: device !== 'desktop' ? deviceSizes[device].height : undefined,
              maxWidth: '100%'
            }}
          >
            {isLoading && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Carregando preview...</p>
                </div>
              </div>
            )}
            
            {error && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-destructive">
                  <p className="font-medium">Erro no Preview</p>
                  <p className="text-sm">{error}</p>
                  <Button variant="outline" size="sm" onClick={refreshPreview} className="mt-2">
                    Tentar novamente
                  </Button>
                </div>
              </div>
            )}
            
            <iframe
              ref={iframeRef}
              className="w-full h-full border-none"
              title="Live Preview"
              sandbox="allow-scripts allow-same-origin"
              style={{ display: isLoading || error ? 'none' : 'block' }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};