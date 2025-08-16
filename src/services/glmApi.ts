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
        content: `Você é um especialista em desenvolvimento web. Baseado na solicitação do usuário, gere uma estrutura de website completa usando HTML, CSS e JavaScript puro.

IMPORTANTE:
- Retorne a resposta no formato JSON específico abaixo
- Crie SEMPRE 3 arquivos obrigatórios: index.html, styles.css e script.js
- O HTML deve ser semântico e completo (com DOCTYPE, meta tags, etc.)
- O CSS deve ser moderno e responsivo (use flexbox, grid, media queries)
- O JavaScript deve ser funcional e interativo (validações, eventos, animações)
- Cada arquivo deve ter conteúdo completo e funcional
- Use boas práticas de SEO e acessibilidade

Estrutura obrigatória:
- index.html: Estrutura completa da página
- styles.css: Estilos modernos e responsivos  
- script.js: Funcionalidades e validações

Formato de resposta JSON:
{
  "files": [
    {
      "name": "index.html",
      "type": "file",
      "path": "index.html",
      "content": "<!DOCTYPE html>\\n<html lang=\\"pt-BR\\">\\n<head>\\n  <meta charset=\\"UTF-8\\">\\n  <meta name=\\"viewport\\" content=\\"width=device-width, initial-scale=1.0\\">\\n  <title>...</title>\\n  <link rel=\\"stylesheet\\" href=\\"styles.css\\">\\n</head>\\n<body>\\n  ...\\n  <script src=\\"script.js\\"></script>\\n</body>\\n</html>"
    },
    {
      "name": "styles.css",
      "type": "file",
      "path": "styles.css", 
      "content": "/* CSS moderno e responsivo */"
    },
    {
      "name": "script.js",
      "type": "file",
      "path": "script.js",
      "content": "// JavaScript funcional e interativo"
    }
  ]
}`
      },
      {
        role: 'user',
        content: `Crie um website completo com HTML, CSS e JavaScript para: ${prompt}`
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