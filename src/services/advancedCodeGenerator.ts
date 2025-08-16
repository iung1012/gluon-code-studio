import { GLMApiService } from './glmApi';

interface GeneratedProject {
  html: string;
  css: string;
  javascript: string;
  files: ProjectFile[];
  packageJson?: string;
}

interface ProjectFile {
  name: string;
  path: string;
  content: string;
  type: 'html' | 'css' | 'js' | 'json' | 'md' | 'txt';
}

export class AdvancedCodeGenerator {
  private glmService: GLMApiService;

  constructor(apiKey: string) {
    this.glmService = new GLMApiService(apiKey);
  }

  async generateAdvancedProject(prompt: string): Promise<GeneratedProject> {
    const systemPrompt = `Você é um desenvolvedor full-stack experiente. Gere um projeto web completo e profissional baseado na solicitação do usuário.

IMPORTANTE - ESTRUTURA DE RESPOSTA JSON:
{
  "html": "código HTML completo e válido",
  "css": "CSS personalizado completo com animações e responsividade",
  "javascript": "JavaScript funcional com interações avançadas",
  "files": [
    {
      "name": "index.html",
      "path": "index.html", 
      "content": "conteúdo do arquivo...",
      "type": "html"
    },
    {
      "name": "styles.css",
      "path": "css/styles.css",
      "content": "conteúdo do arquivo...",
      "type": "css"
    },
    {
      "name": "script.js", 
      "path": "js/script.js",
      "content": "conteúdo do arquivo...",
      "type": "js"
    }
  ],
  "packageJson": "package.json para Node.js se necessário"
}

DIRETRIZES TÉCNICAS:
1. HTML5 semântico e acessível
2. CSS moderno com Grid, Flexbox, animações e responsividade completa
3. JavaScript ES6+ com funcionalidades interativas
4. Design responsivo para mobile, tablet e desktop
5. Otimização de performance e SEO
6. Código limpo e bem comentado
7. Use bibliotecas CDN quando apropriado (AOS, Swiper, etc.)
8. Implementar dark/light mode quando relevante
9. Adicionar meta tags e OpenGraph
10. Incluir favicon e manifest.json

FUNCIONALIDADES AVANÇADAS:
- Animações CSS e JavaScript
- Formulários funcionais com validação
- Carrosséis e galerias interativas
- Navegação suave (smooth scroll)
- Loading states e transições
- Modais e overlays
- Responsividade pixel-perfect
- Otimização de imagens (lazy loading)

Retorne APENAS o JSON válido sem explicações.`;

    try {
      const response = await fetch('https://api.z.ai/api/paas/v4/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.glmService['apiKey']}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'glm-4-32b-0414-128k',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Crie um projeto completo para: ${prompt}` }
          ],
          temperature: 0.7,
          max_tokens: 8192
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      // Parse JSON response
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      
      try {
        const projectData = JSON.parse(cleanContent);
        return this.validateAndEnhanceProject(projectData);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        return this.createFallbackProject(prompt);
      }
    } catch (error) {
      console.error('Error generating advanced project:', error);
      return this.createFallbackProject(prompt);
    }
  }

  private validateAndEnhanceProject(project: any): GeneratedProject {
    // Garantir estrutura básica
    const html = project.html || this.createBasicHTML();
    const css = project.css || this.createBasicCSS();
    const javascript = project.javascript || this.createBasicJS();
    
    // Garantir arquivos essenciais
    const files: ProjectFile[] = [
      {
        name: 'index.html',
        path: 'index.html',
        content: html,
        type: 'html'
      },
      {
        name: 'styles.css',
        path: 'css/styles.css', 
        content: css,
        type: 'css'
      },
      {
        name: 'script.js',
        path: 'js/script.js',
        content: javascript,
        type: 'js'
      },
      {
        name: 'README.md',
        path: 'README.md',
        content: this.createReadme(),
        type: 'md'
      }
    ];

    // Adicionar arquivos extras do projeto
    if (project.files && Array.isArray(project.files)) {
      project.files.forEach((file: any) => {
        if (file.name && file.content) {
          files.push({
            name: file.name,
            path: file.path || file.name,
            content: file.content,
            type: file.type || 'txt'
          });
        }
      });
    }

    return {
      html,
      css,
      javascript,
      files,
      packageJson: project.packageJson
    };
  }

  private createFallbackProject(prompt: string): GeneratedProject {
    return {
      html: this.createBasicHTML(prompt),
      css: this.createBasicCSS(),
      javascript: this.createBasicJS(),
      files: [
        {
          name: 'index.html',
          path: 'index.html',
          content: this.createBasicHTML(prompt),
          type: 'html'
        },
        {
          name: 'styles.css', 
          path: 'css/styles.css',
          content: this.createBasicCSS(),
          type: 'css'
        }
      ]
    };
  }

  private createBasicHTML(title = 'Website'): string {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link rel="stylesheet" href="css/styles.css">
</head>
<body>
    <header>
        <nav>
            <div class="container">
                <h1>${title}</h1>
            </div>
        </nav>
    </header>
    <main>
        <section class="hero">
            <div class="container">
                <h2>Bem-vindo ao ${title}</h2>
                <p>Este é um projeto gerado automaticamente.</p>
                <button class="btn-primary">Saiba Mais</button>
            </div>
        </section>
    </main>
    <script src="js/script.js"></script>
</body>
</html>`;
  }

  private createBasicCSS(): string {
    return `/* Reset CSS */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

/* Variables */
:root {
    --primary-color: #3b82f6;
    --secondary-color: #1e40af;
    --accent-color: #f59e0b;
    --text-color: #1f2937;
    --bg-color: #ffffff;
    --gray-100: #f3f4f6;
    --gray-200: #e5e7eb;
}

/* Base Styles */
body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    color: var(--text-color);
    background: var(--bg-color);
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

/* Header */
header {
    background: var(--bg-color);
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000;
}

nav {
    padding: 1rem 0;
}

nav h1 {
    color: var(--primary-color);
    font-size: 1.8rem;
}

/* Main */
main {
    margin-top: 80px;
}

.hero {
    padding: 4rem 0;
    background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
    color: white;
    text-align: center;
}

.hero h2 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
}

.hero p {
    font-size: 1.2rem;
    margin-bottom: 2rem;
    opacity: 0.9;
}

/* Buttons */
.btn-primary {
    background: var(--accent-color);
    color: white;
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1.1rem;
    transition: all 0.3s ease;
}

.btn-primary:hover {
    background: #d97706;
    transform: translateY(-2px);
}

/* Responsive */
@media (max-width: 768px) {
    .hero h2 {
        font-size: 2rem;
    }
    
    .hero p {
        font-size: 1rem;
    }
    
    .container {
        padding: 0 15px;
    }
}`;
  }

  private createBasicJS(): string {
    return `// Website JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('Website carregado com sucesso!');
    
    // Smooth scroll para links internos
    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Button click handlers
    const buttons = document.querySelectorAll('.btn-primary');
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            console.log('Botão clicado!');
            // Adicione sua lógica aqui
        });
    });
    
    // Mobile menu toggle (se existir)
    const menuToggle = document.querySelector('.menu-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    
    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', function() {
            mobileMenu.classList.toggle('active');
        });
    }
    
    // Loading animation
    window.addEventListener('load', function() {
        document.body.classList.add('loaded');
    });
});

// Utility functions
function showMessage(message, type = 'info') {
    console.log(\`[\${type.toUpperCase()}] \${message}\`);
}

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}`;
  }

  private createReadme(): string {
    return `# Projeto Gerado Automaticamente

## Descrição
Este projeto foi gerado automaticamente usando IA avançada.

## Estrutura
- \`index.html\` - Página principal
- \`css/styles.css\` - Estilos personalizados
- \`js/script.js\` - JavaScript interativo

## Como usar
1. Abra o arquivo \`index.html\` em um navegador
2. Customize os arquivos conforme necessário
3. Teste a responsividade em diferentes dispositivos

## Funcionalidades
- Design responsivo
- Animações CSS
- JavaScript interativo
- Otimizado para performance

## Personalização
Modifique as variáveis CSS em \`:root\` para alterar cores e espaçamentos.

---
Gerado com ❤️ pelo Studio de Desenvolvimento`;
  }
}