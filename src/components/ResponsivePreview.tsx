import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Monitor, 
  Tablet, 
  Smartphone, 
  Download, 
  ExternalLink,
  RefreshCw,
  Eye,
  EyeOff
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ResponsivePreviewProps {
  htmlContent: string;
  cssContent: string;
  jsContent: string;
  onDownload: () => void;
}

type DeviceType = 'desktop' | 'tablet' | 'mobile';

const deviceSizes = {
  desktop: { width: '100%', height: '100%', label: 'Desktop' },
  tablet: { width: '768px', height: '1024px', label: 'Tablet' },
  mobile: { width: '375px', height: '667px', label: 'Mobile' }
};

export const ResponsivePreview = ({ 
  htmlContent, 
  cssContent, 
  jsContent, 
  onDownload 
}: ResponsivePreviewProps) => {
  const [activeDevice, setActiveDevice] = useState<DeviceType>('desktop');
  const [isLoading, setIsLoading] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const createPreviewContent = () => {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        ${cssContent}
        
        /* Grid overlay for design reference */
        .design-grid {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            pointer-events: none;
            opacity: 0.1;
            z-index: 9999;
            background-image: 
                linear-gradient(to right, #3b82f6 1px, transparent 1px),
                linear-gradient(to bottom, #3b82f6 1px, transparent 1px);
            background-size: 20px 20px;
        }
        
        /* Mobile-first responsive utilities */
        @media (max-width: 640px) {
            .mobile-hidden { display: none !important; }
            .mobile-block { display: block !important; }
        }
        
        @media (min-width: 641px) and (max-width: 1024px) {
            .tablet-hidden { display: none !important; }
            .tablet-block { display: block !important; }
        }
        
        @media (min-width: 1025px) {
            .desktop-hidden { display: none !important; }
            .desktop-block { display: block !important; }
        }
        
        /* Smooth transitions for responsive elements */
        * {
            transition: all 0.3s ease;
        }
    </style>
</head>
<body>
    ${showGrid ? '<div class="design-grid"></div>' : ''}
    ${htmlContent}
    <script>
        ${jsContent}
        
        // Add responsive debugging
        window.addEventListener('resize', () => {
            console.log('Viewport:', window.innerWidth, 'x', window.innerHeight);
        });
        
        // Log initial viewport
        console.log('Initial viewport:', window.innerWidth, 'x', window.innerHeight);
    </script>
</body>
</html>`;
  };

  const refreshPreview = async () => {
    setIsLoading(true);
    
    // Simulate loading
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(createPreviewContent());
        doc.close();
      }
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    refreshPreview();
  }, [htmlContent, cssContent, jsContent, showGrid]);

  const currentSize = deviceSizes[activeDevice];

  return (
    <div className="h-full flex flex-col bg-muted/20">
      {/* Header Controls */}
      <div className="p-4 border-b border-border bg-background/50 backdrop-blur">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" />
              <h2 className="font-semibold">Preview Responsivo</h2>
            </div>
            <Badge variant="outline" className="text-xs">
              {currentSize.label}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowGrid(!showGrid)}
              className="gap-2"
            >
              {showGrid ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              Grade
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshPreview}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
              {isLoading ? 'Carregando' : 'Atualizar'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDownload}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
          </div>
        </div>

        {/* Device Selector */}
        <div className="flex items-center gap-2">
          <Button
            variant={activeDevice === 'desktop' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveDevice('desktop')}
            className="gap-2"
          >
            <Monitor className="w-4 h-4" />
            Desktop
          </Button>
          <Button
            variant={activeDevice === 'tablet' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveDevice('tablet')}
            className="gap-2"
          >
            <Tablet className="w-4 h-4" />
            Tablet
          </Button>
          <Button
            variant={activeDevice === 'mobile' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveDevice('mobile')}
            className="gap-2"
          >
            <Smartphone className="w-4 h-4" />
            Mobile
          </Button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 p-4 overflow-hidden">
        <div className="h-full flex items-center justify-center bg-background rounded-lg shadow-inner">
          <div 
            className={cn(
              "bg-white rounded-lg shadow-xl overflow-hidden transition-all duration-300",
              activeDevice === 'desktop' ? "w-full h-full" : "shadow-2xl border border-border/20"
            )}
            style={{
              width: activeDevice === 'desktop' ? '100%' : currentSize.width,
              height: activeDevice === 'desktop' ? '100%' : currentSize.height,
              maxWidth: '100%',
              maxHeight: '100%'
            }}
          >
            <iframe
              ref={iframeRef}
              className="w-full h-full border-0"
              title="Website Preview"
              srcDoc={createPreviewContent()}
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        </div>
      </div>

      {/* Device Info */}
      <div className="p-4 border-t border-border bg-background/50 backdrop-blur">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Dispositivo: {currentSize.label} 
            {activeDevice !== 'desktop' && ` (${currentSize.width} × ${currentSize.height})`}
          </span>
          <div className="flex items-center gap-4">
            <span>Zoom: 100%</span>
            <Button variant="ghost" size="sm" className="gap-2 text-xs">
              <ExternalLink className="w-3 h-3" />
              Abrir em nova aba
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};