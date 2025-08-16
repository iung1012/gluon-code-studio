import { useState, useEffect } from "react";
import { FileNode } from "@/components/FileTree";
import { ApiKeyInput } from "@/components/ApiKeyInput";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { LoadingScreen } from "@/components/LoadingScreen";
import { GeneratedPreview } from "@/components/GeneratedPreview";
import { ChatLayout } from "@/components/ChatLayout";
import { GLMApiService } from "@/services/glmApi";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [apiKey, setApiKey] = useState<string>("");
  const [glmService, setGlmService] = useState<GLMApiService | null>(null);
  const [files, setFiles] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<{path: string, content: string} | undefined>();
  const [generatedCode, setGeneratedCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentStreamContent, setCurrentStreamContent] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [useChatLayout, setUseChatLayout] = useState(false);
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
    console.log('🔍 Parsing HTML monolith from content:', content.substring(0, 200) + '...');
    
    // Since API now returns HTML directly, just use it as-is
    const cleanContent = content.trim();
    
    // Validate it's HTML
    if (cleanContent.includes('<!DOCTYPE html>') || cleanContent.includes('<html')) {
      console.log('✅ Valid HTML monolith detected');
      
      return [{
        name: 'index.html',
        type: 'file',
        path: 'index.html',
        content: cleanContent,
        children: []
      }];
    }
    
    console.error('❌ Invalid HTML content received');
    return [{
      name: 'index.html',
      type: 'file',
      path: 'index.html',
      content: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Erro de Conteúdo</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
        .error { background: #fee; padding: 20px; border: 1px solid #fcc; border-radius: 8px; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 4px; text-align: left; overflow: auto; }
    </style>
</head>
<body>
    <div class="error">
        <h1>❌ Conteúdo HTML Inválido</h1>
        <p>A API não retornou HTML válido:</p>
        <pre>${content.substring(0, 1000)}...</pre>
    </div>
</body>
</html>`,
      children: []
    }];
  };

  const handlePromptSubmit = async (prompt: string) => {
    if (!glmService) return;

    setIsLoading(true);
    setLoadingProgress(0);
    setCurrentStreamContent("");
    setShowPreview(true);
    setUseChatLayout(true); // Enable chat layout for new generations
    
    try {
      let response: string;
      
      const streamCallbacks = {
        onProgress: (content: string, isComplete: boolean) => {
          setCurrentStreamContent(content);
          // Estimate progress based on content characteristics
          if (content.includes('<!DOCTYPE html>')) setLoadingProgress(Math.max(loadingProgress, 20));
          if (content.includes('<style>')) setLoadingProgress(Math.max(loadingProgress, 50));
          if (content.includes('<script>')) setLoadingProgress(Math.max(loadingProgress, 80));
          if (isComplete) setLoadingProgress(100);
        },
        onComplete: (fullContent: string) => {
          setLoadingProgress(100);
        },
        onError: (error: Error) => {
          console.error('Streaming error:', error);
        }
      };
      
      // Se já existem arquivos, usa edição específica
      if (files.length > 0 && files[0].content) {
        const currentFile = files.find(f => f.name === 'index.html');
        if (currentFile?.content) {
          console.log('🎯 Fazendo edição específica...');
          response = await glmService.editSpecificPart(currentFile.content, prompt, streamCallbacks);
        } else {
          console.log('🆕 Gerando novo projeto...');
          response = await glmService.generateProjectStructure(prompt, streamCallbacks);
        }
      } else {
        console.log('🆕 Gerando novo projeto...');
        response = await glmService.generateProjectStructure(prompt, streamCallbacks);
      }
      
      const parsedFiles = parseProjectStructure(response);
      
      setFiles(parsedFiles);
      setGeneratedCode(response);
      
      // Auto-select the first file
      const firstFile = findFirstFile(parsedFiles);
      if (firstFile) {
        setSelectedFile({ path: firstFile.path, content: firstFile.content || "" });
      }

      const isEdit = files.length > 0;
      toast({
        title: isEdit ? "Website Updated!" : "Website Generated!",
        description: isEdit ? "Your changes have been applied successfully." : "Your website has been created successfully.",
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
      setLoadingProgress(0);
      setCurrentStreamContent("");
    }
  };

  const handleChatMessage = async (message: string) => {
    if (!glmService) return;

    setIsLoading(true);
    setLoadingProgress(0);
    setCurrentStreamContent("");
    
    try {
      const streamCallbacks = {
        onProgress: (content: string, isComplete: boolean) => {
          setCurrentStreamContent(content);
          // Estimate progress for edits
          if (content.includes('<!DOCTYPE html>')) setLoadingProgress(Math.max(loadingProgress, 30));
          if (content.length > 1000) setLoadingProgress(Math.max(loadingProgress, 60));
          if (content.length > 3000) setLoadingProgress(Math.max(loadingProgress, 90));
          if (isComplete) setLoadingProgress(100);
        },
        onComplete: (fullContent: string) => {
          setLoadingProgress(100);
        },
        onError: (error: Error) => {
          console.error('Streaming error:', error);
        }
      };
      
      // Always use edit mode for chat messages
      if (files.length > 0 && files[0].content) {
        const currentFile = files.find(f => f.name === 'index.html');
        if (currentFile?.content) {
          console.log('🎯 Fazendo edição via chat...');
          const response = await glmService.editSpecificPart(currentFile.content, message, streamCallbacks);
          
          const parsedFiles = parseProjectStructure(response);
          
          setFiles(parsedFiles);
          setGeneratedCode(response);
          
          // Auto-select the first file
          const firstFile = findFirstFile(parsedFiles);
          if (firstFile) {
            setSelectedFile({ path: firstFile.path, content: firstFile.content || "" });
          }

          toast({
            title: "Website Updated!",
            description: "Your changes have been applied successfully.",
          });
        }
      }
    } catch (error) {
      console.error('Error processing chat message:', error);
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update website. Please try again.",
        variant: "destructive"
      });
      throw error; // Re-throw to let ChatPanel handle the error message
    } finally {
      setIsLoading(false);
      setLoadingProgress(0);
      setCurrentStreamContent("");
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

  const handleNewProject = () => {
    setFiles([]);
    setSelectedFile(undefined);
    setGeneratedCode("");
    setShowPreview(false);
    setUseChatLayout(false);
    toast({
      title: "New Project",
      description: "Project cleared. You can now generate a new website.",
    });
  };

  const handleBackToInput = () => {
    setShowPreview(false);
    setUseChatLayout(false);
  };

  const handleFileSelect = (path: string, content: string) => {
    setSelectedFile({ path, content });
  };

  if (!apiKey || !glmService) {
    return <ApiKeyInput onApiKeySubmit={handleApiKeySubmit} />;
  }

  if (showPreview && files.length > 0) {
    return (
      <>
        <LoadingScreen 
          isVisible={isLoading} 
          progress={loadingProgress > 0 ? loadingProgress : undefined}
          currentContent={currentStreamContent}
        />
        {useChatLayout ? (
          <ChatLayout
            files={files}
            selectedFile={selectedFile}
            onFileSelect={handleFileSelect}
            onBackToInput={handleBackToInput}
            onNewProject={handleNewProject}
            onSendMessage={handleChatMessage}
            generatedCode={!selectedFile ? generatedCode : undefined}
            isLoading={isLoading}
          />
        ) : (
          <GeneratedPreview
            files={files}
            selectedFile={selectedFile}
            onFileSelect={handleFileSelect}
            onBackToInput={handleBackToInput}
            onNewProject={handleNewProject}
            generatedCode={!selectedFile ? generatedCode : undefined}
          />
        )}
      </>
    );
  }

  return (
    <>
      <LoadingScreen 
        isVisible={isLoading}
        progress={loadingProgress > 0 ? loadingProgress : undefined}
        currentContent={currentStreamContent}
      />
      <WelcomeScreen 
        onSubmit={handlePromptSubmit} 
        isLoading={isLoading}
      />
    </>
  );
};

export default Index;
