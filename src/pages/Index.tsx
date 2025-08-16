import { useState, useEffect } from "react";
import { PromptInput } from "@/components/PromptInput";
import { FileTree, FileNode } from "@/components/FileTree";
import { CodePreview } from "@/components/CodePreview";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { SidebarMenu } from "@/components/SidebarMenu";
import { ApiKeyInput } from "@/components/ApiKeyInput";
import { GLMApiService } from "@/services/glmApi";
import { AdvancedCodeGenerator, ProjectFile } from "@/services/advancedCodeGenerator";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

const Index = () => {
  const [apiKey, setApiKey] = useState<string>("");
  const [glmService, setGlmService] = useState<GLMApiService | null>(null);
  const [advancedGenerator, setAdvancedGenerator] = useState<AdvancedCodeGenerator | null>(null);
  const [files, setFiles] = useState<FileNode[]>([]);
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<{path: string, content: string} | undefined>();
  const [generatedCode, setGeneratedCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const { toast } = useToast();

  // Load API key from localStorage on mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem("glm-api-key");
    if (savedApiKey) {
      setApiKey(savedApiKey);
      setGlmService(new GLMApiService(savedApiKey));
      setAdvancedGenerator(new AdvancedCodeGenerator(savedApiKey));
    }
  }, []);

  const handleApiKeySubmit = (key: string) => {
    setApiKey(key);
    localStorage.setItem("glm-api-key", key);
    setGlmService(new GLMApiService(key));
    setAdvancedGenerator(new AdvancedCodeGenerator(key));
    toast({
      title: "API Key Saved",
      description: "You can now start generating websites!",
    });
  };

  const parseProjectStructure = (content: string): { files: FileNode[], projectFiles: ProjectFile[] } => {
    try {
      // Remove any markdown code blocks
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      const parsed = JSON.parse(cleanContent);
      const projectFiles = parsed.files || [];
      
      // Convert ProjectFile[] to FileNode[] for backward compatibility
      const convertToFileNodes = (pFiles: ProjectFile[]): FileNode[] => {
        return pFiles.map(pFile => ({
          name: pFile.name,
          type: pFile.type,
          path: pFile.path,
          content: pFile.content,
          children: pFile.children ? convertToFileNodes(pFile.children) : undefined
        }));
      };

      return {
        files: convertToFileNodes(projectFiles),
        projectFiles: projectFiles
      };
    } catch (error) {
      console.error('Error parsing project structure:', error);
      // Fallback: create a single file with the generated content
      const fallbackFile = {
        name: "index.html",
        type: "file" as const,
        path: "./index.html",
        content: content
      };
      return {
        files: [fallbackFile],
        projectFiles: [fallbackFile]
      };
    }
  };

  const handlePromptSubmit = async (prompt: string) => {
    if (!advancedGenerator) return;

    setIsLoading(true);
    setShowWelcome(false);
    
    try {
      const response = await advancedGenerator.generateAdvancedProject(prompt);
      const { files, projectFiles } = parseProjectStructure(response);
      
      setFiles(files);
      setProjectFiles(projectFiles);
      setGeneratedCode(response);
      
      // Auto-select the first file
      const firstFile = findFirstFile(files);
      if (firstFile) {
        setSelectedFile({ path: firstFile.path, content: firstFile.content || "" });
      }

      toast({
        title: "Site Gerado com Sucesso!",
        description: "Seu projeto completo foi criado com HTML, CSS, JS e Node.js.",
      });
    } catch (error) {
      console.error('Error generating code:', error);
      toast({
        title: "Erro na Geração",
        description: error instanceof Error ? error.message : "Falha ao gerar o site. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const findFirstFile = (nodes: FileNode[]): FileNode | null => {
    for (const node of nodes) {
      if (node.type === 'file' && node.content) {
        return node;
      }
      if (node.type === 'folder' && node.children) {
        const found = findFirstFile(node.children);
        if (found) return found;
      }
    }
    return null;
  };

  const handleFileSelect = (path: string, content: string) => {
    setSelectedFile({ path, content });
  };

  const handleNewChat = () => {
    setShowWelcome(true);
    setFiles([]);
    setProjectFiles([]);
    setSelectedFile(undefined);
    setGeneratedCode("");
  };

  if (!apiKey || !glmService) {
    return <ApiKeyInput onApiKeySubmit={handleApiKeySubmit} />;
  }

  if (showWelcome) {
    return (
      <>
        <SidebarMenu 
          onNewChat={handleNewChat}
        />
        <WelcomeScreen 
          onSubmit={handlePromptSubmit}
          isLoading={isLoading}
        />
      </>
    );
  }

  return (
    <div className="h-screen bg-background relative">
      <SidebarMenu 
        onNewChat={handleNewChat}
      />
      
      <div className="h-full">
        <Tabs defaultValue="chat" className="h-full">
          <div className="border-b border-border px-4">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="code">Código</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="chat" className="h-full mt-0">
            <ResizablePanelGroup direction="horizontal" className="h-full">
              <ResizablePanel defaultSize={30} minSize={25} maxSize={45}>
                <div className="h-full border-r border-border">
                  <PromptInput onSubmit={handlePromptSubmit} isLoading={isLoading} />
                </div>
              </ResizablePanel>
              <ResizableHandle />
              <ResizablePanel defaultSize={70} minSize={55}>
                <CodePreview 
                  files={files}
                  selectedFile={selectedFile}
                  onFileSelect={handleFileSelect}
                  generatedCode={!selectedFile ? generatedCode : undefined}
                  projectFiles={projectFiles}
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          </TabsContent>
          
          <TabsContent value="code" className="h-full mt-0">
            <CodePreview 
              files={files}
              selectedFile={selectedFile}
              onFileSelect={handleFileSelect}
              generatedCode={!selectedFile ? generatedCode : undefined}
              projectFiles={projectFiles}
              defaultTab="code"
            />
          </TabsContent>
          
          <TabsContent value="preview" className="h-full mt-0">
            <CodePreview 
              files={files}
              selectedFile={selectedFile}
              onFileSelect={handleFileSelect}
              generatedCode={!selectedFile ? generatedCode : undefined}
              projectFiles={projectFiles}
              defaultTab="preview"
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
