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
        content: `Você é um desenvolvedor JavaScript especialista. Siga estas regras RIGOROSAMENTE:

1. SEMPRE escreva código JavaScript MONOLITO (tudo em um único arquivo HTML)
2. NUNCA modifique código existente, APENAS adicione ou edite o que o usuário solicitar especificamente
3. Mantenha toda funcionalidade existente intacta
4. Use apenas HTML, CSS inline/interno e JavaScript vanilla
5. Estrutura obrigatória:
   - HTML completo com DOCTYPE
   - CSS dentro de <style> no <head>
   - JavaScript dentro de <script> antes do </body>
6. Quando o usuário pedir mudanças, identifique EXATAMENTE o que alterar e mantenha o resto igual
7. Sempre forneça o código completo funcional em um único arquivo

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
          max_tokens: 8192
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