import { useState, useEffect } from "react";
import { FileNode } from "@/components/FileTree";
import { ApiKeyInput } from "@/components/ApiKeyInput";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { LoadingScreen } from "@/components/LoadingScreen";
import { GeneratedPreview } from "@/components/GeneratedPreview";
import { ChatLayout } from "@/components/ChatLayout";
import { ProjectSidebar } from "@/components/ProjectSidebar";
import { OpenRouterApiService } from "@/services/openRouterApi";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface WebsiteVersion {
  id: string;
  content: string;
  timestamp: Date;
  versionNumber: number;
}

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState<string>("");
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [apiService, setApiService] = useState<OpenRouterApiService | null>(null);
  const [files, setFiles] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<{path: string, content: string} | undefined>();
  const [generatedCode, setGeneratedCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentStreamContent, setCurrentStreamContent] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [useChatLayout, setUseChatLayout] = useState(false);
  const [websiteVersions, setWebsiteVersions] = useState<WebsiteVersion[]>([]);
  const [currentVersionId, setCurrentVersionId] = useState<string>("");
  const [currentProjectId, setCurrentProjectId] = useState<string | undefined>();
  const [currentProjectName, setCurrentProjectName] = useState<string>("");
  const { toast } = useToast();

  // Check authentication (but don't redirect)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load API key from localStorage on mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem("api-key");
    if (savedApiKey) {
      setApiKey(savedApiKey);
      setApiService(new OpenRouterApiService(savedApiKey));
    }
  }, []);

  const handleApiKeySubmit = (key: string) => {
    setApiKey(key);
    setApiService(new OpenRouterApiService(key));
    localStorage.setItem("api-key", key);
    setShowApiKeyInput(false);
    toast({
      title: "Chave API Salva",
      description: "Agora você pode começar a gerar websites!",
    });
  };

  const checkApiKeyAndProceed = (prompt: string, model: string, temperature: number) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (!apiKey) {
      setShowApiKeyInput(true);
      return;
    }
    handlePromptSubmit(prompt, model, temperature);
  };

  const createNewVersion = (content: string): WebsiteVersion => {
    const newVersion: WebsiteVersion = {
      id: `version-${Date.now()}`,
      content,
      timestamp: new Date(),
      versionNumber: websiteVersions.length + 1
    };
    
    setWebsiteVersions(prev => [...prev, newVersion]);
    setCurrentVersionId(newVersion.id);
    
    return newVersion;
  };

  const handleRestoreVersion = (versionId: string) => {
    const version = websiteVersions.find(v => v.id === versionId);
    if (!version) return;

    const parsedFiles = parseProjectStructure(version.content);
    setFiles(parsedFiles);
    setGeneratedCode(version.content);
    setCurrentVersionId(versionId);
    
    const firstFile = findFirstFile(parsedFiles);
    if (firstFile) {
      setSelectedFile({ path: firstFile.path, content: firstFile.content || "" });
    }

    toast({
      title: "Versão Restaurada",
      description: `Versão ${version.versionNumber} foi restaurada com sucesso.`,
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

  const handlePromptSubmit = async (prompt: string, model: string = "moonshotai/kimi-k2:free", temperature: number = 0.4) => {
    let currentService = apiService;
    if (!apiService) {
      currentService = new OpenRouterApiService(apiKey);
      setApiService(currentService);
    }
    
    if (!currentService) {
      toast({
        title: "Erro no Serviço",
        description: "Falha ao inicializar serviço OpenRouter. Tente novamente.",
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
      const streamCallbacks = {
        onProgress: (content: string, isComplete: boolean) => {
          console.log(`📡 Stream progress: ${content.length} chars, complete: ${isComplete}`);
          setCurrentStreamContent(content);
          
          // Progresso baseado no conteúdo recebido
          let progress = 0;
          if (content.length > 100) progress = 20;
          if (content.includes('<!DOCTYPE')) progress = Math.max(progress, 30);
          if (content.includes('<head>')) progress = Math.max(progress, 45);
          if (content.includes('<style>')) progress = Math.max(progress, 60);
          if (content.includes('<body>')) progress = Math.max(progress, 75);
          if (content.length > 2000) progress = Math.max(progress, 85);
          if (isComplete) progress = 100;
          
          setLoadingProgress(progress);
        },
        onComplete: (fullContent: string) => {
          console.log('✅ Stream completed with', fullContent.length, 'characters');
          setLoadingProgress(100);
        },
        onError: (error: Error) => {
          console.error('❌ Stream error:', error);
          setLoadingProgress(0);
        }
      };
      
      let response: string;
      
      if (files.length > 0 && files[0].content) {
        const currentFile = files.find(f => f.name === 'index.html');
        if (currentFile?.content) {
          console.log('🎯 Fazendo edição específica...');
          response = await currentService.editSpecificPart(currentFile.content, prompt, undefined, streamCallbacks, 'basic');
        } else {
          console.log('🆕 Gerando novo projeto...');
          response = await currentService.generateProjectStructure(prompt, undefined, streamCallbacks, 'basic');
        }
      } else {
        console.log('🆕 Gerando novo projeto...');
        response = await currentService.generateProjectStructure(prompt, undefined, streamCallbacks, 'basic');
      }
      
      if (!response || response.trim().length === 0) {
        throw new Error('API retornou resposta vazia');
      }
      
      console.log('✅ API response received:', response.length, 'characters');
      
      const parsedFiles = parseProjectStructure(response);
      
      // Create new version
      createNewVersion(response);
      
      // Save project
      await saveProject(response);
      
      setFiles(parsedFiles);
      setGeneratedCode(response);
      
      const firstFile = findFirstFile(parsedFiles);
      if (firstFile) {
        setSelectedFile({ path: firstFile.path, content: firstFile.content || "" });
      }

      const isEdit = files.length > 0;
      toast({
        title: isEdit ? "Website Atualizado!" : "Website Gerado!",
        description: isEdit ? "Alterações aplicadas com sucesso." : "Website criado com sucesso.",
      });
    } catch (error) {
      console.error('❌ Error generating code:', error);
      setLoadingProgress(0);
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

  const handleChatMessage = async (message: string, images?: string[], model: 'basic' | 'pro' = 'basic') => {
    if (!apiService) return;

    setIsLoading(true);
    setLoadingProgress(0);
    setCurrentStreamContent("");
    
    try {
      const streamCallbacks = {
        onProgress: (content: string, isComplete: boolean) => {
          console.log(`📡 Chat stream progress: ${content.length} chars, complete: ${isComplete}`);
          setCurrentStreamContent(content);
          
          let progress = 0;
          if (content.length > 100) progress = 25;
          if (content.includes('<!DOCTYPE')) progress = Math.max(progress, 40);
          if (content.length > 1000) progress = Math.max(progress, 60);
          if (content.length > 3000) progress = Math.max(progress, 80);
          if (isComplete) progress = 100;
          
          setLoadingProgress(progress);
        },
        onComplete: (fullContent: string) => {
          console.log('✅ Chat stream completed with', fullContent.length, 'characters');
          setLoadingProgress(100);
        },
        onError: (error: Error) => {
          console.error('❌ Chat stream error:', error);
          setLoadingProgress(0);
        }
      };
      
      if (files.length > 0 && files[0].content) {
        const currentFile = files.find(f => f.name === 'index.html');
        if (currentFile?.content) {
          console.log('🎯 Fazendo edição via chat...', { 
            messageLength: message.length, 
            currentCodeLength: currentFile.content.length,
            imagesCount: images?.length || 0,
            modelType: model
          });
          
          const response = await apiService.editSpecificPart(currentFile.content, message, images, streamCallbacks, model);
          
          if (!response || response.trim().length === 0) {
            throw new Error('API retornou resposta vazia');
          }
          
          const parsedFiles = parseProjectStructure(response);
          
          // Create new version
          createNewVersion(response);
          
          // Save project
          await saveProject(response);
          
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
      console.error('❌ Error processing chat message:', error);
      setLoadingProgress(0);
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

  const saveProject = async (htmlContent: string, projectName?: string) => {
    if (!user) return;

    try {
      const name = projectName || currentProjectName || `Projeto ${new Date().toLocaleDateString('pt-BR')}`;
      
      if (currentProjectId) {
        // Update existing project
        const { error } = await supabase
          .from('projects')
          .update({
            html_content: htmlContent,
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentProjectId);

        if (error) throw error;
      } else {
        // Create new project
        const { data, error } = await supabase
          .from('projects')
          .insert({
            name,
            html_content: htmlContent,
            user_id: user.id,
          })
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setCurrentProjectId(data.id);
          setCurrentProjectName(data.name);
        }
      }
    } catch (error) {
      console.error('Error saving project:', error);
      toast({
        title: "Erro ao salvar projeto",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const handleProjectSelect = (project: any) => {
    const parsedFiles = parseProjectStructure(project.html_content);
    setFiles(parsedFiles);
    setGeneratedCode(project.html_content);
    setCurrentProjectId(project.id);
    setCurrentProjectName(project.name);
    setShowPreview(true);
    setUseChatLayout(true);
    
    const firstFile = findFirstFile(parsedFiles);
    if (firstFile) {
      setSelectedFile({ path: firstFile.path, content: firstFile.content || "" });
    }

    toast({
      title: "Projeto Carregado",
      description: `"${project.name}" foi carregado com sucesso.`,
    });
  };

  const handleNewProject = () => {
    setFiles([]);
    setSelectedFile(undefined);
    setGeneratedCode("");
    setShowPreview(false);
    setUseChatLayout(false);
    setWebsiteVersions([]);
    setCurrentVersionId("");
    setCurrentProjectId(undefined);
    setCurrentProjectName("");
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

  // Show API key input only when explicitly requested
  if (showApiKeyInput) {
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
        {user && (
          <ProjectSidebar
            onProjectSelect={handleProjectSelect}
            onNewProject={handleNewProject}
            currentProjectId={currentProjectId}
          />
        )}
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
            websiteVersions={websiteVersions}
            currentVersionId={currentVersionId}
            onRestoreVersion={handleRestoreVersion}
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
      {user && (
        <ProjectSidebar
          onProjectSelect={handleProjectSelect}
          onNewProject={handleNewProject}
          currentProjectId={currentProjectId}
        />
      )}
      <WelcomeScreen 
        onSubmit={checkApiKeyAndProceed} 
        isLoading={isLoading}
      />
    </>
  );
};

export default Index;
