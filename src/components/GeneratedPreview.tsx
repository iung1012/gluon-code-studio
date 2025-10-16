import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, ExternalLink, RotateCcw } from "lucide-react";
import { CodePreview } from "./CodePreview";
import { FileNode } from "./FileTree";

interface GeneratedPreviewProps {
  files: FileNode[];
  selectedFile?: { path: string; content: string };
  onFileSelect: (path: string, content: string) => void;
  onBackToInput: () => void;
  onNewProject: () => void;
  generatedCode?: string;
}

export const GeneratedPreview = ({
  files,
  selectedFile,
  onFileSelect,
  onBackToInput,
  onNewProject,
  generatedCode
}: GeneratedPreviewProps) => {
  const getAllFiles = (nodes: FileNode[]): FileNode[] => {
    let result: FileNode[] = [];
    for (const node of nodes) {
      if (node.type === 'file') {
        result.push(node);
      } else if (node.type === 'folder' && node.children) {
        result = result.concat(getAllFiles(node.children));
      }
    }
    return result;
  };

  const downloadProject = async () => {
    const allFiles = getAllFiles(files);
    
    if (allFiles.length === 0) return;
    
    // If single file, download directly
    if (allFiles.length === 1 && allFiles[0].content) {
      const blob = new Blob([allFiles[0].content], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = allFiles[0].name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return;
    }
    
    // Multiple files - create ZIP
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    
    allFiles.forEach(file => {
      if (file.content) {
        zip.file(file.path, file.content);
      }
    });
    
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'website-project.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
              onClick={downloadProject}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              {getAllFiles(files).length > 1 ? 'Download ZIP' : 'Download'}
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
        <CodePreview
          files={files}
          selectedFile={selectedFile}
          onFileSelect={onFileSelect}
          generatedCode={generatedCode}
        />
      </div>
    </div>
  );
};