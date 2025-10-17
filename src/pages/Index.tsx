import { useState, useEffect } from "react";
import { FileNode } from "@/components/FileTree";
import { ApiKeyInput } from "@/components/ApiKeyInput";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { LoadingScreen } from "@/components/LoadingScreen";
import { GeneratedPreview } from "@/components/GeneratedPreview";
import { LivePreview } from "@/components/LivePreview";
import { WebContainerPreview } from "@/components/WebContainerPreview";
import { ChatLayout } from "@/components/ChatLayout";
import { ProjectSidebar } from "@/components/ProjectSidebar";
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

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
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
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const { toast } = useToast();

  // Check authentication and API key
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (!session?.user) {
        navigate('/auth');
      } else {
        setTimeout(() => {
          checkUserApiKey(session.user.id);
        }, 0);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (!session?.user) {
        navigate('/auth');
      } else {
        checkUserApiKey(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkUserApiKey = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('openrouter_api_key')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setHasApiKey(!!data?.openrouter_api_key);
    } catch (error) {
      console.error('Error checking API key:', error);
      setHasApiKey(false);
    }
  };

  const handleApiKeySubmit = (key: string) => {
    setHasApiKey(true);
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
    if (!hasApiKey) {
      setShowApiKeyInput(true);
      toast({
        title: "Chave API Necessária",
        description: "Por favor, insira sua chave API do OpenRouter para continuar.",
        variant: "destructive"
      });
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

  const buildFileTree = (files: { path: string; content: string }[]): FileNode[] => {
    const root: { [key: string]: FileNode } = {};
    
    files.forEach(file => {
      const parts = file.path.split('/');
      let current: any = root;
      
      parts.forEach((part, index) => {
        const isFile = index === parts.length - 1;
        
        if (isFile) {
          current[part] = {
            name: part,
            type: 'file',
            path: file.path,
            content: file.content,
            children: []
          };
        } else {
          if (!current[part]) {
            current[part] = {
              name: part,
              type: 'folder',
              path: parts.slice(0, index + 1).join('/'),
              children: []
            };
          }
          if (!current[part].childrenMap) {
            current[part].childrenMap = {};
          }
          current = current[part].childrenMap;
        }
      });
    });
    
    const convertToArray = (obj: any): FileNode[] => {
      return Object.values(obj).map((node: any) => {
        if (node.childrenMap) {
          node.children = convertToArray(node.childrenMap);
          delete node.childrenMap;
        }
        return node;
      });
    };
    
    return convertToArray(root);
  };

  // Detect if project is React-based
  const isReactProject = (files: FileNode[]): boolean => {
    const flattenFiles = (nodes: FileNode[]): FileNode[] => {
      return nodes.reduce((acc, node) => {
        if (node.type === 'file') {
          acc.push(node);
        }
        if (node.children) {
          acc.push(...flattenFiles(node.children));
        }
        return acc;
      }, [] as FileNode[]);
    };
    
    const allFiles = flattenFiles(files);
    return allFiles.some(f => 
      f.name === 'package.json' && 
      f.content?.includes('"react"')
    );
  };

  const parseProjectStructure = (content: string): FileNode[] => {
    console.log('📄 Parsing content from API:', content.substring(0, 200) + '...');
    
    let cleanContent = content.trim();
    
    // Remove markdown code blocks - try multiple patterns
    if (cleanContent.startsWith('```')) {
      // Remove opening ```json or ```
      cleanContent = cleanContent.replace(/^```(?:json|html)?\s*\n?/, '');
      // Remove closing ```
      cleanContent = cleanContent.replace(/\n?```\s*$/, '');
      console.log('🧹 Removed markdown code block wrapper');
    }
    
    // Remove any remaining leading/trailing backticks or whitespace
    cleanContent = cleanContent.replace(/^`+|`+$/g, '').trim();
    
    // Parse as JSON multi-file response (React projects)
    try {
      const parsed = JSON.parse(cleanContent);
      
      if (parsed.files && Array.isArray(parsed.files)) {
        console.log('✅ React project detected:', parsed.files.length, 'files');
        return buildFileTree(parsed.files);
      }
    } catch (e) {
      console.error('❌ JSON parse failed:', e);
      console.error('Failed content:', cleanContent.substring(0, 300));
      throw new Error('Formato inválido: esperado JSON com estrutura React');
    }
    
    throw new Error('Formato inválido: A IA deve retornar um projeto React em JSON');
  };

  const handlePromptSubmit = async (prompt: string, model: string = "basic", temperature: number = 0.4) => {
    setIsLoading(true);
    setLoadingProgress(0);
    setCurrentStreamContent("");
    setShowPreview(true);
    setUseChatLayout(true);
    
    try {
      const isEdit = files.length > 0 && files[0].content;
      const currentFile = files.find(f => f.name === 'index.html');

      console.log('🚀 Calling Edge Function:', { isEdit, hasCurrentFile: !!currentFile });

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Usuário não autenticado');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/openrouter-generate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            prompt,
            currentCode: isEdit && currentFile ? currentFile.content : undefined,
            isEdit,
            modelType: model === 'pro' ? 'pro' : 'basic'
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Edge function error:', errorData);
        
        // If 401 error, likely API key issue
        if (response.status === 401 || errorData.error?.includes('401') || errorData.error?.includes('Unauthorized') || errorData.error?.includes('inválida')) {
          setHasApiKey(false);
          setShowApiKeyInput(true);
          throw new Error('Chave API inválida ou expirada. Por favor, configure novamente.');
        }
        
        throw new Error(errorData.error || 'Erro ao chamar Edge Function');
      }

      if (!response.body) {
        throw new Error('Nenhuma resposta da Edge Function');
      }

      // Handle streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('✅ Streaming complete');
          setLoadingProgress(100);
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '' || !line.startsWith('data: ')) continue;
          
          const dataStr = line.slice(6).trim();
          if (dataStr === '[DONE]') continue;

          try {
            const parsed = JSON.parse(dataStr);
            const deltaContent = parsed.choices?.[0]?.delta?.content;
            
            if (deltaContent) {
              fullContent += deltaContent;
              setCurrentStreamContent(fullContent);
              
              // Progresso baseado no conteúdo recebido
              let progress = 0;
              if (fullContent.length > 100) progress = 20;
              if (fullContent.includes('<!DOCTYPE')) progress = Math.max(progress, 30);
              if (fullContent.includes('<head>')) progress = Math.max(progress, 45);
              if (fullContent.includes('<style>')) progress = Math.max(progress, 60);
              if (fullContent.includes('<body>')) progress = Math.max(progress, 75);
              if (fullContent.length > 2000) progress = Math.max(progress, 85);
              
              setLoadingProgress(progress);
            }
          } catch (parseError) {
            console.warn('Failed to parse chunk:', dataStr.substring(0, 100));
          }
        }
      }

      if (!fullContent || fullContent.trim().length === 0) {
        throw new Error('API retornou resposta vazia');
      }
      
      console.log('✅ Full response received:', fullContent.length, 'characters');
      
      const parsedFiles = parseProjectStructure(fullContent);
      createNewVersion(fullContent);
      await saveProject(fullContent);
      
      setFiles(parsedFiles);
      setGeneratedCode(fullContent);
      
      const firstFile = findFirstFile(parsedFiles);
      if (firstFile) {
        setSelectedFile({ path: firstFile.path, content: firstFile.content || "" });
      }

      toast({
        title: "Website Gerado!",
        description: "Seu website está pronto para visualização.",
      });
    } catch (error) {
      console.error('❌ Error generating code:', error);
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
    setIsLoading(true);
    setLoadingProgress(0);
    setCurrentStreamContent("");
    
    // Save user message to database
    if (user && currentProjectId) {
      await supabase.from('chat_history').insert({
        user_id: user.id,
        project_id: currentProjectId,
        role: 'user',
        content: message
      });
    }
    
    try {
      const currentFile = files.find(f => f.name === 'index.html');
      if (!currentFile?.content) {
        throw new Error("Nenhum website gerado para editar");
      }

      console.log('🎯 Editando via chat...', { 
        messageLength: message.length, 
        currentCodeLength: currentFile.content.length,
        imagesCount: images?.length || 0,
        modelType: model
      });

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Usuário não autenticado');
      }

      // Load recent chat history for context
      const { data: chatHistory } = await supabase
        .from('chat_history')
        .select('role, content')
        .eq('project_id', currentProjectId)
        .order('created_at', { ascending: false })
        .limit(10);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/openrouter-generate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            prompt: message,
            currentCode: currentFile.content,
            images,
            isEdit: true,
            modelType: model,
            chatHistory: chatHistory ? chatHistory.reverse() : []
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Edge function error:', errorData);
        
        // If 401 error, likely API key issue
        if (response.status === 401 || errorData.error?.includes('401') || errorData.error?.includes('Unauthorized') || errorData.error?.includes('inválida')) {
          setHasApiKey(false);
          setShowApiKeyInput(true);
          throw new Error('Chave API inválida ou expirada. Por favor, configure novamente.');
        }
        
        throw new Error(errorData.error || 'Erro ao chamar Edge Function');
      }

      if (!response.body) {
        throw new Error('Nenhuma resposta da Edge Function');
      }

      // Handle streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('✅ Streaming complete');
          setLoadingProgress(100);
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '' || !line.startsWith('data: ')) continue;
          
          const dataStr = line.slice(6).trim();
          if (dataStr === '[DONE]') continue;

          try {
            const parsed = JSON.parse(dataStr);
            const deltaContent = parsed.choices?.[0]?.delta?.content;
            
            if (deltaContent) {
              fullContent += deltaContent;
              setCurrentStreamContent(fullContent);
              
              let progress = 0;
              if (fullContent.length > 100) progress = 25;
              if (fullContent.includes('<!DOCTYPE')) progress = Math.max(progress, 40);
              if (fullContent.length > 1000) progress = Math.max(progress, 60);
              if (fullContent.length > 3000) progress = Math.max(progress, 80);
              
              setLoadingProgress(progress);
            }
          } catch (parseError) {
            console.warn('Failed to parse chunk:', dataStr.substring(0, 100));
          }
        }
      }

      if (!fullContent || fullContent.trim().length === 0) {
        throw new Error('API retornou resposta vazia');
      }
      
      const parsedFiles = parseProjectStructure(fullContent);
      createNewVersion(fullContent);
      await saveProject(fullContent);
      
      setFiles(parsedFiles);
      setGeneratedCode(fullContent);
      
      const firstFile = findFirstFile(parsedFiles);
      if (firstFile) {
        setSelectedFile({ path: firstFile.path, content: firstFile.content || "" });
      }

      // Save AI response to database
      if (user && currentProjectId) {
        await supabase.from('chat_history').insert({
          user_id: user.id,
          project_id: currentProjectId,
          role: 'assistant',
          content: fullContent.substring(0, 1000) // Save only first 1000 chars to avoid huge storage
        });
      }

      toast({
        title: "Website Atualizado!",
        description: "Suas alterações foram aplicadas com sucesso.",
      });
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

  const loadChatHistory = async (projectId: string) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      const messages: ChatMessage[] = (data || []).map(msg => ({
        id: msg.id,
        content: msg.content,
        sender: msg.role === 'user' ? 'user' : 'ai',
        timestamp: new Date(msg.created_at)
      }));
      
      setChatMessages(messages);
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const handleProjectSelect = async (project: any) => {
    const parsedFiles = parseProjectStructure(project.html_content);
    setFiles(parsedFiles);
    setGeneratedCode(project.html_content);
    setCurrentProjectId(project.id);
    setCurrentProjectName(project.name);
    setShowPreview(true);
    setUseChatLayout(true);
    
    // Load chat history for this project
    await loadChatHistory(project.id);
    
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
    setChatMessages([]);
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
            initialMessages={chatMessages}
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
