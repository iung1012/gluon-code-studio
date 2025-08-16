import { useState, useEffect } from "react";
import { GLMApiService } from "@/services/glmApi";
import { AdvancedCodeGenerator } from "@/services/advancedCodeGenerator";
import { DownloadManager } from "@/utils/downloadManager";
import { ApiKeyInput } from "@/components/ApiKeyInput";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { SidebarMenu } from "@/components/SidebarMenu";
import { ResponsivePreview } from "@/components/ResponsivePreview";
import { CodePreview } from "@/components/CodePreview";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { toast } from "sonner";
import { FileNode } from "@/components/FileTree";

export default function Index() {
  const [apiKey, setApiKey] = useState<string>("");
  const [glmService, setGlmService] = useState<GLMApiService | null>(null);
  const [codeGenerator, setCodeGenerator] = useState<AdvancedCodeGenerator | null>(null);
  const [files, setFiles] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<{ path: string; content: string } | undefined>();
  const [generatedCode, setGeneratedCode] = useState<string>("");
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [cssContent, setCssContent] = useState<string>("");
  const [jsContent, setJsContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentView, setCurrentView] = useState<'welcome' | 'editor'>('welcome');
  const [currentChatId, setCurrentChatId] = useState<string>("");
  const [projectName, setProjectName] = useState<string>("");

  // Load API key on mount
  useEffect(() => {
    const savedKey = localStorage.getItem("glm_api_key");
    if (savedKey) {
      handleApiKeySubmit(savedKey);
    }
  }, []);

  const handleApiKeySubmit = (key: string) => {
    setApiKey(key);
    setGlmService(new GLMApiService(key));
    setCodeGenerator(new AdvancedCodeGenerator(key));
    localStorage.setItem("glm_api_key", key);
  };

  const parseProjectStructure = (content: string): FileNode[] => {
    try {
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanContent);
      return parsed.files || [];
    } catch (error) {
      console.error('Error parsing project structure:', error);
      return [{
        name: "App.tsx",
        type: "file" as const,
        path: "src/App.tsx",
        content: content
      }];
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

  const handlePromptSubmit = async (prompt: string) => {
    if (!codeGenerator) return;

    setIsLoading(true);
    setCurrentView('editor');
    setProjectName(DownloadManager.generateProjectName(prompt));
    
    try {
      // Generate advanced project
      const project = await codeGenerator.generateAdvancedProject(prompt);
      
      // Set content for preview
      setHtmlContent(project.html);
      setCssContent(project.css);
      setJsContent(project.javascript);
      
      // Parse files for code view
      const parsedFiles = project.files.map(file => ({
        name: file.name,
        type: "file" as const,
        path: file.path,
        content: file.content
      }));
      
      setFiles(parsedFiles);
      
      // Auto-select first file
      const firstFile = parsedFiles[0];
      if (firstFile) {
        setSelectedFile({
          path: firstFile.path,
          content: firstFile.content || ""
        });
        setGeneratedCode(firstFile.content || "");
      }
      
      toast.success("Projeto avançado gerado com sucesso!");
    } catch (error) {
      console.error("Error generating advanced project:", error);
      toast.error("Erro ao gerar projeto. Verifique sua chave API.");
      setCurrentView('welcome');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (path: string, content: string) => {
    setSelectedFile({ path, content });
  };

  const handleNewChat = () => {
    setCurrentView('welcome');
    setFiles([]);
    setSelectedFile(undefined);
    setGeneratedCode("");
    setHtmlContent("");
    setCssContent("");
    setJsContent("");
    setCurrentChatId("");
    setProjectName("");
  };

  const handleSelectChat = (chatId: string) => {
    setCurrentChatId(chatId);
    // Implementar carregamento do chat do histórico
    toast("Funcionalidade de histórico em desenvolvimento");
  };

  const handleDownload = async () => {
    if (!files.length) return;
    
    try {
      const projectFiles = files.map(file => ({
        name: file.name,
        path: file.path,
        content: file.content || "",
        type: file.path.split('.').pop() || 'txt'
      }));

      await DownloadManager.downloadAsZip({
        files: projectFiles,
        projectName: projectName || 'website-projeto'
      });
      
      toast.success("Download iniciado!");
    } catch (error) {
      console.error("Error downloading project:", error);
      toast.error("Erro ao fazer download do projeto");
    }
  };

  if (!apiKey) {
    return <ApiKeyInput onApiKeySubmit={handleApiKeySubmit} />;
  }

  return (
    <div className="min-h-screen w-full relative">
      {/* Sidebar Menu */}
      <SidebarMenu 
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        currentChatId={currentChatId}
      />
      
      {/* Main Content */}
      {currentView === 'welcome' ? (
        <WelcomeScreen 
          onSubmit={handlePromptSubmit} 
          isLoading={isLoading} 
        />
      ) : (
        <div className="h-screen">
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={60} minSize={40}>
              <ResponsivePreview 
                htmlContent={htmlContent}
                cssContent={cssContent}
                jsContent={jsContent}
                onDownload={handleDownload}
              />
            </ResizablePanel>
            
            <ResizableHandle />
            
            <ResizablePanel defaultSize={40} minSize={30} maxSize={60}>
              <CodePreview 
                files={files}
                selectedFile={selectedFile}
                onFileSelect={handleFileSelect}
                generatedCode={generatedCode}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      )}
    </div>
  );
}