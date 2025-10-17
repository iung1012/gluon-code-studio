import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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

  const handleStreamingResponse = async (response: Response) => {
    if (!response.body) throw new Error('Nenhuma resposta da Edge Function');

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
          
          const deltaContent = parsed.choices?.[0]?.delta?.content;
          
          if (deltaContent) {
            fullContent += deltaContent;
            setCurrentStreamContent(fullContent);
            
            // Update progress based on content
            let progress = 0;
            if (fullContent.length > 100) progress = 20;
            if (fullContent.includes('<!DOCTYPE') || fullContent.includes('"files"')) progress = Math.max(progress, 30);
            if (fullContent.includes('<head>') || fullContent.length > 1000) progress = Math.max(progress, 45);
            if (fullContent.includes('<style>') || fullContent.length > 2000) progress = Math.max(progress, 60);
            if (fullContent.includes('<body>') || fullContent.length > 3000) progress = Math.max(progress, 75);
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
