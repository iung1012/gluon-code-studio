import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { FileNode } from '@/components/FileTree';

interface UseLovableGenerationProps {
  onCodeGenerated: (files: FileNode[], content: string) => void;
}

export const useLovableGeneration = ({ onCodeGenerated }: UseLovableGenerationProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentStreamContent, setCurrentStreamContent] = useState('');
  const { toast } = useToast();

  const parseFilesToFileTree = (files: { path: string; content: string }[]): FileNode[] => {
    const fileTree: FileNode[] = [];
    const pathMap = new Map<string, FileNode>();

    // Sort files to process directories before their contents
    const sortedFiles = [...files].sort((a, b) => {
      const aDepth = a.path.split('/').length;
      const bDepth = b.path.split('/').length;
      return aDepth - bDepth;
    });

    for (const file of sortedFiles) {
      const parts = file.path.split('/');
      const fileName = parts[parts.length - 1];
      const isDirectory = !fileName.includes('.');

      if (isDirectory) continue; // Skip directories for now

      const node: FileNode = {
        name: fileName,
        path: file.path,
        type: 'file',
        content: file.content
      };

      if (parts.length === 1) {
        // Root level file
        fileTree.push(node);
        pathMap.set(file.path, node);
      } else {
        // Nested file - create parent directories if needed
        let currentPath = '';
        let currentLevel = fileTree;

        for (let i = 0; i < parts.length - 1; i++) {
          const dirName = parts[i];
          currentPath = currentPath ? `${currentPath}/${dirName}` : dirName;

          let dirNode = currentLevel.find(n => n.name === dirName && n.type === 'folder');
          
          if (!dirNode) {
            dirNode = {
              name: dirName,
              path: currentPath,
              type: 'folder',
              children: []
            };
            currentLevel.push(dirNode);
            pathMap.set(currentPath, dirNode);
          }

          currentLevel = dirNode.children!;
        }

        currentLevel.push(node);
        pathMap.set(file.path, node);
      }
    }

    return fileTree;
  };

  const handleStreamingResponse = async (response: Response) => {
    if (!response.body) throw new Error('No response body');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let toolCallBuffer = '';
    let contentBuffer = '';

    console.log('📡 Starting stream processing...');

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        console.log('✅ Stream complete');
        setLoadingProgress(100);
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim() || !line.startsWith('data: ')) continue;
        
        const dataStr = line.slice(6).trim();
        if (dataStr === '[DONE]') continue;

        try {
          const parsed = JSON.parse(dataStr);
          
          // Handle errors
          if (parsed.error) {
            throw new Error(parsed.error);
          }

          // Check for tool calls (structured output)
          const toolCalls = parsed.choices?.[0]?.delta?.tool_calls;
          if (toolCalls && toolCalls.length > 0) {
            const args = toolCalls[0].function?.arguments;
            if (args) {
              toolCallBuffer += args;
              setLoadingProgress(prev => Math.min(prev + 5, 90));
            }
          }

          // Regular content streaming
          const deltaContent = parsed.choices?.[0]?.delta?.content;
          if (deltaContent) {
            contentBuffer += deltaContent;
            setCurrentStreamContent(contentBuffer);
            
            // Update progress based on content
            let progress = 20;
            if (contentBuffer.includes('"files"')) progress = Math.max(progress, 40);
            if (contentBuffer.includes('package.json')) progress = Math.max(progress, 50);
            if (contentBuffer.includes('src/App.tsx')) progress = Math.max(progress, 70);
            if (contentBuffer.length > 5000) progress = Math.max(progress, 85);
            
            setLoadingProgress(progress);
          }
        } catch (parseError) {
          console.warn('Failed to parse chunk:', dataStr.substring(0, 100));
        }
      }
    }

    // Try to parse structured output from tool calls first
    if (toolCallBuffer) {
      try {
        console.log('📦 Parsing structured output from tool calls');
        const structured = JSON.parse(toolCallBuffer);
        if (structured.files && Array.isArray(structured.files)) {
          return JSON.stringify(structured);
        }
      } catch (e) {
        console.log('⚠️  Tool call parsing failed, falling back to content buffer');
      }
    }

    // Fallback to content buffer
    if (contentBuffer) {
      try {
        // Try to extract JSON from content
        const jsonMatch = contentBuffer.match(/\{[\s\S]*"files"[\s\S]*\}/);
        if (jsonMatch) {
          return jsonMatch[0];
        }
      } catch (e) {
        console.error('Failed to extract JSON from content');
      }
    }

    return contentBuffer || toolCallBuffer;
  };

  const parseGeneratedContent = (content: string): { path: string; content: string }[] => {
    console.log('📄 Parsing generated content...');
    
    let cleanContent = content.trim();
    
    // Remove markdown if present
    if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```(?:json|html)?\s*\n?/, '');
      cleanContent = cleanContent.replace(/\n?```\s*$/, '');
    }
    
    // Remove backticks
    cleanContent = cleanContent.replace(/^`+|`+$/g, '').trim();
    
    try {
      const parsed = JSON.parse(cleanContent);
      
      if (parsed.files && Array.isArray(parsed.files)) {
        console.log(`✅ Successfully parsed ${parsed.files.length} files`);
        
        // Validate required files
        const requiredFiles = ['package.json', 'index.html', 'vite.config.ts', 'src/main.tsx', 'src/App.tsx'];
        const missingFiles = requiredFiles.filter(
          rf => !parsed.files.some((f: any) => f.path === rf)
        );
        
        if (missingFiles.length > 0) {
          console.warn('⚠️ Missing required files:', missingFiles);
          toast({
            title: "Arquivos faltando",
            description: `Alguns arquivos essenciais estão faltando: ${missingFiles.join(', ')}`,
            variant: "destructive"
          });
        }
        
        return parsed.files;
      }
    } catch (e) {
      console.error('❌ JSON parse failed:', e);
      throw new Error('Falha ao processar resposta da IA. Tente novamente.');
    }
    
    throw new Error('Formato inválido na resposta da IA');
  };

  const generate = async (
    prompt: string,
    currentCode?: string,
    isEdit = false,
    images?: string[],
    model: 'basic' | 'pro' | 'fast' | 'reasoning' = 'basic'
  ) => {
    setIsLoading(true);
    setLoadingProgress(0);
    setCurrentStreamContent('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      console.log('🚀 Calling Lovable AI generation...');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/lovable-generate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            prompt,
            currentCode,
            isEdit,
            images,
            model
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        
        if (response.status === 429) {
          throw new Error('Limite de requisições excedido. Aguarde e tente novamente.');
        }
        if (response.status === 402) {
          throw new Error('Créditos esgotados. Adicione créditos em Settings → Workspace → Usage.');
        }
        
        throw new Error(errorData.error || `Erro ${response.status}`);
      }

      const fullContent = await handleStreamingResponse(response);

      if (!fullContent || fullContent.trim().length === 0) {
        throw new Error('IA retornou resposta vazia');
      }

      const files = parseGeneratedContent(fullContent);
      const fileTree = parseFilesToFileTree(files);
      
      onCodeGenerated(fileTree, fullContent);

      toast({
        title: "✨ Projeto gerado!",
        description: `${files.length} arquivos criados com sucesso.`,
      });

      return fullContent;
    } catch (error) {
      console.error('❌ Generation error:', error);
      toast({
        title: "Erro na Geração",
        description: error instanceof Error ? error.message : "Erro ao gerar projeto",
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
