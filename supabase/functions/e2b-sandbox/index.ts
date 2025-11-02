import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Sandbox } from "npm:e2b@^1.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Store active sandboxes
const sandboxes = new Map<string, any>();

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, sandboxId, files, command, port } = body;
    const E2B_API_KEY = Deno.env.get("E2B_API_KEY");

    if (!E2B_API_KEY) {
      console.error("❌ E2B_API_KEY environment variable is not set");
      throw new Error("E2B_API_KEY is not configured. Please add your E2B API key to the project secrets.");
    }

    console.log("🔧 E2B Action:", action, { sandboxId });

    // Create sandbox
    if (action === "create") {
      console.log("Creating E2B sandbox...");
      const sandbox = await Sandbox.create("base", {
        apiKey: E2B_API_KEY,
        timeout: 300000, // 5 minutes
      });

      sandboxes.set(sandbox.sandboxID, sandbox);

      console.log("✅ Sandbox created:", sandbox.sandboxID);

      return new Response(
        JSON.stringify({
          sandboxId: sandbox.sandboxID,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Get or reconnect to sandbox
    let sandbox = sandboxes.get(sandboxId);
    if (!sandbox && sandboxId) {
      sandbox = await Sandbox.create("base", {
        apiKey: E2B_API_KEY,
        sandboxID: sandboxId,
      });
      sandboxes.set(sandboxId, sandbox);
    }

    if (!sandbox) {
      throw new Error("Sandbox not found");
    }

    // Write files to sandbox
    if (action === "write-files") {
      console.log("Writing files to sandbox...");

      for (const file of files) {
        await sandbox.filesystem.write(file.path, file.content);
        console.log(`✅ Written: ${file.path}`);
      }

      console.log("✅ All files written");
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Execute command
    if (action === "execute") {
      console.log("Executing command:", command);

      const proc = await sandbox.process.startAndWait(command);

      console.log("✅ Command executed");

      return new Response(
        JSON.stringify({
          stdout: proc.stdout,
          stderr: proc.stderr,
          exitCode: proc.exitCode,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Get sandbox URL
    if (action === "get-url") {
      // Get the hostname for the port
      const hostname = await sandbox.getHostname(port || 5173);
      const url = `https://${hostname}`;

      return new Response(JSON.stringify({ url }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Delete sandbox
    if (action === "delete") {
      console.log("Deleting sandbox...");

      await sandbox.close();
      sandboxes.delete(sandboxId);

      console.log("✅ Sandbox deleted");
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid action");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("❌ E2B Sandbox Error:", errorMessage);
    console.error("Stack:", error instanceof Error ? error.stack : "No stack trace");

    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: "Check project secrets for E2B_API_KEY configuration",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
