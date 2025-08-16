import { useEffect, useRef } from 'react';
import { FileNode } from './FileTree';

interface LivePreviewProps {
  files: FileNode[];
}

export const LivePreview = ({ files }: LivePreviewProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!iframeRef.current || files.length === 0) return;

    // Find the main HTML file (index.html for monolithic architecture)
    const htmlFile = files.find(file => 
      (file.name === 'index.html' || file.name.endsWith('.html')) && file.type === 'file'
    );

    if (!htmlFile?.content) return;

    // Use the HTML content directly since it's already complete
    const htmlContent = htmlFile.content;

    // Write the content to iframe
    const iframe = iframeRef.current;
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(htmlContent);
      iframeDoc.close();
    }
  }, [files]);

  if (files.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-center p-8">
        <div>
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

  return (
    <iframe
      ref={iframeRef}
      className="w-full h-full border-0 rounded-lg bg-white"
      title="Live Preview"
      sandbox="allow-scripts allow-same-origin"
    />
  );
};