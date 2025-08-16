import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Eye, Code, Copy, Check, Download } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { FileTree, FileNode } from "./FileTree";
import { LivePreview } from "./LivePreview";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ProjectFile } from "@/services/advancedCodeGenerator";
import { DownloadManager } from "@/utils/downloadManager";
import { useToast } from "@/hooks/use-toast";

interface CodePreviewProps {
  files: FileNode[];
  selectedFile?: {
    path: string;
    content: string;
  };
  onFileSelect: (path: string, content: string) => void;
  generatedCode?: string;
  projectFiles?: ProjectFile[];
  defaultTab?: string;
}

export const CodePreview = ({ 
  files, 
  selectedFile, 
  onFileSelect, 
  generatedCode, 
  projectFiles = [],
  defaultTab = "preview" 
}: CodePreviewProps) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState(defaultTab);
  const { toast } = useToast();

  const copyToClipboard = async (text: string) => {
    try {
      await DownloadManager.copyToClipboard(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copiado!",
        description: "Código copiado para a área de transferência.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o código.",
        variant: "destructive"
      });
    }
  };

  const downloadProject = async () => {
    if (projectFiles.length === 0) {
      toast({
        title: "Nenhum projeto",
        description: "Gere um projeto primeiro para fazer o download.",
        variant: "destructive"
      });
      return;
    }

    try {
      await DownloadManager.downloadProject(projectFiles, "meu-site");
      toast({
        title: "Download iniciado!",
        description: "Seu projeto está sendo baixado como arquivo ZIP.",
      });
    } catch (error) {
      toast({
        title: "Erro no download",
        description: "Não foi possível baixar o projeto. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const getFileLanguage = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'tsx':
      case 'jsx':
        return 'jsx';
      case 'ts':
        return 'typescript';
      case 'js':
        return 'javascript';
      case 'css':
        return 'css';
      case 'html':
        return 'html';
      case 'json':
        return 'json';
      default:
        return 'text';
    }
  };


  const codeToShow = selectedFile?.content || generatedCode || "";
  const filename = selectedFile?.path || "generated-code.tsx";

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    } else if (generatedCode) {
      setActiveTab("code");
    }
  }, [generatedCode, defaultTab]);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Visualização do Projeto</h2>
          <div className="flex items-center gap-2">
            {projectFiles.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={downloadProject}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </Button>
            )}
            {codeToShow && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(codeToShow)}
                className="gap-2"
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {copied ? 'Copiado!' : 'Copiar'}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-2 m-4 mb-0">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="code">Código</TabsTrigger>
          </TabsList>
          
          <TabsContent value="preview" className="h-full mt-4 mx-4 mb-4">
            <LivePreview files={projectFiles} className="h-full" />
          </TabsContent>
          
          <TabsContent value="code" className="h-full mt-4 mx-4 mb-4 overflow-hidden">
            <Card className="h-full overflow-hidden">
              <ResizablePanelGroup direction="horizontal" className="h-full">
                {/* Left side - File Tree */}
                <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
                  <div className="h-full border-r border-border">
                    <FileTree 
                      files={files}
                      selectedFile={selectedFile?.path}
                      onFileSelect={onFileSelect}
                    />
                  </div>
                </ResizablePanel>
                
                <ResizableHandle />
                
                {/* Right side - Code Content */}
                <ResizablePanel defaultSize={70} minSize={50}>
                  {codeToShow ? (
                    <div className="h-full overflow-auto">
                      <SyntaxHighlighter
                        language={getFileLanguage(filename)}
                        style={oneDark}
                        customStyle={{
                          margin: 0,
                          padding: '1rem',
                          background: 'hsl(var(--muted))',
                          fontSize: '14px',
                          lineHeight: '1.5',
                        }}
                        showLineNumbers
                      >
                        {codeToShow}
                      </SyntaxHighlighter>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-center p-8">
                      <div>
                        <Code className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">Nenhum código selecionado</h3>
                        <p className="text-muted-foreground">
                          Selecione um arquivo da árvore ou gere um novo código para visualizá-lo aqui
                        </p>
                      </div>
                    </div>
                  )}
                </ResizablePanel>
              </ResizablePanelGroup>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};