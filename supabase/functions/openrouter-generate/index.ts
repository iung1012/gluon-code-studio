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

// Validação de qualidade do HTML gerado
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
  if (!html.match(/media\s*\(/i)) {
    warnings.push('CSS sem media queries (pode não ser responsivo)');
  }
  if (html.includes('<img') && !html.includes('alt=')) {
    warnings.push('Imagens sem atributo alt (acessibilidade)');
  }
  
  return {
    isValid: warnings.length < 3, // Válido se tiver menos de 3 warnings críticos
    warnings
  };
};

// Adicionar Google Fonts ao HTML
const addGoogleFont = (html: string, fontName: string = 'Inter'): string => {
  const fontLink = `  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=${fontName.replace(' ', '+')}:wght@300;400;500;600;700&display=swap" rel="stylesheet">`;
  
  if (html.includes('</head>')) {
    return html.replace('</head>', `${fontLink}\n</head>`);
  }
  return html;
};

// Adicionar Tailwind CSS e outras bibliotecas
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

    let messages: OpenRouterMessage[];

    if (isEdit && currentCode) {
      // Build context from chat history
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
          text: `CÓDIGO HTML ATUAL COMPLETO:\n${currentCode}\n\nINSTRUÇÃO DE ALTERAÇÃO (execute imediatamente): ${prompt}${historyContext}`
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
            text: `Imagem ${index + 1} (use esta imagem conforme a instrução do usuário)`
          });
        });
      }

      content.push({
        type: 'text',
        text: '\nRetorne o HTML completo modificado agora:'
      });

      messages = [
        {
          role: 'system',
          content: `Você é um desenvolvedor web SÊNIOR especializado em criar websites MODERNOS e PROFISSIONAIS usando as melhores práticas.

🎯 REGRAS CRÍTICAS PARA EDIÇÃO:

1. Receba o código HTML monolítico atual completo
2. Leia o histórico de modificações para entender o contexto
3. Identifique EXATAMENTE a parte específica que o usuário quer alterar AGORA
4. Faça APENAS a alteração solicitada na mensagem atual
5. PRESERVE todas as alterações anteriores do histórico
6. NÃO desfaça mudanças que já foram aplicadas
7. NÃO adicione recursos extras não solicitados
8. SEMPRE retorne o arquivo HTML completo funcional
9. Se for mudar "um botão", mude APENAS aquele botão específico mencionado
10. Se imagens forem fornecidas, integre-as conforme a instrução

⚡ SEJA CIRÚRGICO E PRECISO:
- Se o usuário pedir para mudar a cor de UM botão → mude APENAS esse botão
- Se pedir para adicionar UM elemento → adicione APENAS esse elemento
- NÃO reorganize, refatore ou "melhore" código que não foi mencionado
- Quando em dúvida, faça MENOS, não mais
- Mantenha o estilo visual consistente com o código existente

🎨 PADRÕES DE QUALIDADE (aplicar nas modificações):
- Use Tailwind CSS classes sempre que possível
- Mantenha design responsivo (mobile-first)
- Use HTML5 semântico
- Adicione aria-labels para acessibilidade
- Use transições suaves (transition-all duration-200)
- Mantenha cores e espaçamentos consistentes

FORMATO DE RESPOSTA OBRIGATÓRIO:
- Retorne APENAS o código HTML puro
- NÃO use blocos de código markdown (sem \`\`\`html ou \`\`\`)
- NÃO adicione explicações, comentários ou texto adicional
- NÃO faça perguntas - sempre execute a alteração solicitada
- Sua resposta deve começar diretamente com <!DOCTYPE html> e terminar com </html>`
        },
        {
          role: 'user',
          content: content
        }
      ];
    } else {
      const content: Array<{type: 'text' | 'image_url'; text?: string; image_url?: {url: string}}> = [
        {
          type: 'text',
          text: `Crie um website completo HTML monolítico para: ${prompt}`
        }
      ];

      if (hasImages) {
        content.push({
          type: 'text',
          text: '\n\nImagens fornecidas pelo usuário (integre-as no código HTML):'
        });
        
        images.forEach((image: string, index: number) => {
          content.push({
            type: 'image_url',
            image_url: { url: image }
          });
          content.push({
            type: 'text',
            text: `Imagem ${index + 1} (integre esta imagem no HTML usando a tag <img> com src como data URL)`
          });
        });
      }

      messages = [
        {
          role: 'system',
          content: `Você é um desenvolvedor web SÊNIOR especializado em criar websites MODERNOS, RESPONSIVOS e PROFISSIONAIS.

🎯 PRINCÍPIOS FUNDAMENTAIS:
1. HTML5 semântico (<header>, <nav>, <main>, <article>, <section>, <footer>)
2. Design mobile-first e totalmente responsivo
3. CSS moderno com Tailwind CSS (via CDN - já incluído)
4. JavaScript vanilla moderno (ES6+)
5. Acessibilidade (ARIA labels, contraste adequado, navegação por teclado)
6. SEO otimizado (meta tags, estrutura de headings correta)
7. Performance (lazy loading quando apropriado)

🎨 ESTILO VISUAL MODERNO:
- Design clean e profissional
- Espaçamento generoso (use classes Tailwind: p-4, p-6, p-8, etc.)
- Tipografia profissional (Google Fonts já incluído - Inter, Poppins, etc.)
- Cores harmoniosas (use Tailwind color palette)
- Animações sutis (hover:scale-105, transition-all duration-200)
- Sombras e gradientes modernos (shadow-lg, shadow-xl)
- Micro-interações em botões e links

💅 USE TAILWIND CSS (já incluído via CDN):
- SEMPRE use classes Tailwind para estilização
- Exemplos: bg-blue-500, text-white, rounded-lg, shadow-md, hover:bg-blue-600
- Para layouts: flex, grid, container, mx-auto
- Para responsividade: sm:, md:, lg:, xl: prefixes
- Para espaçamento: p-4, m-2, space-y-4, gap-6

📦 BIBLIOTECAS DISPONÍVEIS (via CDN - já incluídas):
- Tailwind CSS para estilização rápida e moderna
- Lucide Icons para ícones modernos (use: <i data-lucide="icon-name"></i>)
- Google Fonts (Inter) para tipografia profissional

🏗️ ESTRUTURA HTML MONOLÍTICA OBRIGATÓRIA:
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="[Descrição SEO]">
  <title>[Título da Página]</title>
  
  <!-- Tailwind CSS (já incluído automaticamente) -->
  <!-- Google Fonts (já incluído automaticamente) -->
  <!-- Lucide Icons (já incluído automaticamente) -->
  
  <style>
    /* CSS customizado adicional aqui (se necessário) */
  </style>
</head>
<body class="font-['Inter']">
  <!-- Conteúdo HTML aqui -->
  
  <script>
    // JavaScript aqui
    // Inicializar Lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  </script>
</body>
</html>

✅ CHECKLIST DE QUALIDADE (sempre verificar):
- ✓ DOCTYPE e meta tags presentes
- ✓ Design responsivo com Tailwind (sm:, md:, lg:)
- ✓ HTML semântico
- ✓ Cores harmoniosas e contraste adequado
- ✓ Animações suaves em interações
- ✓ Acessibilidade (aria-labels em botões e links importantes)
- ✓ Performance (código limpo e otimizado)

FORMATO DE RESPOSTA OBRIGATÓRIO:
- Retorne APENAS o código HTML puro
- NÃO use blocos de código markdown (sem \`\`\`html ou \`\`\`)
- NÃO adicione explicações, comentários ou texto adicional
- NÃO use JSON ou qualquer outro formato
- Sua resposta deve começar diretamente com <!DOCTYPE html> e terminar com </html>
- Tailwind CSS, Google Fonts e Lucide Icons JÁ ESTARÃO incluídos automaticamente`
        },
        {
          role: 'user',
          content: content
        }
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
      
      let errorMessage = `OpenRouter API error: ${response.status}`;
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        }
      } catch (e) {
        // Keep original error message
      }
      
      // Special handling for 401 errors
      if (response.status === 401) {
        errorMessage = 'Chave API inválida ou expirada. Por favor, verifique sua chave OpenRouter nas configurações.';
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Streaming response from OpenRouter');

    // Post-process: adicionar bibliotecas modernas e Google Fonts
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        let accumulatedHtml = '';
        let isCollectingHtml = false;
        
        try {
          while (true) {
            const { done, value } = await reader!.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  // Processar HTML acumulado
                  if (accumulatedHtml.trim().length > 0) {
                    // Adicionar bibliotecas e validar
                    let processedHtml = addModernLibraries(accumulatedHtml);
                    processedHtml = addGoogleFont(processedHtml, 'Inter');
                    
                    // Validar qualidade
                    const validation = validateGeneration(processedHtml);
                    if (validation.warnings.length > 0) {
                      console.log('⚠️ Avisos de qualidade:', validation.warnings);
                    }
                    
                    // Enviar HTML processado
                    const finalEvent = `data: ${JSON.stringify({ 
                      choices: [{ delta: { content: processedHtml.slice(accumulatedHtml.length) } }] 
                    })}\n\n`;
                    controller.enqueue(encoder.encode(finalEvent));
                  }
                  
                  controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                  continue;
                }
                
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  
                  if (content) {
                    accumulatedHtml += content;
                    
                    // Detectar início do HTML
                    if (content.includes('<!DOCTYPE') || content.includes('<html')) {
                      isCollectingHtml = true;
                    }
                    
                    // Enviar chunk original durante geração
                    controller.enqueue(value);
                  }
                } catch (e) {
                  // Passar chunks não-JSON
                  controller.enqueue(value);
                }
              } else {
                controller.enqueue(encoder.encode(line + '\n'));
              }
            }
          }
        } catch (error) {
          console.error('Error processing stream:', error);
          controller.error(error);
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('❌ Error in openrouter-generate:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

