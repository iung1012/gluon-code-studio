import { useEffect, useRef, useState } from 'react';
import { WebContainer } from '@webcontainer/api';
import type { FileSystemTree } from '@webcontainer/api';
import { FileNode, FileTree } from './FileTree';
import { AlertCircle, Terminal as TerminalIcon, Monitor, Code2, Eye } from 'lucide-react';
import { PreviewLoading } from './PreviewLoading';
import { cn } from '@/lib/utils';
import Editor from '@monaco-editor/react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface WebContainerPreviewProps {
  files: FileNode[];
  isGenerating?: boolean;
  generationProgress?: number;
}

export const WebContainerPreview = ({ 
  files, 
  isGenerating = false,
  generationProgress 
}: WebContainerPreviewProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [container, setContainer] = useState<WebContainer | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [isBooting, setIsBooting] = useState(true);
  const [showTerminal, setShowTerminal] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);

  const addLog = (message: string) => {
    setLogs(prev => [...prev.slice(-50), `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const getFileLanguage = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      ts: 'typescript',
      tsx: 'typescript',
      js: 'javascript',
      jsx: 'javascript',
      json: 'json',
      html: 'html',
      css: 'css',
      md: 'markdown',
    };
    return languageMap[ext || ''] || 'plaintext';
  };

  const handleFileSelect = (path: string, content: string) => {
    const findFile = (nodes: FileNode[], targetPath: string): FileNode | null => {
      for (const node of nodes) {
        if (node.path === targetPath) return node;
        if (node.children) {
          const found = findFile(node.children, targetPath);
          if (found) return found;
        }
      }
      return null;
    };
    const file = findFile(files, path);
    setSelectedFile(file);
  };

  useEffect(() => {
    if (files.length > 0 && !selectedFile) {
      const findFirstFile = (nodes: FileNode[]): FileNode | null => {
        for (const node of nodes) {
          if (node.type === 'file') return node;
          if (node.children) {
            const found = findFirstFile(node.children);
            if (found) return found;
          }
        }
        return null;
      };
      const firstFile = findFirstFile(files);
      if (firstFile) setSelectedFile(firstFile);
    }
  }, [files, selectedFile]);

  // Convert FileNode[] to WebContainer file structure
  const buildFileTree = (nodes: FileNode[]): FileSystemTree => {
    const result: FileSystemTree = {};
    
    for (const node of nodes) {
      if (node.type === 'file' && node.content) {
        result[node.name] = {
          file: {
            contents: node.content
          }
        };
      } else if (node.type === 'folder' && node.children) {
        result[node.name] = {
          directory: buildFileTree(node.children)
        };
      }
    }
    
    return result;
  };

  // Initialize WebContainer
  useEffect(() => {
    let mounted = true;
    
    const bootContainer = async () => {
      try {
        addLog('🚀 Booting WebContainer...');
        const instance = await WebContainer.boot();
        
        if (!mounted) return;
        
        setContainer(instance);
        addLog('✅ WebContainer ready');
        setIsBooting(false);
      } catch (err) {
        console.error('WebContainer boot error:', err);
        setError('Failed to initialize WebContainer');
        addLog(`❌ Boot error: ${err}`);
        setIsBooting(false);
      }
    };

    bootContainer();

    return () => {
      mounted = false;
    };
  }, []);

  // Mount files and start dev server
  useEffect(() => {
    if (!container || files.length === 0 || isBooting) return;

    let mounted = true;

    const setupProject = async () => {
      try {
        addLog('📁 Mounting files...');
        const fileTree = buildFileTree(files);
        await container.mount(fileTree);
        addLog('✅ Files mounted');

        // Install dependencies
        addLog('📦 Installing dependencies...');
        const installProcess = await container.spawn('npm', ['install']);
        
        installProcess.output.pipeTo(new WritableStream({
          write(data) {
            addLog(data);
          }
        }));

        const installExit = await installProcess.exit;
        
        if (installExit !== 0) {
          throw new Error(`npm install failed with code ${installExit}`);
        }
        
        addLog('✅ Dependencies installed');

        // Start dev server
        addLog('🚀 Starting dev server...');
        const devProcess = await container.spawn('npm', ['run', 'dev']);
        
        devProcess.output.pipeTo(new WritableStream({
          write(data) {
            addLog(data);
            
            // Detect server URL
            const urlMatch = data.match(/https?:\/\/[^\s]+/);
            if (urlMatch && mounted) {
              setPreviewUrl(urlMatch[0]);
              addLog(`✅ Dev server ready at ${urlMatch[0]}`);
            }
          }
        }));

        container.on('server-ready', (port, url) => {
          if (mounted) {
            setPreviewUrl(url);
            addLog(`✅ Server ready on port ${port}`);
          }
        });

      } catch (err) {
        console.error('Setup error:', err);
        setError(`Setup failed: ${err}`);
        addLog(`❌ Error: ${err}`);
      }
    };

    setupProject();

    return () => {
      mounted = false;
    };
  }, [container, files, isBooting]);

  if (isGenerating) {
    return <PreviewLoading progress={generationProgress} />;
  }

  if (isBooting) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 bg-primary/10 rounded-2xl mx-auto mb-6 flex items-center justify-center">
            <Monitor className="w-10 h-10 text-primary/60 animate-pulse" />
          </div>
          <h3 className="text-xl font-medium mb-3 text-foreground">Inicializando WebContainer</h3>
          <p className="text-muted-foreground leading-relaxed">
            Preparando ambiente de desenvolvimento...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-destructive/10 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-destructive/60" />
          </div>
          <h3 className="text-lg font-medium mb-2 text-foreground">Erro no WebContainer</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Recarregar Página
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-background to-muted/20">
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'preview' | 'code')} className="h-full flex flex-col">
        <div className="border-b bg-card/30 backdrop-blur-sm px-4 flex items-center justify-between">
          <TabsList className="bg-transparent h-12">
            <TabsTrigger value="preview" className="gap-2 data-[state=active]:bg-background/60">
              <Eye className="w-4 h-4" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="code" className="gap-2 data-[state=active]:bg-background/60">
              <Code2 className="w-4 h-4" />
              Código
            </TabsTrigger>
          </TabsList>

          <button
            onClick={() => setShowTerminal(!showTerminal)}
            className="flex items-center gap-2 px-3 py-2 bg-background/80 backdrop-blur-sm border border-border/40 rounded-lg hover:bg-background transition-colors text-sm"
          >
            <TerminalIcon className="w-4 h-4" />
            <span className="hidden sm:inline">{showTerminal ? 'Ocultar' : 'Mostrar'} Terminal</span>
          </button>
        </div>

        {showTerminal && (
          <div className="w-full h-48 bg-black/90 text-green-400 font-mono text-xs p-4 overflow-y-auto border-b border-border/40">
            {logs.map((log, i) => (
              <div key={i} className="whitespace-pre-wrap">{log}</div>
            ))}
          </div>
        )}

        <TabsContent value="preview" className="flex-1 m-0 data-[state=inactive]:hidden">
          <div className="h-full relative">
            {!previewUrl ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Aguardando servidor de desenvolvimento...</p>
                </div>
              </div>
            ) : (
              <iframe
                ref={iframeRef}
                src={previewUrl}
                className="w-full h-full border-0 bg-white"
                title="React App Preview"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="code" className="flex-1 m-0 data-[state=inactive]:hidden">
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={25} minSize={15} maxSize={40}>
              <div className="h-full overflow-auto bg-card/20 border-r border-border/40 p-4">
                <h3 className="text-sm font-medium mb-3 text-foreground">Arquivos</h3>
                <FileTree
                  files={files}
                  onFileSelect={handleFileSelect}
                  selectedFile={selectedFile?.path}
                />
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle className="w-1 bg-border/50 hover:bg-border/80" />

            <ResizablePanel defaultSize={75} minSize={60}>
              <div className="h-full bg-background">
                {selectedFile && selectedFile.content ? (
                  <div className="h-full flex flex-col">
                    <div className="px-4 py-2 bg-card/30 border-b border-border/40 text-sm font-medium text-foreground">
                      {selectedFile.path}
                    </div>
                    <Editor
                      height="100%"
                      language={getFileLanguage(selectedFile.name)}
                      value={selectedFile.content}
                      theme="vs-dark"
                      options={{
                        readOnly: true,
                        minimap: { enabled: false },
                        fontSize: 13,
                        lineNumbers: 'on',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                      }}
                    />
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    Selecione um arquivo para visualizar
                  </div>
                )}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </TabsContent>
      </Tabs>
    </div>
  );
};
