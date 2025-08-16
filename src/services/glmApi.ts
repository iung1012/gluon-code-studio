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

1. SEMPRE escreva código JavaScript MONOLITO (arquivo app.js único)
2. NUNCA modifique código existente - APENAS edite o que o usuário solicitar
3. Estrutura obrigatória do app.js:
   - Configuração inicial e constantes
   - Sistema de roteamento SPA
   - Gerenciamento de estado global
   - Componentes como funções JavaScript
   - Estilos CSS-in-JS ou template strings
   - Event listeners e interatividade
   - Inicialização da aplicação
4. Para edições: identifique EXATAMENTE o que alterar e mantenha resto igual
5. Sempre forneça código completo funcional
6. Use apenas JavaScript vanilla, template strings para HTML e objetos para CSS

FORMATO DE RESPOSTA JSON OBRIGATÓRIO:
{
  "files": [
    {
      "name": "app.js",
      "type": "file", 
      "path": "app.js",
      "content": "// JavaScript Monolítico - Single File App\\n\\n// === CONFIGURAÇÃO ===\\nconst APP = {\\n  state: {},\\n  router: {},\\n  components: {},\\n  utils: {}\\n};\\n\\n// === ESTILOS ===\\nconst styles = \`/* CSS aqui */\`;\\n\\n// === COMPONENTES ===\\n// Funções que retornam HTML\\n\\n// === ROTEAMENTO ===\\n// Sistema SPA\\n\\n// === INICIALIZAÇÃO ===\\ndocument.addEventListener('DOMContentLoaded', () => {\\n  // Inject styles\\n  const styleEl = document.createElement('style');\\n  styleEl.textContent = styles;\\n  document.head.appendChild(styleEl);\\n  // Initialize app\\n});\\n\\n// HTML STRUCTURE\\ndocument.body.innerHTML = \`<div id='app'></div>\`;"
    }
  ]
}`
      },
      {
        role: 'user',
        content: `Crie um website JavaScript monolítico completo para: ${prompt}`
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
}