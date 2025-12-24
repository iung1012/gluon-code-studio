import { Sandpack } from "@codesandbox/sandpack-react";
import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  content?: string;
  children?: FileNode[];
}

interface SandpackPreviewProps {
  files: FileNode[];
  isGenerating: boolean;
  generationProgress: number;
}

export function SandpackPreview({ files, isGenerating, generationProgress }: SandpackPreviewProps) {
  // Convert FileNode array to Sandpack files format
  const sandpackFiles = useMemo(() => {
    const result: Record<string, string> = {};
    
    const flattenFiles = (nodes: FileNode[], basePath = '') => {
      for (const node of nodes) {
        const fullPath = basePath ? `${basePath}/${node.name}` : node.name;
        
        if (node.type === 'file' && node.content) {
          // Sandpack expects paths starting with /
          const sandpackPath = fullPath.startsWith('/') ? fullPath : `/${fullPath}`;
          result[sandpackPath] = node.content;
        } else if (node.type === 'folder' && node.children) {
          flattenFiles(node.children, fullPath);
        }
      }
    };
    
    flattenFiles(files);
    return result;
  }, [files]);

  // Check if we have a valid React project
  const hasPackageJson = '/package.json' in sandpackFiles;
  const hasAppFile = '/src/App.tsx' in sandpackFiles || '/src/App.jsx' in sandpackFiles || '/App.tsx' in sandpackFiles;

  if (isGenerating) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <Card className="w-80">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div className="text-center">
                <p className="font-medium">Gerando código...</p>
                <p className="text-sm text-muted-foreground">{generationProgress}% concluído</p>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${generationProgress}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium">Nenhum arquivo gerado</p>
          <p className="text-sm">Envie uma mensagem para gerar código</p>
        </div>
      </div>
    );
  }

  // Build custom setup based on detected files
  const customSetup = {
    dependencies: {} as Record<string, string>,
  };

  // Parse package.json if exists to get dependencies
  if (hasPackageJson) {
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
    <div className="h-full w-full [&_.sp-wrapper]:h-full [&_.sp-layout]:h-full">
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
        }}
      />
    </div>
  );
}
