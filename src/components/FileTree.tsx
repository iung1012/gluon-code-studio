import { useState } from "react";
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FileNode {
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  content?: string;
  path: string;
}

interface FileTreeProps {
  files: FileNode[];
  selectedFile?: string;
  onFileSelect: (path: string, content: string) => void;
}

const FileTreeNode = ({ 
  node, 
  level = 0, 
  selectedFile,
  onFileSelect 
}: { 
  node: FileNode; 
  level?: number;
  selectedFile?: string;
  onFileSelect: (path: string, content: string) => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(level < 2);

  const handleClick = () => {
    if (node.type === 'folder') {
      setIsExpanded(!isExpanded);
    } else if (node.content) {
      onFileSelect(node.path, node.content);
    }
  };

  const isSelected = selectedFile === node.path;

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-accent/30 transition-colors rounded-md text-sm",
          isSelected && "bg-accent/50 text-accent-foreground"
        )}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
        onClick={handleClick}
      >
        {node.type === 'folder' ? (
          <>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
            {isExpanded ? (
              <FolderOpen className="w-4 h-4 text-primary" />
            ) : (
              <Folder className="w-4 h-4 text-primary" />
            )}
          </>
        ) : (
          <>
            <div className="w-4" />
            <File className="w-4 h-4 text-muted-foreground" />
          </>
        )}
        <span className="truncate">{node.name}</span>
      </div>
      
      {node.type === 'folder' && isExpanded && node.children && (
        <div>
          {node.children.map((child, index) => (
            <FileTreeNode
              key={`${child.path}-${index}`}
              node={child}
              level={level + 1}
              selectedFile={selectedFile}
              onFileSelect={onFileSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const FileTree = ({ files, selectedFile, onFileSelect }: FileTreeProps) => {
  if (files.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-center p-6">
        <div>
          <Folder className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No files generated yet</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Submit a prompt to generate your website
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="p-4">
        <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
          <Folder className="w-4 h-4" />
          Project Files
        </h3>
        <div className="space-y-1">
          {files.map((file, index) => (
            <FileTreeNode
              key={`${file.path}-${index}`}
              node={file}
              selectedFile={selectedFile}
              onFileSelect={onFileSelect}
            />
          ))}
        </div>
      </div>
    </div>
  );
};