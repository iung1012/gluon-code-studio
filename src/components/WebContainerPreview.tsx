import { useEffect, useState } from 'react';
import { Sandpack, SandpackFiles } from '@codesandbox/sandpack-react';
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
  const [sandpackFiles, setSandpackFiles] = useState<SandpackFiles>({});
  const [runtimeDeps, setRuntimeDeps] = useState<Record<string, string>>({});

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

  // Extract dependencies used in imports to ensure Sandpack installs them
  const extractDependenciesFromFiles = (nodes: FileNode[]): Record<string, string> => {
    const packages = new Set<string>();
    const importRegex = /from\s+['"]([^'\"]+)['"]|require\(\s*['"]([^'\"]+)['"]\s*\)/g;

    const addPackage = (specifier?: string) => {
      if (!specifier) return;
      if (specifier.startsWith('.') || specifier.startsWith('/')) return;
      let pkg = specifier;
      if (pkg.startsWith('@')) {
        const parts = pkg.split('/');
        if (parts.length >= 2) pkg = parts.slice(0, 2).join('/');
      } else {
        pkg = pkg.split('/')[0];
      }
      packages.add(pkg);
    };

    const walk = (list: FileNode[]) => {
      for (const n of list) {
        if (n.type === 'file' && n.content) {
          let m: RegExpExecArray | null;
          while ((m = importRegex.exec(n.content))) {
            addPackage(m[1] || m[2]);
          }
        }
        if (n.children) walk(n.children);
      }
    };

    walk(nodes);

    const versions: Record<string, string> = {
      react: '^18.3.1',
      'react-dom': '^18.3.1',
      'lucide-react': 'latest',
      'react-router-dom': '^6.30.1',
      clsx: '^2.1.1',
      zod: '^3.25.76',
      'react-hook-form': '^7.61.1',
      'tailwind-merge': '^2.6.0',
      'react-syntax-highlighter': '^15.6.1',
      prismjs: '^1.30.0',
      'date-fns': '^3.6.0',
      recharts: '^2.15.4',
    };

    const deps: Record<string, string> = {};
    // Always include react and react-dom
    deps.react = versions.react;
    deps['react-dom'] = versions['react-dom'];

    packages.forEach((pkg) => {
      if (versions[pkg]) {
        deps[pkg] = versions[pkg];
      }
    });

    return deps;
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

  // Convert FileNode[] to Sandpack file structure
  const buildSandpackFiles = (nodes: FileNode[], parentPath = ''): SandpackFiles => {
    const result: SandpackFiles = {};
    
    for (const node of nodes) {
      // Remove leading slash from path for Sandpack compatibility
      let fullPath = parentPath ? `${parentPath}/${node.name}` : node.name;
      
      // Skip files that can break CRA-based Sandpack runtime
      const skipNames = new Set([
        'package.json',
        'tailwind.config.js',
        'postcss.config.js',
        'vite.config.ts',
        'vite.config.js',
        'tsconfig.json',
        'tsconfig.app.json',
        'tsconfig.node.json',
      ]);
      if (skipNames.has(fullPath) || skipNames.has(node.name)) {
        continue;
      }
      
      if (node.type === 'file' && node.content) {
        let code = node.content;
        // Remove Tailwind directives which require a build step not available in Sandpack
        if (node.name.endsWith('.css')) {
          code = code.replace(/@tailwind\s+base;?/g, '')
                     .replace(/@tailwind\s+components;?/g, '')
                     .replace(/@tailwind\s+utilities;?/g, '');
        }
        result[fullPath] = { code };
      } else if (node.type === 'folder' && node.children) {
        const childPath = parentPath ? `${parentPath}/${node.name}` : node.name;
        Object.assign(result, buildSandpackFiles(node.children, childPath));
      }
    }
    
    return result;
  };

  useEffect(() => {
    if (files.length > 0) {
      const sandpackFileStructure = buildSandpackFiles(files);
      // Detect runtime dependencies from import statements
      const deps = extractDependenciesFromFiles(files);
      setRuntimeDeps(deps);

      // Adapter: if the generated project is Vite-style (index.html + src/main.tsx),
      // inject CRA-compatible entry files for the Sandpack "react-ts" runtime.
      const hasRootIndexHtml = Boolean(sandpackFileStructure['index.html']);
      const hasMainTsx = Boolean(sandpackFileStructure['src/main.tsx'] || sandpackFileStructure['src/main.jsx']);
      const hasIndexTsx = Boolean(sandpackFileStructure['src/index.tsx']);
      const hasPublicIndexHtml = Boolean(sandpackFileStructure['public/index.html']);

      if (hasRootIndexHtml && hasMainTsx && !hasIndexTsx) {
        sandpackFileStructure['src/index.tsx'] = {
          code: `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\n\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n);\n`
        };
      }

      if (!hasPublicIndexHtml) {
        sandpackFileStructure['public/index.html'] = {
          code: `<!DOCTYPE html>\n<html lang="en">\n  <head>\n    <meta charset="utf-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1" />\n    <title>App</title>\n  </head>\n  <body>\n    <div id="root"></div>\n  </body>\n</html>`
        };
      }

      setSandpackFiles(sandpackFileStructure);
      
      // Select first file for code view
      if (!selectedFile) {
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
    }
  }, [files, selectedFile]);

  if (isGenerating) {
    return <PreviewLoading progress={generationProgress} />;
  }

  if (Object.keys(sandpackFiles).length === 0) {
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
          <div className="h-full w-full [&>div]:h-full [&_.sp-wrapper]:!h-full [&_.sp-layout]:!h-full">
            <Sandpack
              template="react-ts"
              files={sandpackFiles}
              theme="dark"
              options={{
                bundlerURL: "https://sandpack.codesandbox.io",
                showNavigator: false,
                showTabs: false,
                showLineNumbers: true,
                editorHeight: "100%",
                editorWidthPercentage: 0,
                showInlineErrors: true,
                showConsole: false,
                showConsoleButton: false,
              }}
              customSetup={{
                entry: '/src/index.tsx',
                dependencies: runtimeDeps
              }}
            />
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
