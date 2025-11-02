import { useEffect, useRef, useState } from "react";
import type { FileNode } from "./FileTree";
import { Card } from "./ui/card";
import { AlertCircle, Loader2, Terminal as TerminalIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface E2BPreviewProps {
  files: FileNode[];
  isGenerating?: boolean;
  generationProgress?: number;
}

export const E2BPreview = ({ files, isGenerating = false, generationProgress = 0 }: E2BPreviewProps) => {
  const [sandboxId, setSandboxId] = useState<string | null>(null);
  const [url, setUrl] = useState<string>("");
  const [isBooting, setIsBooting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Helper to add terminal output
  const addOutput = (message: string) => {
    setTerminalOutput((prev) => [...prev, message]);
    setTimeout(() => {
      if (terminalRef.current) {
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
      }
    }, 0);
  };

  // Create E2B Sandbox
  useEffect(() => {
    let isMounted = true;

    const createSandbox = async () => {
      try {
        console.log("🚀 Creating E2B Sandbox...");
        addOutput("🚀 Creating secure sandbox...");

        const { data, error } = await supabase.functions.invoke("e2b-sandbox", {
          body: { action: "create" },
        });

        if (error) throw error;
        if (!data?.sandboxId) throw new Error("No sandbox ID returned");

        if (!isMounted) return;

        setSandboxId(data.sandboxId);
        setIsBooting(false);
        addOutput(`✅ Sandbox created: ${data.sandboxId}`);
        console.log("✅ E2B Sandbox created:", data.sandboxId);
      } catch (err) {
        console.error("❌ Failed to create E2B sandbox:", err);
        const errorMsg = err instanceof Error ? err.message : "Failed to create sandbox";

        // Check if it's an API key configuration error
        if (errorMsg.includes("E2B_API_KEY") || errorMsg.includes("not configured")) {
          setError("E2B API Key is not configured. Please add your E2B API key to the project settings.");
          addOutput("❌ Configuration Error: E2B_API_KEY is missing from project secrets");
        } else {
          setError(errorMsg);
          addOutput(`❌ Error: ${errorMsg}`);
        }
        setIsBooting(false);
      }
    };

    createSandbox();

    return () => {
      isMounted = false;
      // Cleanup sandbox on unmount
      if (sandboxId) {
        supabase.functions.invoke("e2b-sandbox", {
          body: { action: "delete", sandboxId },
        });
      }
    };
  }, []);

  // Setup project in E2B
  useEffect(() => {
    if (!sandboxId || files.length === 0 || isBooting) return;

    const setupProject = async () => {
      try {
        setError(null);
        addOutput("📦 Preparando arquivos do projeto...");

        // Convert FileNode array to flat file list
        const flatFiles: Array<{ path: string; content: string }> = [];

        const processNode = (node: FileNode, basePath: string = "") => {
          const path = basePath ? `${basePath}/${node.name}` : node.name;

          if (node.type === "file" && node.content) {
            flatFiles.push({ path: `/${path}`, content: node.content });
          } else if (node.type === "folder" && node.children) {
            node.children.forEach((child) => processNode(child, path));
          }
        };

        files.forEach((node) => processNode(node));

        console.log("📁 Escrevendo arquivos no sandbox...", flatFiles.length);
        addOutput(`📁 Escrevendo ${flatFiles.length} arquivos...`);

        // Write files to sandbox
        const { error: writeError } = await supabase.functions.invoke("e2b-sandbox", {
          body: {
            action: "write-files",
            sandboxId,
            files: flatFiles,
          },
        });

        if (writeError) throw writeError;

        addOutput("✅ Arquivos escritos com sucesso");
        addOutput("📦 Instalando dependências (npm install)...");

        // Install dependencies with npm
        const { data: installData, error: installError } = await supabase.functions.invoke("e2b-sandbox", {
          body: {
            action: "execute",
            sandboxId,
            command: "cd / && npm install",
          },
        });

        if (installError) throw installError;

        if (installData?.stdout) addOutput(installData.stdout);
        if (installData?.stderr) addOutput(installData.stderr);

        addOutput("✅ Dependências instaladas");
        addOutput("🚀 Iniciando servidor de desenvolvimento...");

        // Start dev server (non-blocking)
        supabase.functions
          .invoke("e2b-sandbox", {
            body: {
              action: "execute",
              sandboxId,
              command: "cd / && npm run dev -- --host 0.0.0.0",
            },
          })
          .then(({ data: devData }) => {
            if (devData?.stdout) addOutput(devData.stdout);
            if (devData?.stderr) addOutput(devData.stderr);
          });

        // Wait a bit for server to start and get URL
        setTimeout(async () => {
          const { data: urlData, error: urlError } = await supabase.functions.invoke("e2b-sandbox", {
            body: {
              action: "get-url",
              sandboxId,
              port: 5173, // Default Vite port
            },
          });

          if (!urlError && urlData?.url) {
            console.log("✅ Servidor pronto em:", urlData.url);
            setUrl(urlData.url);
            addOutput(`✅ Servidor rodando em ${urlData.url}`);
          }
        }, 5000); // Aguarda 5s para o servidor iniciar
      } catch (err) {
        console.error("❌ Erro ao configurar projeto:", err);
        setError(err instanceof Error ? err.message : "Failed to setup project");
        addOutput(`❌ Erro: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    };

    setupProject();
  }, [sandboxId, files, isBooting]);

  if (isGenerating) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Gerando código... {generationProgress}%</p>
        </div>
      </div>
    );
  }

  if (error) {
    const isApiKeyError = error.includes("E2B_API_KEY") || error.includes("not configured");

    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <Card className="p-8 max-w-md">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-8 h-8 text-destructive flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-lg mb-2">E2B Sandbox Error</h3>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              {isApiKeyError ? (
                <div className="text-xs text-muted-foreground space-y-2">
                  <p className="font-medium">To fix this:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>
                      Go to{" "}
                      <a
                        href="https://e2b.dev/console"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        e2b.dev/console
                      </a>
                    </li>
                    <li>Copy your API key</li>
                    <li>Add it to your project secrets as E2B_API_KEY</li>
                  </ol>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Check the terminal output for more details.</p>
              )}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (isBooting) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Iniciando sandbox seguro E2B...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="preview" className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b">
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="terminal">
            <TerminalIcon className="w-4 h-4 mr-2" />
            Terminal
          </TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="flex-1 m-0">
          {url ? (
            <iframe ref={iframeRef} src={url} className="w-full h-full border-0" title="E2B Sandbox Preview" />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Aguardando servidor...</p>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="terminal" className="flex-1 m-0 bg-black/95">
          <ScrollArea className="h-full">
            <div
              ref={terminalRef}
              className={cn("p-4 font-mono text-xs text-green-400", "whitespace-pre-wrap break-all")}
            >
              {terminalOutput.map((line, i) => (
                <div key={i} className="mb-1">
                  {line}
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};
