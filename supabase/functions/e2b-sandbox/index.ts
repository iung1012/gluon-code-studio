import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Sandbox } from "npm:e2b@^1.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Store active sandboxes
const sandboxes = new Map<string, any>();

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, sandboxId, files, command, port } = body;
    const E2B_API_KEY = Deno.env.get('E2B_API_KEY');
    
    if (!E2B_API_KEY) {
      throw new Error('E2B_API_KEY not configured');
    }

    console.log('🔧 E2B Action:', action, { sandboxId });

    // Create sandbox
    if (action === 'create') {
      console.log('Creating E2B sandbox...');
      const sandbox = await Sandbox.create('base', { 
        apiKey: E2B_API_KEY,
        timeout: 300000 // 5 minutes
      });
      
      const sandboxId = sandbox.id || sandbox.sandboxID || sandbox.sandboxId;
      sandboxes.set(sandboxId, sandbox);
      
      console.log('✅ Sandbox created:', sandboxId);
      console.log('Sandbox object keys:', Object.keys(sandbox));
      
      return new Response(
        JSON.stringify({ 
          sandboxId: sandboxId
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get or reconnect to sandbox
    let sandbox = sandboxes.get(sandboxId);
    if (!sandbox && sandboxId) {
      console.log('Reconnecting to sandbox:', sandboxId);
      sandbox = await Sandbox.connect(sandboxId, { 
        apiKey: E2B_API_KEY
      });
      sandboxes.set(sandboxId, sandbox);
    }

    if (!sandbox) {
      throw new Error('Sandbox not found');
    }

    if (action === 'write-files') {
      console.log('Writing files to sandbox...');
      
      // Normalize files input
      const fileList = (files || []).map((f: any) => ({
        path: f.path,
        content: f.content ?? f.data ?? ''
      }));

      try {
        // Preferred modern API
        if ((sandbox as any).files?.write) {
          const payload = fileList.map((f: any) => ({ path: f.path, data: f.content }));
          await (sandbox as any).files.write(payload);
          for (const f of fileList) console.log(`✅ Written: ${f.path}`);
        }
        // Legacy API fallback
        else if ((sandbox as any).filesystem?.write) {
          for (const f of fileList) {
            await (sandbox as any).filesystem.write(f.path, f.content);
            console.log(`✅ Written: ${f.path}`);
          }
        }
        // Shell fallback
        else {
          for (const f of fileList) {
            const safePath = f.path.replace(/'/g, "'\\''");
            const script = `mkdir -p $(dirname '${safePath}') && cat > '${safePath}' << 'EOF'\n${f.content}\nEOF`;
            const proc = await (sandbox as any).process.startAndWait(`bash -lc \"${script.replace(/\"/g, '\\\\\"')}\"`);
            if (proc.exitCode !== 0) {
              console.log('❌ Write failed', proc.stderr);
              throw new Error(`Failed to write ${f.path}`);
            }
            console.log(`✅ Written: ${f.path}`);
          }
        }
        
        console.log('✅ All files written');
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (e) {
        console.error('E2B write error:', e);
        return new Response(
          JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Execute command
    if (action === 'execute') {
      console.log('Executing command:', command);
      
      const proc = await sandbox.process.startAndWait(command);
      
      console.log('✅ Command executed');
      
      return new Response(
        JSON.stringify({
          stdout: proc.stdout,
          stderr: proc.stderr,
          exitCode: proc.exitCode
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get sandbox URL
    if (action === 'get-url') {
      // Get the hostname for the port
      const hostname = await sandbox.getHostname(port || 5173);
      const url = `https://${hostname}`;
      
      return new Response(
        JSON.stringify({ url }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Delete sandbox
    if (action === 'delete') {
      console.log('Deleting sandbox...');
      
      await sandbox.close();
      sandboxes.delete(sandboxId);
      
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