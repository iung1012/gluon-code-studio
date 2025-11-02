import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, files, code } = await req.json();
    const E2B_API_KEY = Deno.env.get('E2B_API_KEY');
    
    if (!E2B_API_KEY) {
      throw new Error('E2B_API_KEY not configured');
    }

    console.log('🔧 E2B Action:', action);

    // Create sandbox
    if (action === 'create') {
      const response = await fetch('https://api.e2b.dev/sandboxes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${E2B_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template: 'base',
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('E2B create error:', error);
        throw new Error(`Failed to create sandbox: ${error}`);
      }

      const sandbox = await response.json();
      console.log('✅ Sandbox created:', sandbox.sandboxId);
      
      return new Response(
        JSON.stringify({ sandboxId: sandbox.sandboxId }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Write files to sandbox
    if (action === 'write-files') {
      const { sandboxId } = await req.json();
      
      for (const file of files) {
        const writeResponse = await fetch(
          `https://api.e2b.dev/sandboxes/${sandboxId}/filesystem/write`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${E2B_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              path: file.path,
              content: file.content,
            }),
          }
        );

        if (!writeResponse.ok) {
          const error = await writeResponse.text();
          console.error('E2B write error:', error);
          throw new Error(`Failed to write file ${file.path}: ${error}`);
        }
      }

      console.log('✅ Files written');
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Execute code
    if (action === 'execute') {
      const { sandboxId, command } = await req.json();
      
      const execResponse = await fetch(
        `https://api.e2b.dev/sandboxes/${sandboxId}/commands`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${E2B_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            command,
          }),
        }
      );

      if (!execResponse.ok) {
        const error = await execResponse.text();
        console.error('E2B execute error:', error);
        throw new Error(`Failed to execute command: ${error}`);
      }

      const result = await execResponse.json();
      console.log('✅ Command executed');
      
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get sandbox URL
    if (action === 'get-url') {
      const { sandboxId, port } = await req.json();
      
      const url = `https://${sandboxId}-${port}.e2b.dev`;
      
      return new Response(
        JSON.stringify({ url }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Delete sandbox
    if (action === 'delete') {
      const { sandboxId } = await req.json();
      
      await fetch(`https://api.e2b.dev/sandboxes/${sandboxId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${E2B_API_KEY}`,
        },
      });

      console.log('✅ Sandbox deleted');
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('E2B Sandbox Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});