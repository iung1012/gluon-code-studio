import { useEffect, useRef } from 'react';
import { FileNode } from './FileTree';

interface LivePreviewProps {
  files: FileNode[];
}

export const LivePreview = ({ files }: LivePreviewProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!iframeRef.current || files.length === 0) return;

    // Find HTML, CSS, and JS files
    const htmlFile = files.find(file => file.name === 'index.html' && file.type === 'file');
    const cssFile = files.find(file => file.name === 'styles.css' && file.type === 'file');
    const jsFile = files.find(file => file.name === 'script.js' && file.type === 'file');

    if (!htmlFile?.content) return;

    // Create a complete HTML document
    let htmlContent = htmlFile.content;

    // If CSS exists, inject it into the HTML
    if (cssFile?.content) {
      const styleTag = `<style>${cssFile.content}</style>`;
      
      // Try to inject before closing head tag, or create head if it doesn't exist
      if (htmlContent.includes('</head>')) {
        htmlContent = htmlContent.replace('</head>', `${styleTag}\n</head>`);
      } else {
        htmlContent = htmlContent.replace('<html', `<head>${styleTag}</head>\n<html`);
      }
    }

    // If JS exists, inject it into the HTML
    if (jsFile?.content) {
      const scriptTag = `<script>${jsFile.content}</script>`;
      
      // Try to inject before closing body tag, or at the end
      if (htmlContent.includes('</body>')) {
        htmlContent = htmlContent.replace('</body>', `${scriptTag}\n</body>`);
      } else {
        htmlContent += scriptTag;
      }
    }

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
            <span className="text-2xl">🌐</span>
          </div>
          <h3 className="text-lg font-medium mb-2">Preview Area</h3>
          <p className="text-muted-foreground max-w-sm">
            Gere um website com HTML, CSS e JavaScript para ver o preview ao vivo aqui
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