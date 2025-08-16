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

export class GLMApiService {
  private apiKey: string;
  private baseUrl = 'https://api.z.ai/api/paas/v4/chat/completions';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateProjectStructure(prompt: string): Promise<string> {
    const messages: GLMMessage[] = [
      {
        role: 'system',
        content: `Você é um desenvolvedor JavaScript especialista. Regras OBRIGATÓRIAS:

1. SEMPRE escreva código JavaScript MONOLITO (arquivo HTML único)
2. NUNCA modifique código existente - APENAS edite o que o usuário solicitar
3. Estrutura obrigatória:
   - HTML completo com DOCTYPE
   - CSS dentro de <style> no <head>
   - JavaScript dentro de <script> antes do </body>
4. Para edições: identifique EXATAMENTE o que alterar e mantenha resto igual
5. Sempre forneça código completo funcional
6. Use apenas HTML, CSS e JavaScript vanilla

FORMATO DE RESPOSTA JSON OBRIGATÓRIO - ESCAPE CORRETAMENTE:
{
  "files": [
    {
      "name": "index.html",
      "type": "file", 
      "path": "index.html",
      "content": "[COLOQUE TODO O HTML AQUI COM ESCAPE CORRETO]"
    }
  ]
}

IMPORTANTE: Use \\n para quebras de linha e \\" para aspas dentro do content!`
      },
      {
        role: 'user',
        content: `Crie um website completo HTML monolítico para: ${prompt}`
      }
    ];

    return this.callAPI(messages, 0.3, 6000);
  }

  async editSpecificPart(currentCode: string, editRequest: string): Promise<string> {
    const messages: GLMMessage[] = [
      {
        role: 'system',
        content: `Você é um desenvolvedor JavaScript especialista. REGRAS CRÍTICAS:

1. Receba o código HTML monolítico atual completo
2. Identifique EXATAMENTE a parte que o usuário quer alterar
3. Faça APENAS a alteração solicitada
4. Mantenha TODO o resto do código EXATAMENTE igual
5. Retorne o arquivo HTML completo com APENAS a mudança específica

IMPORTANTE:
- NÃO reescreva o código inteiro
- NÃO mude estilos não solicitados  
- NÃO adicione funcionalidades extras
- NÃO modifique a estrutura geral
- Mantenha formatting e indentação originais

FORMATO DE RESPOSTA JSON - ESCAPE CORRETAMENTE:
{
  "files": [
    {
      "name": "index.html",
      "type": "file",
      "path": "index.html", 
      "content": "[HTML COMPLETO COM APENAS A ALTERAÇÃO ESPECÍFICA - USE \\n E \\"]"
    }
  ]
}

ESCAPE OBRIGATÓRIO: Use \\n para quebras de linha e \\" para aspas!`
      },
      {
        role: 'user',
        content: `CÓDIGO ATUAL:\n${currentCode}`
      },
      {
        role: 'user',
        content: `ALTERAÇÃO ESPECÍFICA: ${editRequest}`
      }
    ];

    return this.callAPI(messages, 0.1, 8000);
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
          model: 'glm-4-32b-0414-128k',
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