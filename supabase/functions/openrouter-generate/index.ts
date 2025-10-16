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
          content: `Você é um desenvolvedor JavaScript especialista. REGRAS CRÍTICAS PARA EDIÇÃO:

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

IMPORTANTE - SEJA CIRÚRGICO:
- Se o usuário pedir para mudar a cor de UM botão, mude APENAS esse botão
- Se pedir para adicionar UM elemento, adicione APENAS esse elemento
- NÃO reorganize, refatore ou "melhore" código que não foi mencionado
- Quando em dúvida, faça MENOS, não mais

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
          content: `Você é um desenvolvedor JavaScript especialista. Regras OBRIGATÓRIAS:

1. SEMPRE escreva código JavaScript MONOLITO (arquivo HTML único)
2. Estrutura obrigatória:
   - HTML completo com DOCTYPE
   - CSS dentro de <style> no <head>
   - JavaScript dentro de <script> antes do </body>
3. Sempre forneça código completo funcional
4. Use apenas HTML, CSS e JavaScript vanilla
5. Se imagens forem fornecidas, integre-as diretamente no HTML usando as data URLs fornecidas

FORMATO DE RESPOSTA OBRIGATÓRIO:
- Retorne APENAS o código HTML puro
- NÃO use blocos de código markdown (sem \`\`\`html ou \`\`\`)
- NÃO adicione explicações, comentários ou texto adicional
- NÃO use JSON ou qualquer outro formato
- Sua resposta deve começar diretamente com <!DOCTYPE html> e terminar com </html>`
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

    return new Response(response.body, {
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

