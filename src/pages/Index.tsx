import { useState, useEffect } from "react";
import { PromptInput } from "@/components/PromptInput";
import { FileTree, FileNode } from "@/components/FileTree";
import { CodePreview } from "@/components/CodePreview";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { SidebarMenu } from "@/components/SidebarMenu";
import { ApiKeyInput } from "@/components/ApiKeyInput";
import { GLMApiService } from "@/services/glmApi";
import { AdvancedCodeGenerator, ProjectFile } from "@/services/advancedCodeGenerator";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

const Index = () => {
  const [apiKey, setApiKey] = useState<string>("");
  const [glmService, setGlmService] = useState<GLMApiService | null>(null);
  const [advancedGenerator, setAdvancedGenerator] = useState<AdvancedCodeGenerator | null>(null);
  const [files, setFiles] = useState<FileNode[]>([]);
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<{path: string, content: string} | undefined>();
  const [generatedCode, setGeneratedCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const { toast } = useToast();

  // Load API key from localStorage on mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem("glm-api-key");
    if (savedApiKey) {
      setApiKey(savedApiKey);
      setGlmService(new GLMApiService(savedApiKey));
      setAdvancedGenerator(new AdvancedCodeGenerator(savedApiKey));
    }
  }, []);

  const handleApiKeySubmit = (key: string) => {
    setApiKey(key);
    localStorage.setItem("glm-api-key", key);
    setGlmService(new GLMApiService(key));
    setAdvancedGenerator(new AdvancedCodeGenerator(key));
    toast({
      title: "API Key Saved",
      description: "You can now start generating websites!",
    });
  };

  const parseProjectStructure = (content: string): { files: FileNode[], projectFiles: ProjectFile[] } => {
    console.log('🔍 Raw AI Response:', content.substring(0, 200) + '...');
    
    try {
      let cleanContent = content.trim();
      
      // Remove markdown code blocks and extra text
      cleanContent = cleanContent.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
      cleanContent = cleanContent.replace(/^[^{]*/, '').replace(/[^}]*$/, '');
      
      // Extract JSON object more aggressively
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanContent = jsonMatch[0];
      }
      
      // Advanced JSON sanitization
      cleanContent = cleanContent
        .replace(/\\\\"/g, '\\"')           // Fix double-escaped quotes
        .replace(/\\n/g, '\\n')             // Ensure newlines are properly escaped
        .replace(/\\t/g, '\\t')             // Ensure tabs are properly escaped
        .replace(/\\r/g, '\\r')             // Ensure carriage returns are properly escaped
        .replace(/,(\s*[}\]])/g, '$1')      // Remove trailing commas
        .replace(/([^\\])"/g, '$1\\"')       // Escape unescaped quotes in strings
        .replace(/^"/g, '\\"');             // Fix quotes at start of string
      
      console.log('🧹 Cleaned JSON:', cleanContent.substring(0, 300) + '...');
      
      const parsed = JSON.parse(cleanContent);
      
      if (parsed.files && Array.isArray(parsed.files)) {
        const projectFiles = parsed.files;
        
        // Convert ProjectFile[] to FileNode[] for backward compatibility
        const convertToFileNodes = (pFiles: ProjectFile[]): FileNode[] => {
          return pFiles.map(pFile => ({
            name: pFile.name,
            type: pFile.type,
            path: pFile.path,
            content: pFile.content || '',
            children: pFile.children ? convertToFileNodes(pFile.children) : undefined
          }));
        };

        console.log('✅ Successfully parsed', projectFiles.length, 'files');
        return {
          files: convertToFileNodes(projectFiles),
          projectFiles: projectFiles
        };
      }
      
      throw new Error('Invalid structure: missing files array');
      
    } catch (error) {
      console.error('❌ JSON Parse Error:', error);
      console.log('🔧 Creating fallback content from raw response');
      
      // Intelligent fallback: create proper web files from raw content
      const fallbackFiles: ProjectFile[] = [];
      
      // Try to extract HTML content
      let htmlContent = '';
      const htmlMatch = content.match(/<!DOCTYPE html>[\s\S]*?<\/html>/i) || 
                       content.match(/<html[\s\S]*?<\/html>/i) ||
                       content.match(/<body[\s\S]*?<\/body>/i);
      
      if (htmlMatch) {
        htmlContent = htmlMatch[0];
        
        // Ensure it's a complete HTML document
        if (!htmlContent.includes('<!DOCTYPE html>')) {
          htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Site Gerado</title>
</head>
${htmlContent.includes('<body') ? htmlContent : `<body>${htmlContent}</body>`}
</html>`;
        }
      } else {
        // Create a basic HTML structure if no HTML found
        htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Site Gerado</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            text-align: center;
            background: rgba(255,255,255,0.1);
            padding: 40px;
            border-radius: 20px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
        }
        h1 {
            font-size: 2.5em;
            margin-bottom: 20px;
            text-shadow: 0 2px 10px rgba(0,0,0,0.3);
        }
        p {
            font-size: 1.2em;
            opacity: 0.9;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Site Gerado com Sucesso!</h1>
        <p>A IA encontrou algumas dificuldades para gerar o código, mas criou uma estrutura básica funcional.</p>
        <p>Tente descrever seu site de forma mais específica para melhores resultados.</p>
    </div>
</body>
</html>`;
      }
      
      fallbackFiles.push({
        name: "index.html",
        type: "file",
        path: "./index.html",
        content: htmlContent
      });

      // Try to extract CSS
      const cssMatch = content.match(/(?:style>|\.css["\s]*:|:root\s*{)[\s\S]*?(?:<\/style>|}\s*$)/gi);
      if (cssMatch) {
        const cssContent = cssMatch.join('\n\n').replace(/<\/?style[^>]*>/gi, '');
        fallbackFiles.push({
          name: "styles.css",
          type: "file",
          path: "./css/styles.css",
          content: cssContent
        });
      }

      // Try to extract JavaScript
      const jsMatch = content.match(/(?:script>|function\s+|class\s+|const\s+|let\s+|var\s+)[\s\S]*?(?:<\/script>|}\s*$)/gi);
      if (jsMatch) {
        const jsContent = jsMatch.join('\n\n').replace(/<\/?script[^>]*>/gi, '');
        fallbackFiles.push({
          name: "script.js",
          type: "file",
          path: "./js/script.js",
          content: jsContent
        });
      }

      console.log('🔧 Created', fallbackFiles.length, 'fallback files');
      
      return {
        files: fallbackFiles,
        projectFiles: fallbackFiles
      };
    }
  };

  const handlePromptSubmit = async (prompt: string) => {
    if (!advancedGenerator) return;

    setIsLoading(true);
    setShowWelcome(false);
    
    try {
      const response = await advancedGenerator.generateAdvancedProject(prompt);
      const { files, projectFiles } = parseProjectStructure(response);
      
      setFiles(files);
      setProjectFiles(projectFiles);
      setGeneratedCode(response);
      
      // Auto-select the first file
      const firstFile = findFirstFile(files);
      if (firstFile) {
        setSelectedFile({ path: firstFile.path, content: firstFile.content || "" });
      }

      toast({
        title: "Site Gerado com Sucesso!",
        description: "Seu projeto completo foi criado com HTML, CSS, JS e Node.js.",
      });
    } catch (error) {
      console.error('Error generating code:', error);
      toast({
        title: "Erro na Geração",
        description: error instanceof Error ? error.message : "Falha ao gerar o site. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const findFirstFile = (nodes: FileNode[]): FileNode | null => {
    for (const node of nodes) {
      if (node.type === 'file' && node.content) {
        return node;
      }
      if (node.type === 'folder' && node.children) {
        const found = findFirstFile(node.children);
        if (found) return found;
      }
    }
    return null;
  };

  const handleFileSelect = (path: string, content: string) => {
    setSelectedFile({ path, content });
  };

  const handleNewChat = () => {
    setShowWelcome(true);
    setFiles([]);
    setProjectFiles([]);
    setSelectedFile(undefined);
    setGeneratedCode("");
  };

  if (!apiKey || !glmService) {
    return <ApiKeyInput onApiKeySubmit={handleApiKeySubmit} />;
  }

  if (showWelcome) {
    return (
      <>
        <SidebarMenu 
          onNewChat={handleNewChat}
        />
        <WelcomeScreen 
          onSubmit={handlePromptSubmit}
          isLoading={isLoading}
        />
      </>
    );
  }

  return (
    <div className="h-screen bg-background relative">
      <SidebarMenu 
        onNewChat={handleNewChat}
      />
      
      <div className="h-full">
        <Tabs defaultValue="chat" className="h-full">
          <div className="border-b border-border px-4">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="code">Código</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="chat" className="h-full mt-0">
            <ResizablePanelGroup direction="horizontal" className="h-full">
              <ResizablePanel defaultSize={30} minSize={25} maxSize={45}>
                <div className="h-full border-r border-border">
                  <PromptInput onSubmit={handlePromptSubmit} isLoading={isLoading} />
                </div>
              </ResizablePanel>
              <ResizableHandle />
              <ResizablePanel defaultSize={70} minSize={55}>
                <CodePreview 
                  files={files}
                  selectedFile={selectedFile}
                  onFileSelect={handleFileSelect}
                  generatedCode={!selectedFile ? generatedCode : undefined}
                  projectFiles={projectFiles}
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          </TabsContent>
          
          <TabsContent value="code" className="h-full mt-0">
            <CodePreview 
              files={files}
              selectedFile={selectedFile}
              onFileSelect={handleFileSelect}
              generatedCode={!selectedFile ? generatedCode : undefined}
              projectFiles={projectFiles}
              defaultTab="code"
            />
          </TabsContent>
          
          <TabsContent value="preview" className="h-full mt-0">
            <CodePreview 
              files={files}
              selectedFile={selectedFile}
              onFileSelect={handleFileSelect}
              generatedCode={!selectedFile ? generatedCode : undefined}
              projectFiles={projectFiles}
              defaultTab="preview"
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
