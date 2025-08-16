
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
      ? this.callStreamingAPIWithRetry(messages, temperature, 4500, callbacks, 3)
      : this.callAPIWithRetry(messages, temperature, 4500, 3);
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
      ? this.callStreamingAPIWithRetry(messages, temperature, 5500, callbacks, 3)
      : this.callAPIWithRetry(messages, temperature, 5500, 3);
  }

  private async callStreamingAPIWithRetry(
    messages: GLMMessage[], 
    temperature: number, 
    maxTokens: number, 
    callbacks: StreamCallbacks,
    maxRetries: number = 3
  ): Promise<string> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🚀 Attempting streaming call (${attempt}/${maxRetries})`);
        return await this.callStreamingAPI(messages, temperature, maxTokens, callbacks);
      } catch (error) {
        console.warn(`⚠️ Streaming attempt ${attempt} failed:`, error);
        lastError = error as Error;
        
        // Se não é o último attempt e o erro é relacionado a conexão
        if (attempt < maxRetries && this.isRetryableError(error as Error)) {
          console.log(`🔄 Retrying in ${attempt * 1000}ms...`);
          await this.delay(attempt * 1000);
          continue;
        }
        
        // Se chegou aqui, não vai tentar mais
        break;
      }
    }
    
    // Se todos os attempts falharam, tenta fallback sem streaming
    console.log('🔄 All streaming attempts failed, trying non-streaming...');
    callbacks.onError?.(new Error('Streaming failed, switching to non-streaming mode'));
    
    try {
      const result = await this.callAPIWithRetry(messages, temperature, maxTokens, 2);
      callbacks.onComplete?.(result);
      return result;
    } catch (fallbackError) {
      console.error('❌ Fallback also failed:', fallbackError);
      const finalError = lastError || (fallbackError as Error);
      callbacks.onError?.(finalError);
      throw finalError;
    }
  }

  private async callAPIWithRetry(
    messages: GLMMessage[], 
    temperature: number, 
    maxTokens: number, 
    maxRetries: number = 3
  ): Promise<string> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🚀 Attempting API call (${attempt}/${maxRetries})`);
        return await this.callAPI(messages, temperature, maxTokens);
      } catch (error) {
        console.warn(`⚠️ API attempt ${attempt} failed:`, error);
        lastError = error as Error;
        
        if (attempt < maxRetries && this.isRetryableError(error as Error)) {
          console.log(`🔄 Retrying in ${attempt * 1000}ms...`);
          await this.delay(attempt * 1000);
          continue;
        }
        
        break;
      }
    }
    
    throw lastError || new Error('All API attempts failed');
  }

  private isRetryableError(error: Error): boolean {
    const retryableMessages = [
      'aborted',
      'network',
      'timeout',
      'connection',
      'ECONNRESET',
      'ENOTFOUND',
      'ETIMEDOUT',
      'budystreambuffer was aborted'
    ];
    
    const errorMessage = error.message.toLowerCase();
    return retryableMessages.some(msg => errorMessage.includes(msg));
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async callStreamingAPI(
    messages: GLMMessage[], 
    temperature: number, 
    maxTokens: number, 
    callbacks: StreamCallbacks
  ): Promise<string> {
    console.log('🚀 Calling GLM Streaming API with:', { temperature, maxTokens, messagesCount: messages.length });
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('⏰ Request timeout, aborting...');
      controller.abort();
    }, 35000); // Timeout aumentado para 35s
    
    let response: Response;
    
    try {
      response = await fetch(this.baseUrl, {
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
          top_p: 0.8,
          frequency_penalty: 0.0,
          presence_penalty: 0.0,
          stream: true
        }),
        signal: controller.signal
      });
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('❌ Fetch error:', error);
      throw new Error(`Network error: ${(error as Error).message}`);
    }

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error('❌ GLM Streaming API error response:', errorText);
      throw new Error(`GLM API error: ${response.status} ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No readable stream in response');
    }

    let fullContent = '';
    const decoder = new TextDecoder();

    try {
      while (true) {
        let result;
        try {
          result = await reader.read();
        } catch (readError) {
          console.error('❌ Stream read error:', readError);
          throw new Error(`Stream read error: ${(readError as Error).message}`);
        }
        
        const { done, value } = result;
        
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
      try {
        reader.releaseLock();
      } catch (lockError) {
        console.warn('⚠️ Error releasing reader lock:', lockError);
      }
    }

    return fullContent;
  }

  private async callAPI(messages: GLMMessage[], temperature: number, maxTokens: number): Promise<string> {
    console.log('🚀 Calling GLM API with:', { temperature, maxTokens, messagesCount: messages.length });
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('⏰ Request timeout, aborting...');
      controller.abort();
    }, 30000); // Timeout de 30s

    let response: Response;
    
    try {
      response = await fetch(this.baseUrl, {
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
          top_p: 0.8,
          frequency_penalty: 0.0,
          presence_penalty: 0.0
        }),
        signal: controller.signal
      });
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('❌ Fetch error:', error);
      throw new Error(`Network error: ${(error as Error).message}`);
    }

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
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
  }
}
