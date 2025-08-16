import { useState, useEffect } from "react";
import { PromptInput } from "@/components/PromptInput";
import { FileTree, FileNode } from "@/components/FileTree";
import { CodePreview } from "@/components/CodePreview";
import { ApiKeyInput } from "@/components/ApiKeyInput";
import { GLMApiService } from "@/services/glmApi";
import { useToast } from "@/hooks/use-toast";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

const Index = () => {
  const [apiKey, setApiKey] = useState<string>("");
  const [glmService, setGlmService] = useState<GLMApiService | null>(null);
  const [files, setFiles] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<{path: string, content: string} | undefined>();
  const [generatedCode, setGeneratedCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Load API key from localStorage on mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem("glm-api-key");
    if (savedApiKey) {
      setApiKey(savedApiKey);
      setGlmService(new GLMApiService(savedApiKey));
    }
  }, []);

  const handleApiKeySubmit = (key: string) => {
    setApiKey(key);
    localStorage.setItem("glm-api-key", key);
    setGlmService(new GLMApiService(key));
    toast({
      title: "API Key Saved",
      description: "You can now start generating websites!",
    });
  };

  const parseProjectStructure = (content: string): FileNode[] => {
    console.log('🔍 Raw API Response:', content.substring(0, 500) + '...');
    
    try {
      // Remove any markdown code blocks and clean content
      let cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      // Try to extract JSON from the response
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanContent = jsonMatch[0];
      }
      
      console.log('🧹 Cleaned JSON:', cleanContent.substring(0, 500) + '...');
      
      // Try to fix common JSON issues
      cleanContent = cleanContent
        .replace(/\\n/g, '\\\\n')  // Fix newlines
        .replace(/\\"/g, '\\\\"')  // Fix quotes
        .replace(/\\'/g, "\\\\'")  // Fix single quotes
        .replace(/\\\\/g, '\\\\\\\\'); // Fix backslashes
      
      const parsed = JSON.parse(cleanContent);
      console.log('✅ Successfully parsed JSON:', parsed);
      
      return parsed.files || [];
    } catch (error) {
      console.error('❌ Error parsing project structure:', error);
      console.log('🔍 Failed content sample:', content.substring(0, 1000));
      
      // Fallback: try to extract HTML directly from response
      try {
        console.log('🔄 Attempting HTML extraction...');
        
        // Look for HTML content in the JSON response
        let htmlContent = '';
        
        // Try to extract content value from the malformed JSON
        const contentMatch = content.match(/"content":\s*"([^"]*(?:\\.[^"]*)*)"/);
        if (contentMatch) {
          htmlContent = contentMatch[1];
          console.log('📝 Found content field:', htmlContent.substring(0, 200) + '...');
          
          // Properly unescape the HTML
          htmlContent = htmlContent
            .replace(/\\n/g, '\n')           // Convert \\n to actual newlines
            .replace(/\\"/g, '"')            // Convert \\" to quotes  
            .replace(/\\'/g, "'")            // Convert \\' to single quotes
            .replace(/\\\\/g, '\\')          // Convert \\\\ to single backslash
            .replace(/\\t/g, '\t')           // Convert \\t to tabs
            .replace(/\\r/g, '\r');          // Convert \\r to carriage returns
          
          console.log('🎯 Unescaped HTML preview:', htmlContent.substring(0, 300) + '...');
        } else {
          // Try direct HTML extraction
          const htmlMatch = content.match(/<!DOCTYPE html>[\s\S]*<\/html>/i);
          if (htmlMatch) {
            htmlContent = htmlMatch[0];
            console.log('🔍 Direct HTML extraction successful');
          }
        }
        
        if (htmlContent && htmlContent.includes('<!DOCTYPE html>')) {
          console.log('✅ HTML content found and processed');
          return [
            {
              name: "index.html",
              type: "file" as const,
              path: "index.html",
              content: htmlContent
            }
          ];
        }
      } catch (htmlError) {
        console.error('❌ HTML extraction failed:', htmlError);
      }
      
      // Final fallback: create basic monolithic HTML structure
      console.log('🆘 Using fallback structure');
      return [
        {
          name: "index.html",
          type: "file" as const,
          path: "index.html",
          content: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Website Monolítico</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .container {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 3rem;
            text-align: center;
            color: white;
            max-width: 500px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }

        h1 {
            font-size: 2.5rem;
            margin-bottom: 1rem;
        }

        p {
            font-size: 1.1rem;
            margin-bottom: 2rem;
            opacity: 0.9;
        }

        button {
            background: linear-gradient(135deg, #ff6b6b, #ee5a52);
            color: white;
            padding: 15px 30px;
            border: none;
            border-radius: 50px;
            cursor: pointer;
            font-size: 1.1rem;
            font-weight: 600;
            transition: transform 0.3s ease;
        }

        button:hover {
            transform: translateY(-2px);
        }

        .error-info {
            background: rgba(255,255,255,0.1);
            border-radius: 10px;
            padding: 1rem;
            margin-top: 2rem;
            font-size: 0.9rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>⚠️ Erro de Geração</h1>
        <p>Ocorreu um erro ao processar a resposta da IA</p>
        <button onclick="showDetails()">Ver Detalhes</button>
        <div id="details" class="error-info" style="display: none;">
            <p>Erro no parsing JSON da API. Tente gerar novamente ou use um prompt mais simples.</p>
        </div>
    </div>

    <script>
        function showDetails() {
            const details = document.getElementById('details');
            details.style.display = details.style.display === 'none' ? 'block' : 'none';
        }

        console.log('Erro: Falha no parsing da resposta da IA');
    </script>
</body>
</html>`
        }
      ];
    }
  };

  const handlePromptSubmit = async (prompt: string) => {
    if (!glmService) return;

    setIsLoading(true);
    try {
      let response: string;
      
      // Se já existem arquivos, usa edição específica
      if (files.length > 0 && files[0].content) {
        const currentFile = files.find(f => f.name === 'index.html');
        if (currentFile?.content) {
          console.log('🎯 Fazendo edição específica...');
          response = await glmService.editSpecificPart(currentFile.content, prompt);
        } else {
          console.log('🆕 Gerando novo projeto...');
          response = await glmService.generateProjectStructure(prompt);
        }
      } else {
        console.log('🆕 Gerando novo projeto...');
        response = await glmService.generateProjectStructure(prompt);
      }
      
      const parsedFiles = parseProjectStructure(response);
      
      setFiles(parsedFiles);
      setGeneratedCode(response);
      
      // Auto-select the first file
      const firstFile = findFirstFile(parsedFiles);
      if (firstFile) {
        setSelectedFile({ path: firstFile.path, content: firstFile.content || "" });
      }

      const isEdit = files.length > 0;
      toast({
        title: isEdit ? "Alteração Aplicada!" : "Website Gerado!",
        description: isEdit ? "Sua alteração específica foi aplicada com sucesso." : "Sua estrutura de website foi criada com sucesso.",
      });
    } catch (error) {
      console.error('Error generating code:', error);
      toast({
        title: "Falha na Geração",
        description: error instanceof Error ? error.message : "Falha ao gerar website. Tente novamente.",
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

  const handleNewProject = () => {
    setFiles([]);
    setSelectedFile(undefined);
    setGeneratedCode("");
    toast({
      title: "Novo Projeto",
      description: "Projeto limpo criado. Agora você pode gerar um novo website.",
    });
  };

  const handleFileSelect = (path: string, content: string) => {
    setSelectedFile({ path, content });
  };

  if (!apiKey || !glmService) {
    return <ApiKeyInput onApiKeySubmit={handleApiKeySubmit} />;
  }

  return (
    <div className="h-screen bg-background">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Left Panel - Prompt Input */}
        <ResizablePanel defaultSize={30} minSize={25} maxSize={45}>
          <div className="h-full border-r border-border">
            <PromptInput 
              onSubmit={handlePromptSubmit} 
              isLoading={isLoading}
              hasExistingFiles={files.length > 0}
              onNewProject={handleNewProject}
            />
          </div>
        </ResizablePanel>
        
        <ResizableHandle />
        
        {/* Right Panel - Preview with File Tree */}
        <ResizablePanel defaultSize={70} minSize={55}>
          <CodePreview 
            files={files}
            selectedFile={selectedFile}
            onFileSelect={handleFileSelect}
            generatedCode={!selectedFile ? generatedCode : undefined}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default Index;
