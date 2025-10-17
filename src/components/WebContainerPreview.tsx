import { useEffect, useRef, useState } from 'react';
import { WebContainer } from '@webcontainer/api';
import type { FileNode } from './FileTree';
import { Card } from './ui/card';
import { AlertCircle, Loader2, Terminal as TerminalIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '@/lib/utils';

interface WebContainerPreviewProps {
  files: FileNode[];
  isGenerating?: boolean;
  generationProgress?: number;
}

export const WebContainerPreview = ({ 
  files, 
  isGenerating = false,
  generationProgress = 0 
}: WebContainerPreviewProps) => {
  const [webcontainer, setWebcontainer] = useState<WebContainer | null>(null);
  const [url, setUrl] = useState<string>('');
  const [isBooting, setIsBooting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Boot WebContainer
  useEffect(() => {
    let isMounted = true;

    const bootContainer = async () => {
      try {
        console.log('🚀 Booting WebContainer...');
        const instance = await WebContainer.boot();
        
        if (!isMounted) {
          await instance.teardown();
          return;
        }

        setWebcontainer(instance);
        setIsBooting(false);
        console.log('✅ WebContainer booted successfully');
      } catch (err) {
        console.error('❌ Failed to boot WebContainer:', err);
        setError(err instanceof Error ? err.message : 'Failed to boot WebContainer');
        setIsBooting(false);
      }
    };

    bootContainer();

    return () => {
      isMounted = false;
      if (webcontainer) {
        webcontainer.teardown();
      }
    };
  }, []);

  // Mount files and run dev server
  useEffect(() => {
    if (!webcontainer || files.length === 0 || isBooting) return;

    const setupProject = async () => {
      try {
        setError(null);
        setTerminalOutput(['📦 Installing dependencies...']);

        // Convert FileNode array to WebContainer file structure
        const fileTree: Record<string, any> = {};
        
        const processNode = (node: FileNode, path: string = '') => {
          const fullPath = path ? `${path}/${node.name}` : node.name;
          
          if (node.type === 'file' && node.content) {
            // Create nested structure
            const parts = fullPath.split('/');
            let current = fileTree;
            
            for (let i = 0; i < parts.length - 1; i++) {
              if (!current[parts[i]]) {
                current[parts[i]] = { directory: {} };
              }
              current = current[parts[i]].directory;
            }
            
            current[parts[parts.length - 1]] = {
              file: { contents: node.content }
            };
          } else if (node.type === 'folder' && node.children) {
            node.children.forEach(child => processNode(child, fullPath));
          }
        };

        files.forEach(node => processNode(node));

        console.log('📁 Mounting files...', Object.keys(fileTree));
        await webcontainer.mount(fileTree);

        // Install dependencies
        const installProcess = await webcontainer.spawn('npm', ['install']);
        
        installProcess.output.pipeTo(new WritableStream({
          write(data) {
            setTerminalOutput(prev => [...prev, data]);
            if (terminalRef.current) {
              terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
            }
          }
        }));

        const installExitCode = await installProcess.exit;
        
        if (installExitCode !== 0) {
          throw new Error(`npm install failed with exit code ${installExitCode}`);
        }

        setTerminalOutput(prev => [...prev, '✅ Dependencies installed', '🚀 Starting dev server...']);

        // Start dev server
        const devProcess = await webcontainer.spawn('npm', ['run', 'dev']);
        
        devProcess.output.pipeTo(new WritableStream({
          write(data) {
            setTerminalOutput(prev => [...prev, data]);
            if (terminalRef.current) {
              terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
            }
          }
        }));

        // Wait for server to be ready
        webcontainer.on('server-ready', (port, serverUrl) => {
          console.log('✅ Server ready at:', serverUrl);
          setUrl(serverUrl);
          setTerminalOutput(prev => [...prev, `✅ Server running at ${serverUrl}`]);
        });

      } catch (err) {
        console.error('❌ Error setting up project:', err);
        setError(err instanceof Error ? err.message : 'Failed to setup project');
        setTerminalOutput(prev => [...prev, `❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}`]);
      }
    };

    setupProject();
  }, [webcontainer, files, isBooting]);

  if (isGenerating) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Gerando código... {generationProgress}%</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <Card className="p-8 max-w-md">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-8 h-8 text-destructive flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-lg mb-2">WebContainer Error</h3>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <p className="text-xs text-muted-foreground">
                Certifique-se que seu navegador suporta WebContainers e que não está em modo privado/anônimo.
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (isBooting) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Iniciando WebContainer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="preview" className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b">
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="terminal">
            <TerminalIcon className="w-4 h-4 mr-2" />
            Terminal
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="preview" className="flex-1 m-0">
          {url ? (
            <iframe
              ref={iframeRef}
              src={url}
              className="w-full h-full border-0"
              title="WebContainer Preview"
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Aguardando servidor...</p>
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="terminal" className="flex-1 m-0 bg-black/95">
          <ScrollArea className="h-full">
            <div 
              ref={terminalRef}
              className={cn(
                "p-4 font-mono text-xs text-green-400",
                "whitespace-pre-wrap break-all"
              )}
            >
              {terminalOutput.map((line, i) => (
                <div key={i} className="mb-1">{line}</div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};
