import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Eye, Code, Copy, Check, ExternalLink } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { FileTree, FileNode } from "./FileTree";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

interface CodePreviewProps {
  files: FileNode[];
  selectedFile?: {
    path: string;
    content: string;
  };
  onFileSelect: (path: string, content: string) => void;
  generatedCode?: string;
}

export const CodePreview = ({ files, selectedFile, onFileSelect, generatedCode }: CodePreviewProps) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("preview");

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getFileLanguage = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'tsx':
      case 'jsx':
        return 'jsx';
      case 'ts':
        return 'typescript';
      case 'js':
        return 'javascript';
      case 'css':
        return 'css';
      case 'html':
        return 'html';
      case 'json':
        return 'json';
      default:
        return 'text';
    }
  };

  const renderPreview = () => {
    if (!generatedCode && !selectedFile?.content) {
      return (
        <div className="h-full flex items-center justify-center text-center p-8">
          <div>
            <Eye className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Preview Area</h3>
            <p className="text-muted-foreground max-w-sm">
              Generate code with AI to see a live preview of your website here
            </p>
          </div>
        </div>
      );
    }

    // For now, show a mock preview since we can't safely execute arbitrary code
    return (
      <div className="h-full bg-white rounded-lg shadow-inner">
        <div className="h-full flex items-center justify-center text-center p-8">
          <div>
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-lg mx-auto mb-4 flex items-center justify-center">
              <ExternalLink className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-medium mb-2 text-gray-800">Live Preview</h3>
            <p className="text-gray-600 max-w-sm mb-4">
              Your generated website would appear here in a real implementation
            </p>
            <Button variant="outline" size="sm">
              Open in New Tab
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const codeToShow = selectedFile?.content || generatedCode || "";
  const filename = selectedFile?.path || "generated-code.tsx";

  useEffect(() => {
    if (generatedCode) {
      setActiveTab("code");
    }
  }, [generatedCode]);

  return (
    <div className="h-full flex">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Left side - File Tree */}
        <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
          <div className="h-full border-r border-border">
            <FileTree 
              files={files}
              selectedFile={selectedFile?.path}
              onFileSelect={onFileSelect}
            />
          </div>
        </ResizablePanel>
        
        <ResizableHandle />
        
        {/* Right side - Code Preview */}
        <ResizablePanel defaultSize={70} minSize={50}>
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium">Preview</h2>
                {codeToShow && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(codeToShow)}
                    className="gap-2"
                  >
                    {copied ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                )}
              </div>
            </div>

            <div className="flex-1">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
                <TabsList className="grid w-full grid-cols-2 m-4 mb-0">
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                  <TabsTrigger value="code">Code</TabsTrigger>
                </TabsList>
                
                <TabsContent value="preview" className="h-full mt-4 mx-4 mb-4">
                  <Card className="h-full">
                    {renderPreview()}
                  </Card>
                </TabsContent>
                
                <TabsContent value="code" className="h-full mt-4 mx-4 mb-4 overflow-hidden">
                  <Card className="h-full overflow-hidden">
                    {codeToShow ? (
                      <div className="h-full overflow-auto">
                        <SyntaxHighlighter
                          language={getFileLanguage(filename)}
                          style={oneDark}
                          customStyle={{
                            margin: 0,
                            padding: '1rem',
                            background: 'hsl(var(--muted))',
                            fontSize: '14px',
                            lineHeight: '1.5',
                          }}
                          showLineNumbers
                        >
                          {codeToShow}
                        </SyntaxHighlighter>
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-center p-8">
                        <div>
                          <Code className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                          <h3 className="text-lg font-medium mb-2">No Code Selected</h3>
                          <p className="text-muted-foreground">
                            Select a file from the tree or generate new code to view it here
                          </p>
                        </div>
                      </div>
                    )}
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};