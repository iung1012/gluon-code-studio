import { useState, useEffect } from "react";
import { FileNode } from "@/components/FileTree";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { LoadingScreen } from "@/components/LoadingScreen";
import { GeneratedPreview } from "@/components/GeneratedPreview";
import { ChatLayout } from "@/components/ChatLayout";
import { ProjectSidebar } from "@/components/ProjectSidebar";
import { UpgradeDialog } from "@/components/UpgradeDialog";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLovableGeneration } from "@/hooks/useLovableGeneration";
import { useProjectManagement } from "@/hooks/useProjectManagement";
import { useVersionHistory } from "@/hooks/useVersionHistory";
import { parseProjectStructure } from "@/utils/jsonParser";
import { buildFileTree, findFirstFile } from "@/utils/fileTreeParser";
import type { User } from "@supabase/supabase-js";

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
  const [files, setFiles] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<{path: string, content: string} | undefined>();
  const [generatedCode, setGeneratedCode] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);
  const [useChatLayout, setUseChatLayout] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const { toast } = useToast();

  const { websiteVersions, currentVersionId, createNewVersion, restoreVersion, resetVersions } = useVersionHistory();
  const { currentProjectId, currentProjectName, setCurrentProjectId, setCurrentProjectName, saveProject, resetProject } = useProjectManagement(user);
  
  const lovableGeneration = useLovableGeneration({
    onCodeGenerated: (parsedFiles, content) => {
      setFiles(parsedFiles);
      setGeneratedCode(content);
      const firstFile = findFirstFile(parsedFiles);
      if (firstFile) {
        setSelectedFile({ path: firstFile.path, content: firstFile.content || "" });
      }
    }
  });

  // Check authentication
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
  }, [navigate]);

  const handleRestoreVersion = (versionId: string) => {
    const version = restoreVersion(versionId);
    if (!version) return;

    const filesParsed = parseProjectStructure(version.content);
    const parsedFiles = buildFileTree(filesParsed);
    setFiles(parsedFiles);
    setGeneratedCode(version.content);
    
    const firstFile = findFirstFile(parsedFiles);
    if (firstFile) {
      setSelectedFile({ path: firstFile.path, content: firstFile.content || "" });
    }

    toast({
      title: "Versão Restaurada",
      description: `Versão ${version.versionNumber} foi restaurada com sucesso.`,
    });
  };

  const handlePromptSubmit = async (prompt: string, model: string = "basic", temperature: number = 0.4) => {
    setShowPreview(true);
    setUseChatLayout(true);
    
    try {
      const isEdit = files.length > 0 && files[0].content;
      
      const fullContent = await lovableGeneration.generate(
        prompt,
        generatedCode,
        Boolean(isEdit)
      );
      
      const filesParsed = parseProjectStructure(fullContent);
      const parsedFiles = buildFileTree(filesParsed);
      
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
      // Error already handled in useLovableGeneration
    }
  };

  const handleChatMessage = async (message: string, images?: string[], model: 'basic' | 'pro' = 'basic') => {
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
      const isEdit = files.length > 0 && files[0].content;

      const fullContent = await lovableGeneration.generate(
        message,
        generatedCode,
        Boolean(isEdit)
      );
      
      const filesParsed = parseProjectStructure(fullContent);
      const parsedFiles = buildFileTree(filesParsed);
      
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
          content: fullContent.substring(0, 1000)
        });
      }

      toast({
        title: "Website Atualizado!",
        description: "Suas alterações foram aplicadas com sucesso.",
      });
    } catch (error) {
      throw error;
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
        timestamp: new Date(msg.created_at!)
      }));
      
      setChatMessages(messages);
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const handleProjectSelect = async (project: any) => {
    const filesParsed = parseProjectStructure(project.html_content);
    const parsedFiles = buildFileTree(filesParsed);
    setFiles(parsedFiles);
    setGeneratedCode(project.html_content);
    setCurrentProjectId(project.id);
    setCurrentProjectName(project.name);
    setShowPreview(true);
    setUseChatLayout(true);
    
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
    resetVersions();
    resetProject();
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

  if (showPreview && files.length > 0) {
    return (
      <>
        <LoadingScreen 
          isVisible={lovableGeneration.isLoading} 
          progress={lovableGeneration.loadingProgress}
          currentContent={lovableGeneration.currentStreamContent}
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
            isLoading={lovableGeneration.isLoading}
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
        isVisible={lovableGeneration.isLoading}
        progress={lovableGeneration.loadingProgress}
        currentContent={lovableGeneration.currentStreamContent}
      />
      <UpgradeDialog 
        open={showUpgradeDialog} 
        onOpenChange={setShowUpgradeDialog}
      />
      {user && (
        <ProjectSidebar
          onProjectSelect={handleProjectSelect}
          onNewProject={handleNewProject}
          currentProjectId={currentProjectId}
        />
      )}
      <WelcomeScreen 
        onSubmit={handlePromptSubmit} 
        isLoading={lovableGeneration.isLoading}
      />
    </>
  );
};

export default Index;