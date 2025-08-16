import { useState, useEffect } from "react";
import { PromptInput } from "@/components/PromptInput";
import { FileTree, FileNode } from "@/components/FileTree";
import { CodePreview } from "@/components/CodePreview";
import { ApiKeyInput } from "@/components/ApiKeyInput";
import { GLMApiService } from "@/services/glmApi";
import { useToast } from "@/hooks/use-toast";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

const Index = () => {
  const [apiKey, setApiKey] = useState<string>("");
  const [glmService, setGlmService] = useState<GLMApiService | null>(null);
  const [files, setFiles] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<{path: string, content: string} | undefined>();
  const [generatedCode, setGeneratedCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Load API key from localStorage on mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem("glm-api-key");
    if (savedApiKey) {
      setApiKey(savedApiKey);
      setGlmService(new GLMApiService(savedApiKey));
    }
  }, []);

  const handleApiKeySubmit = (key: string) => {
    setApiKey(key);
    localStorage.setItem("glm-api-key", key);
    setGlmService(new GLMApiService(key));
    toast({
      title: "API Key Saved",
      description: "You can now start generating websites!",
    });
  };

  const parseProjectStructure = (content: string): FileNode[] => {
    try {
      // Remove any markdown code blocks
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      const parsed = JSON.parse(cleanContent);
      return parsed.files || [];
    } catch (error) {
      console.error('Error parsing project structure:', error);
      // Fallback: create a single file with the generated content
      return [{
        name: "App.tsx",
        type: "file" as const,
        path: "src/App.tsx",
        content: content
      }];
    }
  };

  const handlePromptSubmit = async (prompt: string) => {
    if (!glmService) return;

    setIsLoading(true);
    try {
      const response = await glmService.generateProjectStructure(prompt);
      const parsedFiles = parseProjectStructure(response);
      
      setFiles(parsedFiles);
      setGeneratedCode(response);
      
      // Auto-select the first file
      const firstFile = findFirstFile(parsedFiles);
      if (firstFile) {
        setSelectedFile({ path: firstFile.path, content: firstFile.content || "" });
      }

      toast({
        title: "Website Generated!",
        description: "Your website structure has been created successfully.",
      });
    } catch (error) {
      console.error('Error generating code:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate website. Please try again.",
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

  if (!apiKey || !glmService) {
    return <ApiKeyInput onApiKeySubmit={handleApiKeySubmit} />;
  }

  return (
    <div className="h-screen bg-background">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Left Panel - Prompt Input */}
        <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
          <div className="h-full border-r border-border">
            <PromptInput onSubmit={handlePromptSubmit} isLoading={isLoading} />
          </div>
        </ResizablePanel>
        
        <ResizableHandle />
        
        {/* Middle Panel - File Tree */}
        <ResizablePanel defaultSize={25} minSize={15} maxSize={35}>
          <div className="h-full border-r border-border">
            <FileTree 
              files={files} 
              selectedFile={selectedFile?.path}
              onFileSelect={handleFileSelect}
            />
          </div>
        </ResizablePanel>
        
        <ResizableHandle />
        
        {/* Right Panel - Code Preview */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <CodePreview 
            selectedFile={selectedFile}
            generatedCode={!selectedFile ? generatedCode : undefined}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default Index;
