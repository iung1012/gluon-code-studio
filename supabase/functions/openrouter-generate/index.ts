import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{
    type: 'text' | 'image_url';
    text?: string;
    image_url?: {
      url: string;
    };
  }>;
}

const TEMPLATES = {
  components: {
    navbar: `<nav class="bg-white shadow-lg">
  <div class="container mx-auto px-4 py-4 flex justify-between items-center">
    <a href="#" class="text-2xl font-bold text-gray-800">Logo</a>
    <div class="hidden md:flex space-x-6">
      <a href="#" class="text-gray-600 hover:text-blue-600 transition-colors">Home</a>
      <a href="#" class="text-gray-600 hover:text-blue-600 transition-colors">Sobre</a>
      <a href="#" class="text-gray-600 hover:text-blue-600 transition-colors">Contato</a>
    </div>
    <button class="md:hidden" aria-label="Menu">
      <i data-lucide="menu" class="w-6 h-6"></i>
    </button>
  </div>
</nav>`,
    
    hero: `<section class="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-20">
  <div class="container mx-auto px-4 text-center">
    <h1 class="text-5xl font-bold mb-4 animate-fade-in">Título Impactante</h1>
    <p class="text-xl mb-8 opacity-90">Subtítulo descritivo que engaja o usuário</p>
    <button class="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg">
      Call to Action
    </button>
  </div>
</section>`,
    
    card: `<div class="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow">
  <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
    <i data-lucide="zap" class="w-6 h-6 text-blue-600"></i>
  </div>
  <h3 class="text-xl font-semibold mb-2">Título do Card</h3>
  <p class="text-gray-600">Descrição concisa do conteúdo ou recurso apresentado.</p>
</div>`,
    
    footer: `<footer class="bg-gray-900 text-white py-8">
  <div class="container mx-auto px-4">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
      <div>
        <h4 class="font-bold mb-4">Empresa</h4>
        <ul class="space-y-2">
          <li><a href="#" class="text-gray-400 hover:text-white transition-colors">Sobre</a></li>
          <li><a href="#" class="text-gray-400 hover:text-white transition-colors">Contato</a></li>
        </ul>
      </div>
    </div>
    <div class="border-t border-gray-800 pt-6 text-center text-gray-400">
      <p>&copy; 2025 Empresa. Todos os direitos reservados.</p>
    </div>
  </div>
</footer>`
  }
};

const extractCodeContext = (html: string): string => {
  const context: string[] = [];
  
  const hasNav = html.match(/<nav/i);
  const hasHeader = html.match(/<header/i);
  const hasMain = html.match(/<main/i);
  const hasFooter = html.match(/<footer/i);
  
  if (hasNav || hasHeader || hasMain || hasFooter) {
    const structure = [];
    if (hasNav) structure.push('navbar');
    if (hasHeader) structure.push('header');
    if (hasMain) structure.push('main content');
    if (hasFooter) structure.push('footer');
    context.push(`Estrutura: ${structure.join(' + ')}`);
  }
  
  const hasTailwind = html.includes('tailwindcss') || html.match(/class=\"[^\"]*(?:bg-|text-|flex|grid)/);
  if (hasTailwind) {
    context.push('Framework: Tailwind CSS');
  }
  
  const colorMatches = html.match(/(?:bg|text)-(?:blue|red|green|purple|gray|indigo|pink)-\d{3}/g);
  if (colorMatches && colorMatches.length > 0) {
    const uniqueColors = [...new Set(colorMatches.map(c => c.split('-')[1]))];
    context.push(`Cores: ${uniqueColors.slice(0, 3).join(', ')}`);
  }
  
  const components = [];
  if (html.includes('button')) components.push('buttons');
  if (html.includes('card') || html.match(/class=\"[^\"]*(?:shadow|rounded)/)) components.push('cards');
  if (html.includes('form') || html.includes('input')) components.push('forms');
  if (components.length > 0) {
    context.push(`Componentes: ${components.join(', ')}`);
  }
  
  if (html.includes('<script>')) {
    context.push('Possui JavaScript customizado');
  }
  
  return context.join(' | ');
};

const validateGeneration = (html: string): { isValid: boolean; warnings: string[] } => {
  const warnings: string[] = [];
  
  if (!html.includes('<!DOCTYPE html>')) {
    warnings.push('HTML sem DOCTYPE');
  }
  if (!html.includes('viewport')) {
    warnings.push('Meta viewport ausente (não responsivo)');
  }
  if (!html.includes('charset')) {
    warnings.push('Charset ausente');
  }
  if (!html.match(/<(header|nav|main|article|section|footer)/)) {
    warnings.push('HTML não semântico (falta tags semânticas)');
  }
  if (!html.match(/media\s\(/i)) {
    warnings.push('CSS sem media queries (pode não ser responsivo)');
  }
  if (html.includes('<img') && !html.includes('alt=')) {
    warnings.push('Imagens sem atributo alt (acessibilidade)');
  }
  
  return {
    isValid: warnings.length < 3,
    warnings
  };
};

const addGoogleFont = (html: string, fontName: string = 'Inter'): string => {
  const fontLink = `  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=${fontName.replace(' ', '+')}:wght@300;400;500;600;700&display=swap" rel="stylesheet">`;
  
  if (html.includes('</head>')) {
    return html.replace('</head>', `${fontLink}\n</head>`);
  }
  return html;
};

const addModernLibraries = (html: string): string => {
  const libraries = `  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  
  <!-- Lucide Icons -->
  <script src="https://unpkg.com/lucide@latest"></script>`;
  
  if (html.includes('</head>')) {
    return html.replace('</head>', `${libraries}\n</head>`);
  }
  return html;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      throw new Error('Unauthorized');
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('openrouter_api_key')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.openrouter_api_key) {
      console.error('❌ API key not configured for user:', user.id, 'Error:', profileError);
      return new Response(
        JSON.stringify({ error: 'Chave API não configurada. Por favor, configure sua chave OpenRouter nas configurações.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { 
      prompt, 
      currentCode, 
      images, 
      modelType = 'basic',
      isEdit = false,
      chatHistory = []
    } = await req.json();

    if (!prompt) {
      throw new Error('Prompt is required');
    }

    console.log('📝 Request:', { 
      userId: user.id, 
      promptLength: prompt.length, 
      isEdit, 
      hasImages: !!images?.length,
      modelType 
    });

    const basicModel = 'moonshotai/kimi-k2:free';
    const proModel = 'z-ai/glm-4.5-air';
    const visionModel = 'z-ai/glm-4.5-air';
    
    const hasImages = images && images.length > 0;
    const selectedModel = hasImages ? visionModel : (modelType === 'pro' ? proModel : basicModel);

    console.log(`🎯 Using model: ${selectedModel}`);

    const systemPrompt = `You are an expert full-stack web developer specializing in React, Vite, and modern web technologies.

CRITICAL INSTRUCTIONS - RESPONSE FORMAT:

**FOR SIMPLE STATIC WEBSITES** (landing pages, portfolios, simple forms):
- Return ONLY valid HTML code - no markdown, no explanations, no code blocks
- Include ALL CSS and JavaScript inline
- START directly with <!DOCTYPE html>

**FOR INTERACTIVE/COMPLEX APPS** (dashboards, SPAs, component-based apps, anything requiring state management):
- Return a JSON object with this EXACT structure (no markdown blocks):
{
  "files": [
    {"path": "package.json", "content": "..."},
    {"path": "index.html", "content": "..."},
    {"path": "vite.config.ts", "content": "..."},
    {"path": "tsconfig.json", "content": "..."},
    {"path": "src/main.tsx", "content": "..."},
    {"path": "src/App.tsx", "content": "..."},
    {"path": "src/App.css", "content": "..."}
  ]
}

REACT PROJECT REQUIREMENTS:
1. **package.json**: Include react@^18.3.1, react-dom@^18.3.1, typescript@^5.5.3, vite@^5.4.2, @vitejs/plugin-react@^4.3.1
2. **index.html**: Standard Vite template with <div id="root"></div> and <script type="module" src="/src/main.tsx"></script>
3. **vite.config.ts**: Basic Vite config with React plugin
4. **tsconfig.json**: Standard React + Vite TypeScript config
5. **src/main.tsx**: ReactDOM.createRoot render
6. **src/App.tsx**: Main component with modern React patterns
7. **src/App.css**: Modern CSS with good styling

DESIGN PRINCIPLES:
- Clean, modern UI with excellent contrast
- Responsive design (mobile-first)
- Accessible (semantic HTML, ARIA labels)
- Interactive and functional
- Beautiful animations and transitions

WHEN TO USE EACH:
- Use HTML for: landing pages, marketing sites, simple forms
- Use React for: dashboards, SPAs, interactive tools, complex state management

DO NOT include markdown code blocks or explanations.`;

    let messages: OpenRouterMessage[];

    if (isEdit && currentCode) {
      const codeContext = extractCodeContext(currentCode);
      
      let historyContext = '';
      if (chatHistory && chatHistory.length > 0) {
        historyContext = '\n\nHISTÓRICO DE MODIFICAÇÕES ANTERIORES:\n';
        chatHistory.forEach((msg: any) => {
          if (msg.role === 'user') {
            historyContext += `- Usuário pediu: "${msg.content}"\n`;
          }
        });
        historyContext += '\nNÃO desfaça essas alterações anteriores. Adicione a nova modificação preservando o que já foi feito.\n';
      }

      const content: Array<{type: 'text' | 'image_url'; text?: string; image_url?: {url: string}}> = [
        {
          type: 'text',
          text: `CONTEXTO DO PROJETO ATUAL:\n${codeContext}\n\nCÓDIGO ATUAL COMPLETO:\n${currentCode}\n\nINSTRUÇÃO DE ALTERAÇÃO: ${prompt}${historyContext}`
        }
      ];

      if (hasImages) {
        content.push({
          type: 'text',
          text: '\n\nImagens fornecidas pelo usuário (integre-as conforme solicitado):'
        });
        
        images.forEach((image: string, index: number) => {
          content.push({
            type: 'image_url',
            image_url: { url: image }
          });
          content.push({
            type: 'text',
            text: `Imagem ${index + 1}`
          });
        });
      }

      messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: content }
      ];
    } else {
      const content: Array<{type: 'text' | 'image_url'; text?: string; image_url?: {url: string}}> = [
        {
          type: 'text',
          text: `Crie um projeto completo para: ${prompt}`
        }
      ];

      if (hasImages) {
        content.push({
          type: 'text',
          text: '\n\nImagens fornecidas pelo usuário:'
        });
        
        images.forEach((image: string, index: number) => {
          content.push({
            type: 'image_url',
            image_url: { url: image }
          });
        });
      }

      messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: content }
      ];
    }

    console.log('🔑 Using API key (first 10 chars):', profile.openrouter_api_key.substring(0, 10) + '...');
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${profile.openrouter_api_key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': Deno.env.get('SUPABASE_URL') ?? '',
        'X-Title': 'CoderIA'
      },
      body: JSON.stringify({
        model: selectedModel,
        messages,
        temperature: 0.4,
        max_tokens: 4000,
        top_p: 0.8,
        stream: true
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenRouter API error:', response.status, errorText);
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    if (!response.body) {
      throw new Error('No response body from OpenRouter');
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const reader = response.body!.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              controller.close();
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.trim() === '' || !line.startsWith('data: ')) continue;
              
              const dataStr = line.slice(6).trim();
              if (dataStr === '[DONE]') continue;

              try {
                controller.enqueue(encoder.encode(`data: ${dataStr}\n\n`));
              } catch (parseError) {
                console.warn('Failed to parse chunk:', dataStr.substring(0, 100));
              }
            }
          }

          if (buffer.trim()) {
            const dataStr = buffer.slice(buffer.indexOf('data:') + 6).trim();
            if (dataStr && dataStr !== '[DONE]') {
              try {
                controller.enqueue(encoder.encode(`data: ${dataStr}\n\n`));
              } catch { }
            }
          }
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    });

  } catch (error) {
    console.error('❌ Error in openrouter-generate function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
