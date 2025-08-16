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

  async generateCode(prompt: string): Promise<string> {
    const messages: GLMMessage[] = [
      {
        role: 'system',
        content: `Você é um especialista em desenvolvimento web. Gere código React/TypeScript limpo e funcional baseado na solicitação do usuário. 

IMPORTANTE: 
- Retorne APENAS código válido React/TypeScript
- Use componentes funcionais com hooks
- Use Tailwind CSS para estilização
- Inclua TypeScript interfaces quando necessário
- O código deve ser completo e executável
- Não inclua explicações, apenas código

Exemplo de estrutura esperada:
\`\`\`tsx
import React from 'react';

interface Props {
  // props interface
}

const Component: React.FC<Props> = () => {
  return (
    <div className="...">
      {/* component JSX */}
    </div>
  );
};

export default Component;
\`\`\``
      },
      {
        role: 'user',
        content: prompt
      }
    ];

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
          temperature: 0.6,
          max_tokens: 4096
        })
      });

      if (!response.ok) {
        throw new Error(`GLM API error: ${response.status} ${response.statusText}`);
      }

      const data: GLMResponse = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from GLM API');
      }

      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error calling GLM API:', error);
      throw error;
    }
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

FORMATO DE RESPOSTA JSON OBRIGATÓRIO:
{
  "files": [
    {
      "name": "index.html",
      "type": "file", 
      "path": "index.html",
      "content": "<!DOCTYPE html>\\n<html lang=\\"pt-BR\\">\\n<head>\\n  <meta charset=\\"UTF-8\\">\\n  <meta name=\\"viewport\\" content=\\"width=device-width, initial-scale=1.0\\">\\n  <title>Título</title>\\n  <style>\\n    /* CSS aqui */\\n  </style>\\n</head>\\n<body>\\n  <!-- HTML aqui -->\\n  <script>\\n    // JavaScript aqui\\n  </script>\\n</body>\\n</html>"
    }
  ]
}`
      },
      {
        role: 'user',
        content: `Crie um website completo HTML monolítico para: ${prompt}`
      }
    ];

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
          temperature: 0.3,
          max_tokens: 4000
        })
      });

      if (!response.ok) {
        throw new Error(`GLM API error: ${response.status} ${response.statusText}`);
      }

      const data: GLMResponse = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from GLM API');
      }

      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error calling GLM API:', error);
      throw error;
    }
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

FORMATO DE RESPOSTA JSON:
{
  "files": [
    {
      "name": "index.html",
      "type": "file",
      "path": "index.html", 
      "content": "[HTML COMPLETO COM APENAS A ALTERAÇÃO ESPECÍFICA]"
    }
  ]
}`
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
          temperature: 0.1, // Muito baixo para máxima precisão
          max_tokens: 8000
        })
      });

      if (!response.ok) {
        throw new Error(`GLM API error: ${response.status} ${response.statusText}`);
      }

      const data: GLMResponse = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from GLM API');
      }

      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error calling GLM API:', error);
      throw error;
    }
  }
}