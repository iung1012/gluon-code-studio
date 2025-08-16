import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ArrowLeft, Download, ExternalLink, RotateCcw, MessageSquare, X } from "lucide-react";
import { ChatPanel } from "./ChatPanel";
import { CodePreview } from "./CodePreview";
import { FileNode } from "./FileTree";
import { cn } from "@/lib/utils";

interface ChatLayoutProps {
  files: FileNode[];
  selectedFile?: { path: string; content: string };
  onFileSelect: (path: string, content: string) => void;
  onBackToInput: () => void;
  onNewProject: () => void;
  onSendMessage: (message: string) => Promise<void>;
  generatedCode?: string;
  isLoading: boolean;
}

export const ChatLayout = ({
  files,
  selectedFile,
  onFileSelect,
  onBackToInput,
  onNewProject,
  onSendMessage,
  generatedCode,
  isLoading
}: ChatLayoutProps) => {
  const [chatVisible, setChatVisible] = useState(true);

  const downloadHtml = () => {
    if (files.length > 0 && files[0].content) {
      const blob = new Blob([files[0].content], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'index.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const openInNewTab = () => {
    if (files.length > 0 && files[0].content) {
      const blob = new Blob([files[0].content], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  };

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackToInput}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Input
            </Button>
            <div className="h-6 w-px bg-border" />
            <h2 className="font-semibold">Generated Website</h2>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setChatVisible(!chatVisible)}
              className="gap-2"
            >
              {chatVisible ? (
                <>
                  <X className="w-4 h-4" />
                  Hide Chat
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4" />
                  Show Chat
                </>
              )}
            </Button>
            <div className="h-6 w-px bg-border" />
            <Button
              variant="outline"
              size="sm"
              onClick={downloadHtml}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={openInNewTab}
              className="gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Open
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onNewProject}
              className="gap-2 text-destructive hover:text-destructive"
            >
              <RotateCcw className="w-4 h-4" />
              New Project
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        {chatVisible ? (
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={30} minSize={25} maxSize={45}>
              <ChatPanel
                onSendMessage={onSendMessage}
                isLoading={isLoading}
              />
            </ResizablePanel>
            
            <ResizableHandle className="w-1 bg-border hover:bg-accent transition-colors" />
            
            <ResizablePanel defaultSize={70} minSize={55}>
              <CodePreview
                files={files}
                selectedFile={selectedFile}
                onFileSelect={onFileSelect}
                generatedCode={generatedCode}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          <CodePreview
            files={files}
            selectedFile={selectedFile}
            onFileSelect={onFileSelect}
            generatedCode={generatedCode}
          />
        )}
      </div>
    </div>
  );
};