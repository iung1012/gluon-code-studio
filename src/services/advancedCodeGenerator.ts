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

export interface ProjectFile {
  name: string;
  type: 'file' | 'folder';
  path: string;
  content?: string;
  children?: ProjectFile[];
}

export class AdvancedCodeGenerator {
  private apiKey: string;
  private baseUrl = 'https://api.z.ai/api/paas/v4/chat/completions';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateAdvancedProject(prompt: string): Promise<string> {
    const messages: GLMMessage[] = [
      {
        role: 'system',
        content: `Você é um especialista em desenvolvimento web full-stack. Crie um projeto WEB COMPLETO e AVANÇADO com tecnologias modernas.

REQUISITOS OBRIGATÓRIOS - PROJETO PROFISSIONAL:
- HTML5 semântico e acessível (semantic tags, ARIA, meta tags)
- CSS3 AVANÇADO com:
  * Custom properties e CSS Variables complexas
  * CSS Grid + Flexbox layouts sofisticados  
  * Animações CSS3 e @keyframes elaboradas
  * Transitions e transforms 3D
  * Media queries mobile-first responsivo
  * Dark/Light theme automático
  * Gradients, shadows, blur effects
  * CSS animations para interatividade
- JavaScript ES6+ MODERNO:
  * Classes ES6+ e Modules
  * Async/await e Promises
  * Event delegation e listeners
  * Intersection Observer API
  * LocalStorage + SessionStorage
  * Fetch API para requisições
  * DOM manipulation avançado
  * Animations e GSAP-like effects
  * Dynamic content loading
- Node.js/Express BACKEND:
  * RESTful API endpoints completos
  * Middleware customizado
  * Database integration (MongoDB/SQLite)
  * Authentication JWT
  * File uploads e processing
  * Error handling robusto

FORMATO DE RESPOSTA JSON:
{
  "files": [
    {
      "name": "index.html",
      "type": "file",
      "path": "./index.html",
      "content": "<!DOCTYPE html>..."
    },
    {
      "name": "css",
      "type": "folder", 
      "path": "./css",
      "children": [
        {
          "name": "main.css",
          "type": "file",
          "path": "./css/main.css",
          "content": ":root { --primary-color: #007bff; }..."
        },
        {
          "name": "responsive.css",
          "type": "file",
          "path": "./css/responsive.css", 
          "content": "@media (max-width: 768px) { ... }"
        }
      ]
    },
    {
      "name": "js",
      "type": "folder",
      "path": "./js", 
      "children": [
        {
          "name": "main.js",
          "type": "file",
          "path": "./js/main.js",
          "content": "class App { constructor() { this.init(); } ..."
        },
        {
          "name": "utils.js", 
          "type": "file",
          "path": "./js/utils.js",
          "content": "export const utils = { ... }"
        }
      ]
    },
    {
      "name": "server.js",
      "type": "file",
      "path": "./server.js",
      "content": "const express = require('express'); ..."
    },
    {
      "name": "package.json",
      "type": "file",
      "path": "./package.json",
      "content": "{ \"name\": \"...\", \"dependencies\": {...} }"
    }
  ]
}

REQUISITOS TÉCNICOS AVANÇADOS:
- Código 100% funcional, executável e testado
- Design system completo com variáveis CSS
- JavaScript modular, reutilizável e performático
- Responsivo mobile-first com breakpoints
- Performance otimizada (lazy loading, compression)
- SEO-friendly (meta tags, structured data)
- Acessibilidade WCAG 2.1 completa
- Cross-browser compatibility
- Error handling e validação
- Loading states e feedback visual
- Smooth animations e micro-interactions
- Professional UI/UX design

IMPORTANTE CRÍTICO: 
1. ESCAPE todas as aspas e caracteres especiais no JSON
2. Use \\n para quebras de linha no código
3. Use \\\\ para backslashes literais
4. Retorne APENAS JSON válido, sem markdown
5. Teste mentalmente o JSON antes de retornar

EXEMPLO DE ESCAPE CORRETO:
"content": "function test() {\\n  console.log(\\"Hello\\");\\n}"

NUNCA use aspas não escapadas dentro do JSON!`
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
          temperature: 0.7,
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

  async enhanceExistingCode(prompt: string, currentCode: string): Promise<string> {
    const messages: GLMMessage[] = [
      {
        role: 'system',
        content: `Você é um especialista em desenvolvimento web. Aprimore e modifique o código existente baseado na solicitação do usuário.

INSTRUÇÕES:
- Mantenha a estrutura existente quando possível
- Adicione melhorias modernas (CSS Grid, Flexbox, ES6+)
- Otimize performance e acessibilidade  
- Adicione funcionalidades solicitadas
- Use boas práticas de desenvolvimento
- Retorne o código completo modificado

FORMATO: Retorne APENAS o código atualizado, sem explicações.`
      },
      {
        role: 'user',
        content: `Código atual:
${currentCode}

Modificação solicitada:
${prompt}`
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
          max_tokens: 6144
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