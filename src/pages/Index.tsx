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
    try {
      // Remove any markdown code blocks and clean content
      let cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      // Try to extract JSON from the response
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanContent = jsonMatch[0];
      }
      
      const parsed = JSON.parse(cleanContent);
      return parsed.files || [];
    } catch (error) {
      console.error('Error parsing project structure:', error);
      
      // Fallback: create basic monolithic JS structure
      return [
        {
          name: "app.js",
          type: "file" as const,
          path: "app.js",
          content: `// JavaScript Monolítico - Single File App

// === CONFIGURAÇÃO ===
const APP = {
  state: {
    currentView: 'home',
    data: {}
  },
  router: {},
  components: {},
  utils: {}
};

// === ESTILOS ===
const styles = \`
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
\`;

// === COMPONENTES ===
APP.components.main = () => \`
  <div class="container">
    <h1>Website Monolítico</h1>
    <p>Aplicação JavaScript completa gerada com IA</p>
    <button onclick="APP.utils.showMessage()">Clique Aqui</button>
  </div>
\`;

// === UTILITÁRIOS ===
APP.utils.showMessage = () => {
  alert('Aplicação JavaScript monolítica funcionando perfeitamente!');
};

// === RENDERIZAÇÃO ===
APP.render = () => {
  document.body.innerHTML = APP.components.main();
};

// === INICIALIZAÇÃO ===
document.addEventListener('DOMContentLoaded', () => {
  // Inject styles
  const styleEl = document.createElement('style');
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);
  
  // Initialize app
  APP.render();
  
  console.log('Website JavaScript monolítico carregado com sucesso!');
});`
        }
      ];
    }
  };

  const handlePromptSubmit = async (prompt: string) => {
    if (!glmService) return;

    setIsLoading(true);
    try {
      const response = await glmService.generateProjectStructure(prompt);
      const parsedFiles = parseProjectStructure(response);
      
      setFiles(parsedFiles);
      setGeneratedCode(response);
      
      // Auto-select the first file
      const firstFile = findFirstFile(parsedFiles);
      if (firstFile) {
        setSelectedFile({ path: firstFile.path, content: firstFile.content || "" });
      }

      toast({
        title: "Website Generated!",
        description: "Your website structure has been created successfully.",
      });
    } catch (error) {
      console.error('Error generating code:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate website. Please try again.",
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

  if (!apiKey || !glmService) {
    return <ApiKeyInput onApiKeySubmit={handleApiKeySubmit} />;
  }

  return (
    <div className="h-screen bg-background">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Left Panel - Prompt Input */}
        <ResizablePanel defaultSize={30} minSize={25} maxSize={45}>
          <div className="h-full border-r border-border">
            <PromptInput onSubmit={handlePromptSubmit} isLoading={isLoading} />
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
