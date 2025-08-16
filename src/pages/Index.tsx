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
    console.log('🔍 Analisando conteúdo da API:', content.substring(0, 200) + '...');
    console.log('📊 Estatísticas do conteúdo:', { 
      length: content.length, 
      includesDoctype: content.includes('<!DOCTYPE'), 
      includesHtml: content.includes('<html'),
      startsWithHtml: content.trim().startsWith('<')
    });
    
    // Limpar conteúdo
    const cleanContent = content.trim();
    
    // Verificar se é HTML válido
    if (cleanContent.includes('<!DOCTYPE html>') || cleanContent.includes('<html')) {
      console.log('✅ HTML monolítico válido detectado');
      
      return [{
        name: 'index.html',
        type: 'file',
        path: 'index.html',
        content: cleanContent,
        children: []
      }];
    }
    
    // Se não é HTML, verificar se é uma resposta explicativa da API
    if (cleanContent.includes('Por favor') || 
        cleanContent.includes('preciso') || 
        cleanContent.includes('não entendi') ||
        cleanContent.length < 500) {
      console.error('❌ API retornou texto explicativo em vez de HTML:', cleanContent.substring(0, 300));
      
      // Retornar erro mais específico
      throw new Error(`A API não executou a alteração solicitada. Resposta: "${cleanContent.substring(0, 100)}..."`);
    }
    
    console.error('❌ Conteúdo HTML inválido recebido');
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

  const createStreamCallbacks = (isNewProject: boolean = true) => {
    let startTime = Date.now();
    let progressValue = 0;
    
    return {
      onProgress: (content: string, isComplete: boolean) => {
        const currentTime = Date.now();
        const elapsedSeconds = (currentTime - startTime) / 1000;
        
        console.log('📊 Stream progress:', { 
          contentLength: content.length, 
          elapsedSeconds: elapsedSeconds.toFixed(1),
          isComplete 
        });
        
        setCurrentStreamContent(content);
        
        if (isComplete) {
          progressValue = 100;
        } else {
          // Progresso baseado no tempo (20% nos primeiros 5 segundos)
          const timeProgress = Math.min((elapsedSeconds / 5) * 20, 20);
          
          // Progresso baseado no conteúdo (60% baseado no tamanho)
          const expectedSize = isNewProject ? 5000 : 3000;
          const contentProgress = Math.min((content.length / expectedSize) * 60, 60);
          
          // Marcos do HTML (20% adicional)
          let milestoneProgress = 0;
          if (content.includes('<!DOCTYPE')) milestoneProgress += 3;
          if (content.includes('<head>')) milestoneProgress += 3;
          if (content.includes('<style>')) milestoneProgress += 4;
          if (content.includes('</style>')) milestoneProgress += 4;
          if (content.includes('<body>')) milestoneProgress += 3;
          if (content.includes('</body>')) milestoneProgress += 3;
          
          // Somar todos os progressos
          progressValue = Math.min(timeProgress + contentProgress + milestoneProgress, 98);
          
          // Garantir que o progresso sempre aumenta
          progressValue = Math.max(progressValue, loadingProgress);
        }
        
        console.log('📈 Progress updated to:', progressValue);
        setLoadingProgress(Math.round(progressValue));
      },
      onComplete: (fullContent: string) => {
        console.log('🎉 Streaming completo! Conteúdo final:', fullContent.length, 'caracteres');
        setLoadingProgress(100);
      },
      onError: (error: Error) => {
        console.error('❌ Erro no streaming:', error);
        setLoadingProgress(0);
      }
    };
  };

  const handlePromptSubmit = async (prompt: string, model: string, temperature: number) => {
    // Create or update GLM service with selected model
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
    
    try {
      let response: string;
      const isNewProject = files.length === 0;
      const streamCallbacks = createStreamCallbacks(isNewProject);
      
      // Se já existem arquivos, usa edição específica
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
        title: isEdit ? "Website Atualizado!" : "Website Gerado!",
        description: isEdit ? `Alterações aplicadas usando ${model}.` : `Website criado usando ${model}.`,
      });
    } catch (error) {
      console.error('❌ Erro ao gerar código:', error);
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
    
    try {
      const streamCallbacks = createStreamCallbacks(false); // Edições são menores
      
      // Always use edit mode for chat messages
      if (files.length > 0 && files[0].content) {
        const currentFile = files.find(f => f.name === 'index.html');
        if (currentFile?.content) {
          console.log('🎯 Fazendo edição via chat...', { 
            messageLength: message.length, 
            currentCodeLength: currentFile.content.length 
          });
          
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
      console.error('❌ Erro ao processar mensagem do chat:', error);
      toast({
        title: "Falha na Atualização",
        description: error instanceof Error ? error.message : "Erro ao atualizar website. Tente novamente.",
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
          progress={loadingProgress}
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
        progress={loadingProgress}
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
