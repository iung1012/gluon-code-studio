import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useGuestMode } from '@/contexts/GuestModeContext';
import type { FileNode } from '@/components/FileTree';

interface UseAIGenerationProps {
  onApiKeyInvalid: () => void;
  onCodeGenerated: (files: FileNode[], content: string) => void;
}

export const useAIGeneration = ({ onApiKeyInvalid, onCodeGenerated }: UseAIGenerationProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentStreamContent, setCurrentStreamContent] = useState('');
  const { toast } = useToast();
  const { isGuestMode, guestApiKey } = useGuestMode();

  const handleStreamingResponse = async (response: Response) => {
    if (!response.body) throw new Error('Nenhuma resposta da API');

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
          
          if (parsed.error) {
            throw new Error(parsed.error + (parsed.details ? ': ' + parsed.details : ''));
          }
          
          // Handle both Edge Function format and OpenRouter format
          const deltaContent = parsed.choices?.[0]?.delta?.content || parsed.deltaContent;
          
          if (deltaContent) {
            fullContent += deltaContent;
            setCurrentStreamContent(fullContent);
            
            // Update progress based on content
            let progress = 0;
            if (fullContent.length > 100) progress = 20;
            if (fullContent.includes('<boltArtifact>') || fullContent.includes('<!DOCTYPE')) progress = Math.max(progress, 30);
            if (fullContent.includes('<boltAction') || fullContent.length > 1000) progress = Math.max(progress, 45);
            if (fullContent.includes('package.json') || fullContent.length > 2000) progress = Math.max(progress, 60);
            if (fullContent.includes('</boltArtifact>') || fullContent.length > 3000) progress = Math.max(progress, 75);
            if (fullContent.length > 5000) progress = Math.max(progress, 85);
            
            setLoadingProgress(progress);
          }
        } catch (parseError) {
          console.warn('Failed to parse chunk:', dataStr.substring(0, 100));
          
          if (dataStr.includes('"error"')) {
            try {
              const errorParsed = JSON.parse(dataStr);
              if (errorParsed.error) {
                throw new Error(errorParsed.error + (errorParsed.details ? ': ' + errorParsed.details : ''));
              }
            } catch (errorParseError) {
              // Ignore parsing errors for error responses
            }
          }
        }
      }
    }

    return fullContent;
  };

  const handleError = (error: any, response?: Response) => {
    let errorMessage = 'Erro ao chamar Edge Function';
    
    if (response) {
      switch (response.status) {
        case 400:
          errorMessage = 'Requisição inválida. Verifique seu prompt.';
          break;
        case 401:
          onApiKeyInvalid();
          errorMessage = 'Chave API inválida ou expirada. Por favor, configure novamente.';
          break;
        case 403:
          errorMessage = 'Acesso negado. Verifique sua assinatura.';
          break;
        case 429:
          errorMessage = 'Muitas requisições. Aguarde um momento e tente novamente.';
          break;
        case 500:
          errorMessage = 'Erro interno do servidor. Tente novamente em alguns minutos.';
          break;
        default:
          errorMessage = `Erro ${response.status}: ${response.statusText}`;
      }
    }
    
    if (error?.error?.includes('401') || error?.error?.includes('Unauthorized') || error?.error?.includes('inválida')) {
      onApiKeyInvalid();
      errorMessage = 'Chave API inválida ou expirada. Por favor, configure novamente.';
    } else if (error?.error) {
      errorMessage = error.error;
    }

    throw new Error(errorMessage);
  };

  const callEdgeFunction = async (payload: any) => {
    if (isGuestMode) {
      // In guest mode, call OpenRouter API directly
      if (!guestApiKey) {
        throw new Error('Chave API não configurada. Configure sua chave API para usar o modo convidado.');
      }
      
      // Call OpenRouter API directly with streaming
      console.log('🚀 Calling OpenRouter API directly with key:', guestApiKey.substring(0, 10) + '...');
      
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${guestApiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': '2code AI Generator'
        },
        body: JSON.stringify({
          model: 'openai/gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are 2code, an expert AI assistant and exceptional senior software developer with vast knowledge across multiple programming languages, frameworks, and best practices.

You are operating in an environment called WebContainer, an in-browser Node.js runtime that emulates a Linux system. You must create complete, functional React projects based on user prompts.

CRITICAL: You must always follow the <boltArtifact> format.

<artifact_instructions>
1. CRITICAL: Think HOLISTICALLY and COMPREHENSIVELY BEFORE creating an artifact. This means:
   - Consider ALL relevant files in the project
   - Analyze the entire project context and dependencies
   - Anticipate potential impacts on other parts of the system
   - Plan the complete file structure before writing any code

2. ALWAYS use Vite for React projects - never use react-scripts or create-react-app
3. Include ALL necessary dependencies in package.json
4. Create complete, runnable projects
5. Use modern React patterns (hooks, functional components)
6. Include proper TypeScript support when applicable
6. Follow best practices for file organization and naming

<boltArtifact> format:
<boltArtifact title="Project Title" id="project-id">
  <boltAction type="file" filePath="filename">
    file content here
  </boltAction>
  <boltAction type="shell">
    command to run
  </boltAction>
  <boltAction type="start" />
</boltArtifact>

Return ONLY the boltArtifact content, no explanations or markdown.`
            },
            {
              role: 'user',
              content: payload.prompt
            }
          ],
          max_tokens: 4000,
          temperature: 0.7,
          stream: true
        })
      });

      if (!response.ok) {
        await handleError(null, response);
      }

      return response;
    }

    // Original authenticated flow
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Usuário não autenticado');

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/openrouter-generate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok) {
      try {
        const errorData = await response.json();
        console.error('Edge function error:', errorData);
        handleError(errorData, response);
      } catch (parseError) {
        handleError(null, response);
      }
    }

    return response;
  };

  const generate = async (
    prompt: string,
    currentCode?: string,
    isEdit = false,
    modelType: 'basic' | 'pro' = 'basic',
    images?: string[],
    chatHistory?: any[]
  ) => {
    setIsLoading(true);
    setLoadingProgress(0);
    setCurrentStreamContent('');

    try {
      const response = await callEdgeFunction({
        prompt,
        currentCode,
        isEdit,
        modelType,
        images,
        chatHistory
      });

      const fullContent = await handleStreamingResponse(response);

      if (!fullContent || fullContent.trim().length === 0) {
        throw new Error('API retornou resposta vazia');
      }

      return fullContent;
    } catch (error) {
      console.error('❌ Error generating code:', error);
      toast({
        title: "Falha na Geração",
        description: error instanceof Error ? error.message : "Erro ao gerar website. Tente novamente.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
      setLoadingProgress(0);
      setCurrentStreamContent('');
    }
  };

  return {
    generate,
    isLoading,
    loadingProgress,
    currentStreamContent
  };
};
