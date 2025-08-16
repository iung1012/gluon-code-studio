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
    toast({
      title: "Chave API Salva",
      description: "Agora você pode começar a gerar websites!",
    });
  };

  const parseProjectStructure = (content: string): FileNode[] => {
    console.log('📄 Parsing content from API:', content.substring(0, 200) + '...');
    
    const cleanContent = content.trim();
    
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
    
    if (cleanContent.includes('Por favor') || 
        cleanContent.includes('preciso') || 
        cleanContent.includes('não entendi') ||
        cleanContent.length < 500) {
      console.error('❌ API retornou texto explicativo em vez de HTML:', cleanContent.substring(0, 300));
      throw new Error(`A API não executou a alteração solicitada. Resposta: "${cleanContent.substring(0, 100)}..."`);
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

  const handlePromptSubmit = async (prompt: string, model: string, temperature: number) => {
    let currentService = glmService;
    if (!glmService || glmService.getModel() !== model) {
      currentService = new GLMApiService(apiKey, model);
      setGlmService(currentService);
    }
    
    if (!currentService) {
      toast({
        title: "Erro no Serviço",
        description: "Falha ao inicializar serviço GLM. Tente novamente.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setLoadingProgress(0);
    setCurrentStreamContent("");
    setShowPreview(true);
    setUseChatLayout(true);
    
    // Sistema de progresso otimizado
    let progressTimer: NodeJS.Timeout;
    let startTime = Date.now();
    
    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const baseProgress = Math.min((elapsed / 15000) * 60, 60); // 60% em 15s
      setLoadingProgress(baseProgress);
    };
    
    progressTimer = setInterval(updateProgress, 200);
    
    try {
      const streamCallbacks = {
        onProgress: (content: string, isComplete: boolean) => {
          setCurrentStreamContent(content);
          
          // Progresso baseado em marcos do conteúdo
          let contentProgress = 0;
          if (content.includes('<!DOCTYPE')) contentProgress = Math.max(contentProgress, 20);
          if (content.includes('<head>')) contentProgress = Math.max(contentProgress, 35);
          if (content.includes('<style>')) contentProgress = Math.max(contentProgress, 50);
          if (content.includes('<body>')) contentProgress = Math.max(contentProgress, 65);
          if (content.includes('<script>')) contentProgress = Math.max(contentProgress, 80);
          if (content.length > 2000) contentProgress = Math.max(contentProgress, 85);
          if (content.length > 5000) contentProgress = Math.max(contentProgress, 90);
          if (isComplete) contentProgress = 100;
          
          // Combinar progresso de tempo e conteúdo
          const elapsed = Date.now() - startTime;
          const timeProgress = Math.min((elapsed / 15000) * 70, 70);
          const finalProgress = Math.max(timeProgress, contentProgress);
          
          setLoadingProgress(finalProgress);
        },
        onComplete: (fullContent: string) => {
          clearInterval(progressTimer);
          setLoadingProgress(100);
        },
        onError: (error: Error) => {
          clearInterval(progressTimer);
          console.error('Streaming error:', error);
        }
      };
      
      let response: string;
      
      if (files.length > 0 && files[0].content) {
        const currentFile = files.find(f => f.name === 'index.html');
        if (currentFile?.content) {
          console.log('🎯 Fazendo edição específica...', { model, temperature });
          response = await currentService.editSpecificPart(currentFile.content, prompt, streamCallbacks, temperature * 0.5);
        } else {
          console.log('🆕 Gerando novo projeto...', { model, temperature });
          response = await currentService.generateProjectStructure(prompt, streamCallbacks, temperature);
        }
      } else {
        console.log('🆕 Gerando novo projeto...', { model, temperature });
        response = await currentService.generateProjectStructure(prompt, streamCallbacks, temperature);
      }
      
      clearInterval(progressTimer);
      
      const parsedFiles = parseProjectStructure(response);
      
      setFiles(parsedFiles);
      setGeneratedCode(response);
      
      const firstFile = findFirstFile(parsedFiles);
      if (firstFile) {
        setSelectedFile({ path: firstFile.path, content: firstFile.content || "" });
      }

      const isEdit = files.length > 0;
      toast({
        title: isEdit ? "Website Atualizado!" : "Website Gerado!",
        description: isEdit ? `Alterações aplicadas usando ${model}.` : `Website criado usando ${model}.`,
      });
    } catch (error) {
      clearInterval(progressTimer);
      console.error('Error generating code:', error);
      toast({
        title: "Falha na Geração",
        description: error instanceof Error ? error.message : "Erro ao gerar website. Tente novamente.",
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
    
    let progressTimer: NodeJS.Timeout;
    let startTime = Date.now();
    
    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const baseProgress = Math.min((elapsed / 10000) * 70, 70); // Progresso mais rápido para edições
      setLoadingProgress(baseProgress);
    };
    
    progressTimer = setInterval(updateProgress, 150);
    
    try {
      const streamCallbacks = {
        onProgress: (content: string, isComplete: boolean) => {
          setCurrentStreamContent(content);
          
          let contentProgress = 0;
          if (content.includes('<!DOCTYPE')) contentProgress = Math.max(contentProgress, 30);
          if (content.length > 1000) contentProgress = Math.max(contentProgress, 60);
          if (content.length > 3000) contentProgress = Math.max(contentProgress, 85);
          if (isComplete) contentProgress = 100;
          
          const elapsed = Date.now() - startTime;
          const timeProgress = Math.min((elapsed / 10000) * 70, 70);
          const finalProgress = Math.max(timeProgress, contentProgress);
          
          setLoadingProgress(finalProgress);
        },
        onComplete: (fullContent: string) => {
          clearInterval(progressTimer);
          setLoadingProgress(100);
        },
        onError: (error: Error) => {
          clearInterval(progressTimer);
          console.error('Streaming error:', error);
        }
      };
      
      if (files.length > 0 && files[0].content) {
        const currentFile = files.find(f => f.name === 'index.html');
        if (currentFile?.content) {
          console.log('🎯 Fazendo edição via chat...', { 
            messageLength: message.length, 
            currentCodeLength: currentFile.content.length 
          });
          
          const response = await glmService.editSpecificPart(currentFile.content, message, streamCallbacks);
          
          clearInterval(progressTimer);
          
          const parsedFiles = parseProjectStructure(response);
          
          setFiles(parsedFiles);
          setGeneratedCode(response);
          
          const firstFile = findFirstFile(parsedFiles);
          if (firstFile) {
            setSelectedFile({ path: firstFile.path, content: firstFile.content || "" });
          }

          toast({
            title: "Website Atualizado!",
            description: "Suas alterações foram aplicadas com sucesso.",
          });
        } else {
          throw new Error("Arquivo atual não encontrado para edição");
        }
      } else {
        throw new Error("Nenhum website gerado para editar");
      }
    } catch (error) {
      clearInterval(progressTimer);
      console.error('Error processing chat message:', error);
      toast({
        title: "Falha na Atualização",
        description: error instanceof Error ? error.message : "Erro ao atualizar website. Tente novamente.",
        variant: "destructive"
      });
      throw error;
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
      title: "Novo Projeto",
      description: "Projeto limpo. Você pode gerar um novo website agora.",
    });
  };

  const handleBackToInput = () => {
    setShowPreview(false);
    setUseChatLayout(false);
  };

  const handleFileSelect = (path: string, content: string) => {
    setSelectedFile({ path, content });
  };

  if (!apiKey) {
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
