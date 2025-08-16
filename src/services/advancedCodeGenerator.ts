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
        content: `Você é um especialista em desenvolvimento web full-stack. Crie um projeto completo e profissional com personalização avançada via CSS, JavaScript vanilla e Node.js quando necessário.

ESTRUTURA OBRIGATÓRIA:
- HTML semântico e acessível 
- CSS moderno com:
  * Custom properties (CSS variables)
  * Grid e Flexbox
  * Animações e transições
  * Media queries para responsividade
  * Dark/light theme support
- JavaScript vanilla ES6+ com:
  * Modules
  * Classes
  * Event handlers
  * API calls
  * LocalStorage/SessionStorage
  * Animations via CSS classes
- Node.js/Express (quando aplicável):
  * API endpoints
  * Middleware
  * Database connection
  * Authentication

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

REQUISITOS TÉCNICOS:
- Código 100% funcional e executável
- Variáveis CSS para temas
- JavaScript modular e reutilizável  
- Responsivo (mobile-first)
- Performance otimizada
- SEO-friendly
- Acessibilidade (ARIA labels)
- Compatibilidade cross-browser

IMPORTANTE: Retorne APENAS o JSON válido, sem markdown ou explicações.`
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