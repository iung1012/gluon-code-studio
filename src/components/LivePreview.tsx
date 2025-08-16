import { useEffect, useRef } from 'react';
import { FileNode } from './FileTree';

interface LivePreviewProps {
  files: FileNode[];
}

export const LivePreview = ({ files }: LivePreviewProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!iframeRef.current || files.length === 0) return;

    // Find the main JavaScript file (app.js for monolithic architecture)
    const jsFile = files.find(file => 
      (file.name === 'app.js' || file.name.endsWith('.js')) && file.type === 'file'
    );

    if (!jsFile?.content) return;

    // Create a complete HTML document that will execute the monolithic JS
    const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>JavaScript Monolítico Preview</title>
    <style>
        body { margin: 0; padding: 0; }
    </style>
</head>
<body>
    <script>
        ${jsFile.content}
    </script>
</body>
</html>`;

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
          <h3 className="text-lg font-medium mb-2">Preview JavaScript Monolítico</h3>
          <p className="text-muted-foreground max-w-sm">
            Gere um website JavaScript monolítico para ver o preview ao vivo aqui
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