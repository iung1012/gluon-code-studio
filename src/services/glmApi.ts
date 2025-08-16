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
        content: `Você é um especialista em desenvolvimento web. Baseado na solicitação do usuário, gere um website completo usando JavaScript Monolítico (Single-File Architecture).

IMPORTANTE - ARQUITETURA MONOLÍTICA:
- Crie APENAS 1 arquivo: app.js
- TODO o código HTML, CSS e JavaScript deve estar em um único arquivo
- Use template strings para HTML
- Use objetos JavaScript para CSS-in-JS
- Inclua todas as funcionalidades: roteamento SPA, componentes, estado, API calls
- O arquivo deve ser completamente autossuficiente e funcional

ESTRUTURA OBRIGATÓRIA do app.js:
1. Configuração inicial e constantes
2. Sistema de roteamento SPA
3. Gerenciamento de estado global
4. Componentes como funções JavaScript
5. Estilos CSS-in-JS ou template strings
6. Event listeners e interatividade
7. Inicialização da aplicação

Formato de resposta JSON:
{
  "files": [
    {
      "name": "app.js",
      "type": "file",
      "path": "app.js",
      "content": "// JavaScript Monolítico - Single File App\\n\\n// === CONFIGURAÇÃO ===\\nconst APP = {\\n  state: {},\\n  router: {},\\n  components: {},\\n  utils: {}\\n};\\n\\n// === ESTILOS ===\\nconst styles = \`/* CSS aqui */\`;\\n\\n// === COMPONENTES ===\\n// Funções que retornam HTML\\n\\n// === ROTEAMENTO ===\\n// Sistema SPA\\n\\n// === INICIALIZAÇÃO ===\\ndocument.addEventListener('DOMContentLoaded', () => {\\n  // Inject styles\\n  const styleEl = document.createElement('style');\\n  styleEl.textContent = styles;\\n  document.head.appendChild(styleEl);\\n  \\n  // Initialize app\\n});\\n\\n// === HTML STRUCTURE ===\\ndocument.body.innerHTML = \`<div id='app'></div>\`;"
    }
  ]
}`
      },
      {
        role: 'user',
        content: `Crie um website JavaScript Monolítico (arquivo único) para: ${prompt}`
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