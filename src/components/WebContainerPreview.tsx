import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { LiveProvider, LiveError, LivePreview } from 'react-live';
import { FileNode, FileTree } from './FileTree';
import { Code2, Eye } from 'lucide-react';
import { PreviewLoading } from './PreviewLoading';
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
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [reactCode, setReactCode] = useState<string>('');

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

  // Find file by path
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

  // Get all files recursively
  const getAllFiles = (nodes: FileNode[]): FileNode[] => {
    const result: FileNode[] = [];
    const walk = (list: FileNode[]) => {
      for (const node of list) {
        if (node.type === 'file') result.push(node);
        if (node.children) walk(node.children);
      }
    };
    walk(nodes);
    return result;
  };

  const handleFileSelect = (path: string) => {
    const file = findFile(files, path);
    setSelectedFile(file);
  };

  // Extract React code from files
  useEffect(() => {
    if (files.length === 0) return;

    const allFiles = getAllFiles(files);
    const appFile = allFiles.find(f => 
      f.name === 'App.tsx' || f.name === 'App.jsx' || f.path?.endsWith('App.tsx') || f.path?.endsWith('App.jsx')
    );

    if (appFile?.content) {
      // Remove import statements and export default
      let code = appFile.content;
      
      // Remove all import statements
      code = code.replace(/import\s+.*?from\s+['"].*?['"];?\s*/g, '');
      code = code.replace(/import\s+['"].*?['"];?\s*/g, '');
      
      // Remove export default and just keep the function
      code = code.replace(/export\s+default\s+/, '');
      
      // If it's a function component, we need to wrap it properly
      if (code.includes('function App')) {
        // Extract just the function body
        const match = code.match(/function\s+App\s*\([^)]*\)\s*{([\s\S]*)}$/);
        if (match) {
          code = `function App() {${match[1]}}`;
        }
      }
      
      setReactCode(code);
    }
  }, [files]);

  // Select first file for code view
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

  if (isGenerating) {
    return <PreviewLoading progress={generationProgress} />;
  }

  if (files.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <div className="text-center max-w-md mx-auto p-8">
          <p className="text-muted-foreground">Aguardando arquivos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-background to-muted/20">
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'preview' | 'code')} className="h-full flex flex-col">
        <div className="border-b bg-card/30 backdrop-blur-sm px-4">
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
        </div>

        <TabsContent value="preview" className="flex-1 m-0 p-0 data-[state=inactive]:hidden">
          <div className="h-full w-full bg-white overflow-auto">
            {reactCode ? (
              <LiveProvider 
                code={reactCode} 
                noInline={false}
                scope={{ 
                  React, 
                  useState, 
                  useEffect: useEffect,
                  useCallback,
                  useMemo,
                  useRef
                }}
              >
                <div className="h-full">
                  <LivePreview className="h-full" />
                  <LiveError className="bg-red-50 text-red-600 p-4 font-mono text-sm" />
                </div>
              </LiveProvider>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Aguardando código React...
              </div>
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
