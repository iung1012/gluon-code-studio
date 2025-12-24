import { useEffect, useRef, useState } from 'react';
import { WebContainer } from '@webcontainer/api';
import { FileNode } from './FileTree';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Terminal, Monitor, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StackBlitzPreviewProps {
  files: FileNode[];
  isGenerating?: boolean;
  generationProgress?: number;
}

// Singleton instance for WebContainer
let webcontainerInstance: WebContainer | null = null;
let bootPromise: Promise<WebContainer> | null = null;

async function getWebContainerInstance(): Promise<WebContainer> {
  if (webcontainerInstance) {
    return webcontainerInstance;
  }
  
  if (bootPromise) {
    return bootPromise;
  }
  
  bootPromise = WebContainer.boot();
  webcontainerInstance = await bootPromise;
  return webcontainerInstance;
}

export const StackBlitzPreview = ({ 
  files, 
  isGenerating = false, 
  generationProgress = 0 
}: StackBlitzPreviewProps) => {
  const [url, setUrl] = useState<string>('');
  const [isBooting, setIsBooting] = useState(true);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const terminalRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<WebContainer | null>(null);
  const hasSetupRef = useRef(false);

  const addOutput = (message: string) => {
    setTerminalOutput(prev => [...prev, message]);
    setTimeout(() => {
      if (terminalRef.current) {
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
      }
    }, 10);
  };

  // Flatten FileNode tree to flat file structure for WebContainer
  const flattenFiles = (nodes: FileNode[], basePath = ''): Record<string, any> => {
    const result: Record<string, any> = {};
    
    for (const node of nodes) {
      const fullPath = basePath ? `${basePath}/${node.name}` : node.name;
      
      if (node.type === 'folder' && node.children) {
        const children = flattenFiles(node.children, fullPath);
        result[node.name] = {
          directory: children
        };
      } else if (node.type === 'file' && node.content !== undefined) {
        result[node.name] = {
          file: {
            contents: node.content
          }
        };
      }
    }
    
    return result;
  };

  // Convert nested structure to WebContainer mount format
  const convertToMountStructure = (nodes: FileNode[]): Record<string, any> => {
    return flattenFiles(nodes);
  };

  const setupProject = async () => {
    if (files.length === 0 || hasSetupRef.current) return;
    
    try {
      setError(null);
      setIsBooting(true);
      addOutput('🚀 Iniciando WebContainer...');
      
      const webcontainer = await getWebContainerInstance();
      containerRef.current = webcontainer;
      
      addOutput('✅ WebContainer pronto!');
      setIsBooting(false);
      
      // Mount files
      addOutput('📁 Montando arquivos...');
      const mountStructure = convertToMountStructure(files);
      await webcontainer.mount(mountStructure);
      addOutput(`✅ ${files.length} arquivos montados`);
      
      // Install dependencies
      setIsInstalling(true);
      addOutput('📦 Instalando dependências (npm install)...');
      
      const installProcess = await webcontainer.spawn('npm', ['install']);
      
      installProcess.output.pipeTo(new WritableStream({
        write(data) {
          addOutput(data);
        }
      }));
      
      const installExitCode = await installProcess.exit;
      
      if (installExitCode !== 0) {
        throw new Error(`npm install falhou com código ${installExitCode}`);
      }
      
      addOutput('✅ Dependências instaladas!');
      setIsInstalling(false);
      
      // Start dev server
      setIsStarting(true);
      addOutput('🔧 Iniciando servidor de desenvolvimento...');
      
      const devProcess = await webcontainer.spawn('npm', ['run', 'dev']);
      
      devProcess.output.pipeTo(new WritableStream({
        write(data) {
          addOutput(data);
        }
      }));
      
      // Listen for server-ready event
      webcontainer.on('server-ready', (port, serverUrl) => {
        addOutput(`✅ Servidor pronto na porta ${port}`);
        addOutput(`🌐 URL: ${serverUrl}`);
        setUrl(serverUrl);
        setIsStarting(false);
      });
      
      hasSetupRef.current = true;
      
    } catch (err) {
      console.error('WebContainer error:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      addOutput(`❌ Erro: ${errorMessage}`);
      setIsBooting(false);
      setIsInstalling(false);
      setIsStarting(false);
    }
  };

  const handleRetry = async () => {
    hasSetupRef.current = false;
    setTerminalOutput([]);
    setUrl('');
    setError(null);
    await setupProject();
  };

  useEffect(() => {
    if (files.length > 0 && !hasSetupRef.current) {
      setupProject();
    }
  }, [files]);

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

  // Show error state
  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <AlertCircle className="w-12 h-12 text-destructive" />
              <div>
                <h3 className="font-semibold text-lg">Erro no WebContainer</h3>
                <p className="text-sm text-muted-foreground mt-2">{error}</p>
              </div>
              <Button onClick={handleRetry} variant="outline" className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Tentar novamente
              </Button>
            </div>
          </CardContent>
        </Card>
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

  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="preview" className="flex-1 flex flex-col">
        <div className="border-b px-4 py-2 bg-card/30">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="preview" className="gap-2">
              <Monitor className="w-4 h-4" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="terminal" className="gap-2">
              <Terminal className="w-4 h-4" />
              Terminal
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="preview" className="flex-1 m-0 relative">
          {(isBooting || isInstalling || isStarting) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-10">
              <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
              <p className="text-sm font-medium">
                {isBooting && 'Iniciando WebContainer...'}
                {isInstalling && 'Instalando dependências...'}
                {isStarting && 'Iniciando servidor...'}
              </p>
            </div>
          )}
          
          {url ? (
            <iframe
              ref={iframeRef}
              src={url}
              className="w-full h-full border-0"
              title="Preview"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            />
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <p>Aguardando servidor iniciar...</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="terminal" className="flex-1 m-0">
          <ScrollArea className="h-full">
            <div 
              ref={terminalRef}
              className="p-4 font-mono text-xs bg-zinc-950 text-green-400 min-h-full"
            >
              {terminalOutput.map((line, index) => (
                <div key={index} className="whitespace-pre-wrap break-all">
                  {line}
                </div>
              ))}
              {terminalOutput.length === 0 && (
                <span className="text-muted-foreground">
                  Aguardando output do terminal...
                </span>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};
