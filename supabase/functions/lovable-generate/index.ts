import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are an expert full-stack web developer specializing in modern React applications.

🎯 YOUR TASK: Generate complete, production-ready React projects with proper file structure.

📦 CRITICAL OUTPUT FORMAT:
You MUST return ONLY valid JSON in this EXACT structure:

{
  "files": [
    {
      "path": "package.json",
      "content": "{ ... complete package.json content ... }"
    },
    {
      "path": "index.html",
      "content": "<!DOCTYPE html>..."
    },
    {
      "path": "vite.config.ts",
      "content": "import { defineConfig } from 'vite'..."
    },
    {
      "path": "tsconfig.json",
      "content": "{ ... complete tsconfig ... }"
    },
    {
      "path": "src/main.tsx",
      "content": "import React from 'react'..."
    },
    {
      "path": "src/App.tsx",
      "content": "export default function App() { ... }"
    },
    {
      "path": "src/App.css",
      "content": "/* styles */"
    },
    {
      "path": "src/components/Example.tsx",
      "content": "export default function Example() { ... }"
    }
  ]
}

🚨 MANDATORY FILES (always include these):

1. package.json:
{
  "name": "app",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "lucide-react": "^0.462.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "typescript": "^5.5.4",
    "vite": "^5.4.2"
  }
}

2. index.html:
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>

3. vite.config.ts:
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})

4. tsconfig.json:
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}

5. src/main.tsx:
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './App.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

6. src/App.tsx - Main component (always use default export)
7. src/App.css - Styles
8. src/components/*.tsx - Additional components as needed

✅ CRITICAL RULES:

1. EXPORTS/IMPORTS:
   - ALL components MUST use: export default function ComponentName()
   - ALL imports MUST use: import ComponentName from './ComponentName'
   - NEVER use named exports in React components

2. FILE STRUCTURE:
   - Organize components in src/components/
   - Keep utilities in src/utils/ if needed
   - Each component in its own file

3. CODE QUALITY:
   - TypeScript strict mode
   - Proper types for all props
   - Semantic HTML
   - Accessible components (ARIA)
   - Mobile-first responsive design

4. STYLING:
   - Use modern CSS with Tailwind-style utilities
   - Beautiful, professional UI
   - Smooth animations and transitions

5. COMPLETENESS:
   - Every file must be 100% complete
   - No placeholders or "// rest of code"
   - Fully functional from first run

❌ FORBIDDEN:
- Markdown code blocks (\`\`\`)
- Explanatory text before/after JSON
- Named exports (export function/const)
- Incomplete code or placeholders
- Missing import statements

✅ REQUIRED:
- Pure JSON response only
- Complete file contents
- All imports properly declared
- Working code with no errors

Remember: Your entire response must be valid JSON starting with { and ending with }`

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

    const { prompt, currentCode, isEdit = false, images = [] } = await req.json();

    if (!prompt) {
      throw new Error('Prompt is required');
    }

    console.log('📝 Generation request:', { 
      userId: user.id, 
      isEdit, 
      hasImages: images.length > 0,
      promptLength: prompt.length 
    });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Build messages for the AI
    const messages: any[] = [
      { role: 'system', content: SYSTEM_PROMPT }
    ];

    if (isEdit && currentCode) {
      // For edits, provide current code context
      const userContent: any[] = [
        {
          type: 'text',
          text: `CURRENT PROJECT:\n\n${currentCode}\n\nMODIFICATION REQUEST: ${prompt}\n\nIMPORTANT: Return the COMPLETE updated project with all files. Maintain existing functionality and add the requested changes.`
        }
      ];

      // Add images if provided
      if (images.length > 0) {
        userContent.push({ type: 'text', text: '\n\nREFERENCE IMAGES:' });
        images.forEach((img: string, idx: number) => {
          userContent.push({
            type: 'image_url',
            image_url: { url: img }
          });
          userContent.push({ type: 'text', text: `Image ${idx + 1}` });
        });
      }

      messages.push({ role: 'user', content: userContent });
    } else {
      // For new projects
      const userContent: any[] = [
        {
          type: 'text',
          text: `Create a complete React project for: ${prompt}`
        }
      ];

      // Add images if provided
      if (images.length > 0) {
        userContent.push({ type: 'text', text: '\n\nREFERENCE IMAGES:' });
        images.forEach((img: string, idx: number) => {
          userContent.push({
            type: 'image_url',
            image_url: { url: img }
          });
          userContent.push({ type: 'text', text: `Image ${idx + 1}` });
        });
      }

      messages.push({ role: 'user', content: userContent });
    }

    console.log('🤖 Calling Lovable AI Gateway...');

    // Call Lovable AI with structured output using tool calling
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        temperature: 0.3,
        stream: true,
        tools: [
          {
            type: 'function',
            function: {
              name: 'generate_react_project',
              description: 'Generate a complete React project with file structure',
              parameters: {
                type: 'object',
                properties: {
                  files: {
                    type: 'array',
                    description: 'Array of project files',
                    items: {
                      type: 'object',
                      properties: {
                        path: {
                          type: 'string',
                          description: 'File path relative to project root'
                        },
                        content: {
                          type: 'string',
                          description: 'Complete file content'
                        }
                      },
                      required: ['path', 'content']
                    }
                  }
                },
                required: ['files']
              }
            }
          }
        ],
        tool_choice: {
          type: 'function',
          function: { name: 'generate_react_project' }
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        throw new Error('Limite de uso excedido. Aguarde um momento e tente novamente.');
      }
      if (response.status === 402) {
        throw new Error('Créditos esgotados. Adicione créditos em Settings → Workspace → Usage.');
      }
      
      throw new Error(`Lovable AI error: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('No response body from Lovable AI');
    }

    // Stream the response back to client
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const reader = response.body!.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          let toolCallBuffer = '';
          let inToolCall = false;

          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              // If we have accumulated tool call data, send it
              if (toolCallBuffer) {
                try {
                  const toolCallData = JSON.parse(toolCallBuffer);
                  const files = toolCallData.files;
                  if (files && Array.isArray(files)) {
                    // Send the complete structured data
                    const finalData = {
                      choices: [{
                        delta: {
                          content: JSON.stringify({ files })
                        }
                      }]
                    };
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(finalData)}\n\n`));
                  }
                } catch (e) {
                  console.error('Error parsing final tool call:', e);
                }
              }
              
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              controller.close();
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (!line.trim() || line.trim() === 'data: [DONE]') continue;
              
              if (line.startsWith('data: ')) {
                const jsonStr = line.slice(6);
                
                try {
                  const parsed = JSON.parse(jsonStr);
                  
                  // Check for tool calls
                  const toolCalls = parsed.choices?.[0]?.delta?.tool_calls;
                  if (toolCalls && toolCalls.length > 0) {
                    const args = toolCalls[0].function?.arguments;
                    if (args) {
                      toolCallBuffer += args;
                      inToolCall = true;
                    }
                  }
                  
                  // Pass through the streaming data
                  controller.enqueue(encoder.encode(`data: ${jsonStr}\n\n`));
                } catch (e) {
                  console.warn('Failed to parse SSE line:', line.substring(0, 100));
                }
              }
            }
          }

          console.log('✅ Streaming complete');
        } catch (error) {
          console.error('❌ Stream error:', error);
          const errorData = {
            error: error instanceof Error ? error.message : 'Stream processing error'
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorData)}\n\n`));
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
    console.error('❌ Edge function error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
