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
  private baseUrl = 'https://api.z.ai/api/paas/v4/chat/completions';
  private model: string;

  constructor(apiKey: string, model: string = 'glm-4.5-flash') {
    this.apiKey = apiKey;
    this.model = model;
  }

  setModel(model: string) {
    this.model = model;
  }

  getModel(): string {
    return this.model;
  }

  async generateProjectStructure(prompt: string, callbacks?: StreamCallbacks, temperature: number = 0.3): Promise<string> {
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
      ? this.callStreamingAPI(messages, temperature, 6000, callbacks)
      : this.callAPI(messages, temperature, 6000);
  }

  async editSpecificPart(currentCode: string, editRequest: string, callbacks?: StreamCallbacks, temperature: number = 0.1): Promise<string> {
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
      currentCodeLength: currentCode.length,
      hasSystemPrompt: messages[0].content.includes('CRÍTICO'),
      temperature
    });

    return callbacks 
      ? this.callStreamingAPI(messages, temperature, 8000, callbacks)
      : this.callAPI(messages, temperature, 8000);
  }

  private async callStreamingAPI(
    messages: GLMMessage[], 
    temperature: number, 
    maxTokens: number, 
    callbacks: StreamCallbacks
  ): Promise<string> {
    console.log('🚀 Calling GLM Streaming API with:', { temperature, maxTokens, messagesCount: messages.length });
    
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept-Language': 'en-US,en',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature,
          max_tokens: maxTokens,
          top_p: 0.7,
          frequency_penalty: 0.0,
          presence_penalty: 0.0,
          stream: true
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ GLM Streaming API error response:', errorText);
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

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            console.log('✅ Streaming complete, total content length:', fullContent.length);
            callbacks.onProgress?.(fullContent, true);
            callbacks.onComplete?.(fullContent);
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(line => line.trim() !== '');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              
              if (data === '[DONE]') {
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
                console.warn('⚠️ Failed to parse streaming chunk:', data);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      return fullContent;
    } catch (error) {
      console.error('❌ Error calling GLM Streaming API:', error);
      callbacks.onError?.(error as Error);
      throw error;
    }
  }

  private async callAPI(messages: GLMMessage[], temperature: number, maxTokens: number): Promise<string> {
    console.log('🚀 Calling GLM API with:', { temperature, maxTokens, messagesCount: messages.length });
    
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept-Language': 'en-US,en',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature,
          max_tokens: maxTokens,
          top_p: 0.7,
          frequency_penalty: 0.0,
          presence_penalty: 0.0
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ GLM API error response:', errorText);
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
      
      return content;
    } catch (error) {
      console.error('❌ Error calling GLM API:', error);
      throw error;
    }
  }
}