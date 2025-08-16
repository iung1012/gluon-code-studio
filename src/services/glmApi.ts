
interface GLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
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
  private baseUrl = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
  private model = 'glm-4-flash';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  getModel(): string {
    return this.model;
  }

  async generateProjectStructure(prompt: string, callbacks?: StreamCallbacks): Promise<string> {
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

IMPORTANTE: Retorne APENAS o código HTML completo, sem JSON, sem explicações, sem formatação adicional. Apenas o código HTML puro que funciona diretamente no navegador.`
      },
      {
        role: 'user',
        content: `Crie um website completo HTML monolítico para: ${prompt}`
      }
    ];

    return callbacks 
      ? this.callStreamingAPI(messages, callbacks) 
      : this.callAPI(messages);
  }

  async editSpecificPart(currentCode: string, editRequest: string, callbacks?: StreamCallbacks): Promise<string> {
    const messages: GLMMessage[] = [
      {
        role: 'system',
        content: `Você é um desenvolvedor JavaScript especialista. REGRAS CRÍTICAS:

1. Receba o código HTML monolítico atual completo
2. Identifique EXATAMENTE a parte que o usuário quer alterar
3. Faça APENAS a alteração solicitada
4. Mantenha TODO o resto do código EXATAMENTE igual
5. SEMPRE retorne o arquivo HTML completo funcional

CRÍTICO: NUNCA responda com explicações ou perguntas. SEMPRE retorne HTML completo válido.
Se não entender a solicitação, faça uma interpretação inteligente e aplique a mudança.
NUNCA pergunte o que fazer - sempre execute a alteração solicitada.

IMPORTANTE: Retorne APENAS o código HTML completo, sem JSON, sem explicações, sem formatação adicional. Apenas o código HTML puro que funciona diretamente no navegador.`
      },
      {
        role: 'user',
        content: `CÓDIGO HTML ATUAL COMPLETO:
${currentCode}

INSTRUÇÃO DE ALTERAÇÃO (execute imediatamente): ${editRequest}

Retorne o HTML completo modificado agora:`
      }
    ];

    console.log('📝 Sending edit request:', { 
      editRequest, 
      currentCodeLength: currentCode.length
    });

    return callbacks 
      ? this.callStreamingAPI(messages, callbacks) 
      : this.callAPI(messages);
  }

  private async callStreamingAPI(messages: GLMMessage[], callbacks: StreamCallbacks): Promise<string> {
    console.log('🚀 Calling GLM Streaming API with model:', this.model);
    
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: 0.4,
          max_tokens: 8000,
          top_p: 0.7,
          stream: true
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ GLM Streaming API error response:', response.status, errorText);
        const error = new Error(`GLM API error: ${response.status} ${response.statusText}`);
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

  private async callAPI(messages: GLMMessage[]): Promise<string> {
    console.log('🚀 Calling GLM API with model:', this.model);
    
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: 0.4,
          max_tokens: 8000,
          top_p: 0.7
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ GLM API error response:', response.status, errorText);
        throw new Error(`GLM API error: ${response.status} ${response.statusText}`);
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
