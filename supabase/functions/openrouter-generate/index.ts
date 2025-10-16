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
      console.error('Profile error:', profileError);
      return new Response(
        JSON.stringify({ error: 'API key not configured. Please add your OpenRouter API key in settings.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { 
      prompt, 
      currentCode, 
      images, 
      modelType = 'basic',
      isEdit = false 
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
      const content: Array<{type: 'text' | 'image_url'; text?: string; image_url?: {url: string}}> = [
        {
          type: 'text',
          text: `CÓDIGO HTML ATUAL COMPLETO:\n${currentCode}\n\nINSTRUÇÃO DE ALTERAÇÃO (execute imediatamente): ${prompt}`
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
          content: `Você é um desenvolvedor JavaScript especialista. REGRAS CRÍTICAS:\n\n1. Receba o código HTML monolítico atual completo\n2. Identifique EXATAMENTE a parte que o usuário quer alterar\n3. Faça APENAS a alteração solicitada\n4. Mantenha TODO o resto do código EXATAMENTE igual\n5. SEMPRE retorne o arquivo HTML completo funcional\n6. Se imagens forem fornecidas, integre-as conforme a instrução do usuário usando as data URLs\n\nCRÍTICO: NUNCA responda com explicações ou perguntas. SEMPRE retorne HTML completo válido.\nSe não entender a solicitação, faça uma interpretação inteligente e aplique a mudança.\nNUNCA pergunte o que fazer - sempre execute a alteração solicitada.\n\nIMPORTANTE: Retorne APENAS o código HTML completo, sem JSON, sem explicações, sem formatação adicional. Apenas o código HTML puro que funciona diretamente no navegador.`
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
          content: `Você é um desenvolvedor JavaScript especialista. Regras OBRIGATÓRIAS:\n\n1. SEMPRE escreva código JavaScript MONOLITO (arquivo HTML único)\n2. Estrutura obrigatória:\n   - HTML completo com DOCTYPE\n   - CSS dentro de <style> no <head>\n   - JavaScript dentro de <script> antes do </body>\n3. Sempre forneça código completo funcional\n4. Use apenas HTML, CSS e JavaScript vanilla\n5. Se imagens forem fornecidas, integre-as diretamente no HTML usando as data URLs fornecidas\n\nIMPORTANTE: Retorne APENAS o código HTML completo, sem JSON, sem explicações, sem formatação adicional. Apenas o código HTML puro que funciona diretamente no navegador.`
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

