import { useEffect, useRef, useState } from 'react';
import { FileNode } from './FileTree';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Terminal, Monitor, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sandpack } from "@codesandbox/sandpack-react";

interface StackBlitzPreviewProps {
  files: FileNode[];
  isGenerating?: boolean;
  generationProgress?: number;
}

export const StackBlitzPreview = ({ 
  files, 
  isGenerating = false, 
  generationProgress = 0 
}: StackBlitzPreviewProps) => {
  const [useFallback, setUseFallback] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Check if crossOriginIsolated is available (required for WebContainer)
  useEffect(() => {
    const checkCrossOriginIsolated = () => {
      // WebContainer requires crossOriginIsolated to be true
      // This requires specific COEP/COOP headers that Lovable preview doesn't support
      if (typeof window !== 'undefined' && !window.crossOriginIsolated) {
        console.log('crossOriginIsolated not available, using Sandpack fallback');
        setUseFallback(true);
      }
      setIsChecking(false);
    };
    
    checkCrossOriginIsolated();
  }, []);

  // Convert FileNode array to Sandpack files format
  const getSandpackFiles = () => {
    const result: Record<string, string> = {};
    
    const flattenFiles = (nodes: FileNode[], basePath = '') => {
      for (const node of nodes) {
        const fullPath = basePath ? `${basePath}/${node.name}` : node.name;
        
        if (node.type === 'file' && node.content) {
          const sandpackPath = fullPath.startsWith('/') ? fullPath : `/${fullPath}`;
          result[sandpackPath] = node.content;
        } else if (node.type === 'folder' && node.children) {
          flattenFiles(node.children, fullPath);
        }
      }
    };
    
    flattenFiles(files);
    return result;
  };

  // Show generation progress
  if (isGenerating) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <div className="text-center">
            <p className="text-lg font-medium">Gerando projeto...</p>
            <p className="text-sm text-muted-foreground mt-1">
              {generationProgress}% concluído
            </p>
          </div>
          <div className="w-64 h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${generationProgress}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Show checking state
  if (isChecking) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show no files state
  if (files.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <Monitor className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>Nenhum arquivo para visualizar</p>
          <p className="text-sm mt-1">Gere um projeto para ver o preview</p>
        </div>
      </div>
    );
  }

  // Use Sandpack as it works without COEP/COOP headers
  const sandpackFiles = getSandpackFiles();
  
  // Parse package.json if exists to get dependencies
  const customSetup: { dependencies: Record<string, string> } = {
    dependencies: {},
  };

  if ('/package.json' in sandpackFiles) {
    try {
      const pkgJson = JSON.parse(sandpackFiles['/package.json']);
      customSetup.dependencies = {
        ...pkgJson.dependencies,
        ...pkgJson.devDependencies,
      };
    } catch (e) {
      console.warn('Failed to parse package.json:', e);
    }
  }

  // Ensure we have React dependencies
  if (!customSetup.dependencies['react']) {
    customSetup.dependencies['react'] = '^18.2.0';
  }
  if (!customSetup.dependencies['react-dom']) {
    customSetup.dependencies['react-dom'] = '^18.2.0';
  }

  return (
    <div className="h-full w-full [&_.sp-wrapper]:h-full [&_.sp-layout]:h-full [&_.sp-stack]:h-full">
      <Sandpack
        template="react-ts"
        theme="dark"
        files={sandpackFiles}
        customSetup={customSetup}
        options={{
          showNavigator: true,
          showTabs: true,
          showLineNumbers: true,
          showInlineErrors: true,
          wrapContent: true,
          editorHeight: "100%",
          showConsole: true,
          showConsoleButton: true,
        }}
      />
    </div>
  );
};
