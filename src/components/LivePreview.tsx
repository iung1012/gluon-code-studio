import { useEffect, useRef } from 'react';
import { cn } from "@/lib/utils";
import { FileNode } from "./FileTree";

interface LivePreviewProps {
  files: FileNode[];
  selectedFile?: { path: string; content: string };
  onFileSelect?: (path: string, content: string) => void;
  generatedCode?: string;
  device?: 'desktop' | 'tablet' | 'mobile';
}

export const LivePreview = ({ files, generatedCode, device = 'desktop' }: LivePreviewProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  const htmlContent = files.length > 0 && files[0].content ? files[0].content : generatedCode || "";
  
  useEffect(() => {
    if (!iframeRef.current || !htmlContent) return;

    // Write the content to iframe
    const iframe = iframeRef.current;
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(htmlContent);
      iframeDoc.close();
    }
  }, [htmlContent]);
  
  if (!htmlContent) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <div className="w-16 h-16 bg-muted rounded-lg mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl">⚡</span>
          </div>
          <h3 className="text-lg font-medium mb-2">Preview HTML Monolítico</h3>
          <p className="text-muted-foreground max-w-sm">
            Gere um website HTML monolítico para ver o preview ao vivo aqui
          </p>
        </div>
      </div>
    );
  }

  const deviceStyles = {
    desktop: "w-full h-full",
    tablet: "w-[768px] h-[1024px] mx-auto border border-border rounded-lg shadow-lg",
    mobile: "w-[375px] h-[667px] mx-auto border border-border rounded-lg shadow-lg"
  };

  const containerStyles = {
    desktop: "w-full h-full",
    tablet: "w-full h-full flex items-center justify-center p-4 bg-muted/10",
    mobile: "w-full h-full flex items-center justify-center p-4 bg-muted/10"
  };

  return (
    <div className={cn("bg-background", containerStyles[device])}>
      <iframe
        ref={iframeRef}
        className={cn("border-0 bg-white", deviceStyles[device])}
        title="Preview do Website"
        sandbox="allow-scripts allow-same-origin allow-forms"
        style={{
          minHeight: device === 'desktop' ? '100%' : 'auto'
        }}
      />
    </div>
  );
};