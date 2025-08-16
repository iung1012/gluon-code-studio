import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { 
  Save, 
  Copy, 
  Check, 
  Download, 
  Maximize2, 
  Minimize2,
  RefreshCw,
  FileText,
  Code2,
  Palette 
} from "lucide-react";
import { ProjectFile } from "@/services/advancedCodeGenerator";
import { DownloadManager } from "@/utils/downloadManager";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface MonacoCodeEditorProps {
  files: ProjectFile[];
  selectedFile?: ProjectFile;
  onFileSelect?: (file: ProjectFile) => void;
  onFileChange?: (path: string, content: string) => void;
  readOnly?: boolean;
  theme?: 'vs-dark' | 'vs-light' | 'hc-black';
  className?: string;
}

export const MonacoCodeEditor = ({ 
  files, 
  selectedFile, 
  onFileSelect, 
  onFileChange,
  readOnly = false,
  theme = 'vs-dark',
  className 
}: MonacoCodeEditorProps) => {
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(theme);
  const editorRef = useRef<any>(null);
  const { toast } = useToast();

  const getLanguage = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'tsx':
      case 'jsx':
        return 'typescript';
      case 'ts':
        return 'typescript';
      case 'js':
        return 'javascript';
      case 'css':
        return 'css';
      case 'scss':
      case 'sass':
        return 'scss';
      case 'html':
        return 'html';
      case 'json':
        return 'json';
      case 'md':
        return 'markdown';
      case 'xml':
        return 'xml';
      case 'sql':
        return 'sql';
      case 'py':
        return 'python';
      default:
        return 'plaintext';
    }
  };

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    
    // Configure editor options
    editor.updateOptions({
      fontSize: 14,
      fontFamily: 'Fira Code, Monaco, Consolas, monospace',
      fontLigatures: true,
      lineHeight: 1.6,
      minimap: { enabled: true, scale: 0.8 },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      automaticLayout: true,
      contextmenu: true,
      quickSuggestions: true,
      suggestOnTriggerCharacters: true,
      acceptSuggestionOnEnter: 'on',
      tabCompletion: 'on',
      parameterHints: { enabled: true },
      autoIndent: 'full',
      formatOnPaste: true,
      formatOnType: true
    });

    // Add custom keybindings
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyD, () => {
      handleDownload();
    });
  };

  const handleEditorChange = (value: string | undefined) => {
    if (selectedFile && onFileChange && value !== undefined) {
      onFileChange(selectedFile.path, value);
    }
  };

  const handleCopy = async () => {
    if (!selectedFile?.content) return;
    
    try {
      await DownloadManager.copyToClipboard(selectedFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Código copiado!",
        description: "O conteúdo foi copiado para a área de transferência.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o código.",
        variant: "destructive"
      });
    }
  };

  const handleSave = () => {
    if (!selectedFile) return;
    
    toast({
      title: "Arquivo salvo!",
      description: `${selectedFile.name} foi salvo com sucesso.`,
    });
  };

  const handleDownload = async () => {
    if (!selectedFile) return;
    
    try {
      const mimeType = getLanguage(selectedFile.name) === 'json' 
        ? 'application/json' 
        : 'text/plain';
      
      DownloadManager.downloadSingleFile(
        selectedFile.content || '', 
        selectedFile.name, 
        mimeType
      );
      
      toast({
        title: "Download iniciado!",
        description: `${selectedFile.name} está sendo baixado.`,
      });
    } catch (error) {
      toast({
        title: "Erro no download",
        description: "Não foi possível baixar o arquivo.",
        variant: "destructive"
      });
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const formatCode = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument').run();
      toast({
        title: "Código formatado!",
        description: "O código foi formatado automaticamente.",
      });
    }
  };

  const cycleTheme = () => {
    const themes = ['vs-dark', 'vs-light', 'hc-black'];
    const currentIndex = themes.indexOf(currentTheme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setCurrentTheme(nextTheme as any);
  };

  if (files.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-full p-8">
          <div className="text-center">
            <Code2 className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum arquivo disponível</h3>
            <p className="text-muted-foreground">
              Gere um projeto primeiro para ver o editor de código
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn(
      "flex flex-col bg-background border border-border rounded-lg overflow-hidden",
      isFullscreen && "fixed inset-0 z-50",
      className
    )}>
      {/* Header */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <h3 className="font-medium">Editor de Código</h3>
            </div>
            {selectedFile && (
              <Badge variant="secondary" className="font-mono text-xs">
                {selectedFile.name}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={cycleTheme} title="Alternar tema">
              <Palette className="w-4 h-4" />
            </Button>
            
            <Button variant="ghost" size="sm" onClick={formatCode} title="Formatar código (Ctrl+Shift+F)">
              <RefreshCw className="w-4 h-4" />
            </Button>
            
            <Button variant="ghost" size="sm" onClick={handleCopy} title="Copiar código (Ctrl+C)">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
            
            <Button variant="ghost" size="sm" onClick={handleSave} title="Salvar (Ctrl+S)">
              <Save className="w-4 h-4" />
            </Button>
            
            <Button variant="ghost" size="sm" onClick={handleDownload} title="Download arquivo (Ctrl+D)">
              <Download className="w-4 h-4" />
            </Button>
            
            <Button variant="ghost" size="sm" onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* File Tabs */}
      {files.length > 1 && (
        <div className="px-4 pb-3">
          <Tabs value={selectedFile?.path || files[0]?.path} className="w-full">
            <TabsList className="grid grid-cols-auto gap-1 w-full h-auto p-1">
              {files.slice(0, 8).map((file) => (
                <TabsTrigger
                  key={file.path}
                  value={file.path}
                  onClick={() => onFileSelect?.(file)}
                  className="text-xs px-3 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  {file.name}
                </TabsTrigger>
              ))}
              {files.length > 8 && (
                <Badge variant="secondary" className="text-xs">
                  +{files.length - 8}
                </Badge>
              )}
            </TabsList>
          </Tabs>
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 min-h-0">
        {selectedFile ? (
          <Editor
            height="100%"
            language={getLanguage(selectedFile.name)}
            theme={currentTheme}
            value={selectedFile.content || ''}
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            options={{
              readOnly,
              scrollBeyondLastLine: false,
              minimap: { enabled: isFullscreen },
              wordWrap: 'on',
              automaticLayout: true,
              contextmenu: true,
              quickSuggestions: !readOnly,
              suggestOnTriggerCharacters: !readOnly,
              acceptSuggestionOnEnter: readOnly ? 'off' : 'on',
              tabCompletion: readOnly ? 'off' : 'on',
              parameterHints: { enabled: !readOnly }
            }}
            loading={
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Carregando editor...</p>
                </div>
              </div>
            }
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <h4 className="font-medium mb-2">Selecione um arquivo</h4>
              <p className="text-sm text-muted-foreground">
                Escolha um arquivo das abas acima para começar a editar
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};