import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface OpenRouterModel {
  id: string;
  name: string;
  provider: string;
  contextLength: number;
}

// Available OpenRouter models
export const OPENROUTER_MODELS: OpenRouterModel[] = [
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google', contextLength: 1000000 },
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google', contextLength: 2000000 },
  { id: 'openai/gpt-5', name: 'GPT-5', provider: 'OpenAI', contextLength: 200000 },
  { id: 'openai/gpt-5-mini', name: 'GPT-5 Mini', provider: 'OpenAI', contextLength: 200000 },
  { id: 'anthropic/claude-sonnet-4-5', name: 'Claude Sonnet 4.5', provider: 'Anthropic', contextLength: 200000 },
  { id: 'anthropic/claude-opus-4-1', name: 'Claude Opus 4.1', provider: 'Anthropic', contextLength: 200000 },
  { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', provider: 'Meta', contextLength: 128000 },
  { id: 'mistralai/mistral-large-2407', name: 'Mistral Large', provider: 'Mistral', contextLength: 128000 },
];

interface UseOpenRouterProps {
  onCodeGenerated?: (content: string) => void;
}

export const useOpenRouter = ({ onCodeGenerated }: UseOpenRouterProps = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentStreamContent, setCurrentStreamContent] = useState('');
  const { toast } = useToast();

  const streamChat = async (
    messages: Array<{ role: string; content: string }>,
    model: string = 'google/gemini-2.5-flash',
    onChunk?: (chunk: string) => void
  ): Promise<string> => {
    setIsLoading(true);
    setLoadingProgress(0);
    setCurrentStreamContent('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/openrouter-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ messages, model }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

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
              throw new Error(parsed.error);
            }
            
            const deltaContent = parsed.choices?.[0]?.delta?.content;
            
            if (deltaContent) {
              fullContent += deltaContent;
              setCurrentStreamContent(fullContent);
              
              if (onChunk) {
                onChunk(deltaContent);
              }
              
              // Update progress
              const progress = Math.min(90, Math.floor((fullContent.length / 5000) * 100));
              setLoadingProgress(progress);
            }
          } catch (parseError) {
            console.warn('Failed to parse chunk:', dataStr.substring(0, 100));
          }
        }
      }

      setIsLoading(false);
      
      if (onCodeGenerated) {
        onCodeGenerated(fullContent);
      }
      
      return fullContent;

    } catch (error) {
      setIsLoading(false);
      console.error('OpenRouter error:', error);
      
      toast({
        title: "Erro ao chamar OpenRouter",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      
      throw error;
    }
  };

  return {
    streamChat,
    isLoading,
    loadingProgress,
    currentStreamContent,
  };
};
