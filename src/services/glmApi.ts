
interface GLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{
    type: 'text' | 'image_url';
    text?: string;
    image_url?: {
      url: string;
    };
  }>;
}

interface GLMResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface GLMStreamResponse {
  choices: Array<{
    delta: {
      content?: string;
    };
    finish_reason?: string;
  }>;
}

interface StreamCallbacks {
  onProgress?: (content: string, isComplete: boolean) => void;
  onComplete?: (fullContent: string) => void;
  onError?: (error: Error) => void;
}

export class GLMApiService {
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
  private basicModel = 'moonshotai/kimi-k2:free';
  private proModel = 'z-ai/glm-4.5-air';
  private visionModel = 'z-ai/glm-4.5-air';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  getModel(): string {
    return this.basicModel;
  }

  private selectModel(hasImages: boolean, modelType: 'basic' | 'pro' = 'basic'): string {
    if (hasImages) {
      return this.visionModel;
    }
    return modelType === 'pro' ? this.proModel : this.basicModel;
  }

  async generateProjectStructure(prompt: string, images?: string[], callbacks?: StreamCallbacks, modelType: 'basic' | 'pro' = 'basic'): Promise<string> {
    const hasImages = images && images.length > 0;
    const selectedModel = this.selectModel(hasImages, modelType);
    
    console.log(`🎯 Using model: ${selectedModel} (images: ${hasImages}, mode: ${modelType})`);

    const content: Array<{type: 'text' | 'image_url'; text?: string; image_url?: {url: string}}> = [
      {
        type: 'text',
        text: `Crie um website completo HTML monolítico para: ${prompt}`
      }
    ];

    // Adicionar imagens se fornecidas
    if (hasImages) {
      content.push({
        type: 'text',
        text: '\n\nImagens fornecidas pelo usuário (integre-as no código HTML):'
      });
      
      images!.forEach((image, index) => {
        content.push({
          type: 'image_url',
          image_url: {
            url: image
          }
        });
        content.push({
          type: 'text',
          text: `Imagem ${index + 1} (integre esta imagem no HTML usando a tag <img> com src como data URL)`
        });
      });
    }

    const messages: GLMMessage[] = [
      {
        role: 'system',
        content: `Você é um desenvolvedor JavaScript especialista. Regras OBRIGATÓRIAS:

1. SEMPRE escreva código JavaScript MONOLITO (arquivo HTML único)
2. Estrutura obrigatória:
   - HTML completo com DOCTYPE
   - CSS dentro de <style> no <head>
   - JavaScript dentro de <script> antes do </body>
3. Sempre forneça código completo funcional
4. Use apenas HTML, CSS e JavaScript vanilla
5. Se imagens forem fornecidas, integre-as diretamente no HTML usando as data URLs fornecidas

IMPORTANTE: Retorne APENAS o código HTML completo, sem JSON, sem explicações, sem formatação adicional. Apenas o código HTML puro que funciona diretamente no navegador.`
      },
      {
        role: 'user',
        content: content
      }
    ];

    return callbacks 
      ? this.callStreamingAPI(messages, callbacks, selectedModel) 
      : this.callAPI(messages, selectedModel);
  }

  async editSpecificPart(currentCode: string, editRequest: string, images?: string[], callbacks?: StreamCallbacks, modelType: 'basic' | 'pro' = 'basic'): Promise<string> {
    const hasImages = images && images.length > 0;
    const selectedModel = this.selectModel(hasImages, modelType);
    
    console.log(`🎯 Using model: ${selectedModel} (images: ${hasImages}, mode: ${modelType})`);

    const content: Array<{type: 'text' | 'image_url'; text?: string; image_url?: {url: string}}> = [
      {
        type: 'text',
        text: `CÓDIGO HTML ATUAL COMPLETO:
${currentCode}

INSTRUÇÃO DE ALTERAÇÃO (execute imediatamente): ${editRequest}`
      }
    ];

    // Adicionar imagens se fornecidas
    if (hasImages) {
      content.push({
        type: 'text',
        text: '\n\nImagens fornecidas pelo usuário (integre-as conforme solicitado):'
      });
      
      images!.forEach((image, index) => {
        content.push({
          type: 'image_url',
          image_url: {
            url: image
          }
        });
        content.push({
          type: 'text',
          text: `Imagem ${index + 1} (use esta imagem conforme a instrução do usuário)`
        });
      });
    }

    content.push({
      type: 'text',
      text: '\nRetorne o HTML completo modificado agora:'
    });

    const messages: GLMMessage[] = [
      {
        role: 'system',
        content: `Você é um desenvolvedor JavaScript especialista. REGRAS CRÍTICAS:

1. Receba o código HTML monolítico atual completo
2. Identifique EXATAMENTE a parte que o usuário quer alterar
3. Faça APENAS a alteração solicitada
4. Mantenha TODO o resto do código EXATAMENTE igual
5. SEMPRE retorne o arquivo HTML completo funcional
6. Se imagens forem fornecidas, integre-as conforme a instrução do usuário usando as data URLs

CRÍTICO: NUNCA responda com explicações ou perguntas. SEMPRE retorne HTML completo válido.
Se não entender a solicitação, faça uma interpretação inteligente e aplique a mudança.
NUNCA pergunte o que fazer - sempre execute a alteração solicitada.

IMPORTANTE: Retorne APENAS o código HTML completo, sem JSON, sem explicações, sem formatação adicional. Apenas o código HTML puro que funciona diretamente no navegador.`
      },
      {
        role: 'user',
        content: content
      }
    ];

    console.log('📝 Sending edit request:', { 
      editRequest, 
      currentCodeLength: currentCode.length,
      imagesCount: images?.length || 0,
      selectedModel,
      modelType
    });

    return callbacks 
      ? this.callStreamingAPI(messages, callbacks, selectedModel) 
      : this.callAPI(messages, selectedModel);
  }

  private async callStreamingAPI(messages: GLMMessage[], callbacks: StreamCallbacks, model: string): Promise<string> {
    console.log('🚀 Calling GLM Streaming API with model:', model);
    
    try {
      const requestBody = {
        model,
        messages,
        temperature: 0.4,
        max_tokens: 4000,
        top_p: 0.8,
        stream: true
      };

      console.log('📤 Request body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ GLM Streaming API error response:', response.status, errorText);
        
        let errorMessage = `GLM API error: ${response.status} ${response.statusText}`;
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error?.message) {
            errorMessage = `GLM API error: ${errorData.error.message}`;
          }
        } catch (e) {
          // Keep original error message if JSON parsing fails
        }
        
        const error = new Error(errorMessage);
        callbacks.onError?.(error);
        throw error;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        const error = new Error('No readable stream in response');
        callbacks.onError?.(error);
        throw error;
      }

      let fullContent = '';
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            console.log('✅ Streaming complete, total content length:', fullContent.length);
            callbacks.onProgress?.(fullContent, true);
            callbacks.onComplete?.(fullContent);
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.trim() === '') continue;
            
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              
              if (data === '[DONE]') {
                console.log('🏁 Received [DONE] signal');
                continue;
              }

              try {
                const parsed: GLMStreamResponse = JSON.parse(data);
                const deltaContent = parsed.choices?.[0]?.delta?.content;
                
                if (deltaContent) {
                  fullContent += deltaContent;
                  callbacks.onProgress?.(fullContent, false);
                }

                if (parsed.choices?.[0]?.finish_reason) {
                  console.log('🏁 Stream finished with reason:', parsed.choices[0].finish_reason);
                }
              } catch (parseError) {
                console.warn('⚠️ Failed to parse streaming chunk:', data.substring(0, 100));
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      if (!fullContent || fullContent.trim().length === 0) {
        throw new Error('API retornou conteúdo vazio');
      }

      return fullContent;
    } catch (error) {
      console.error('❌ Error calling GLM Streaming API:', error);
      callbacks.onError?.(error as Error);
      throw error;
    }
  }

  private async callAPI(messages: GLMMessage[], model: string): Promise<string> {
    console.log('🚀 Calling GLM API with model:', model);
    
    try {
      const requestBody = {
        model,
        messages,
        temperature: 0.4,
        max_tokens: 4000,
        top_p: 0.8
      };

      console.log('📤 Request body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ GLM API error response:', response.status, errorText);
        
        let errorMessage = `GLM API error: ${response.status} ${response.statusText}`;
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error?.message) {
            errorMessage = `GLM API error: ${errorData.error.message}`;
          }
        } catch (e) {
          // Keep original error message if JSON parsing fails
        }
        
        throw new Error(errorMessage);
      }

      const data: GLMResponse = await response.json();
      console.log('✅ GLM API response received:', { 
        hasChoices: !!data.choices,
        choicesCount: data.choices?.length || 0
      });
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from GLM API');
      }

      const content = data.choices[0].message.content;
      console.log('📄 Content preview:', content.substring(0, 200) + '...');
      
      if (!content || content.trim().length === 0) {
        throw new Error('API retornou conteúdo vazio');
      }
      
      return content;
    } catch (error) {
      console.error('❌ Error calling GLM API:', error);
      throw error;
    }
  }
}
