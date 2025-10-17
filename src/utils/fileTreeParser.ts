import type { FileNode } from '@/components/FileTree';

export const buildFileTree = (files: { path: string; content: string }[]): FileNode[] => {
  const root: { [key: string]: FileNode } = {};
  
  files.forEach(file => {
    const parts = file.path.split('/');
    let current: any = root;
    
    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;
      
      if (isFile) {
        current[part] = {
          name: part,
          type: 'file',
          path: file.path,
          content: file.content,
          children: []
        };
      } else {
        if (!current[part]) {
          current[part] = {
            name: part,
            type: 'folder',
            path: parts.slice(0, index + 1).join('/'),
            children: []
          };
        }
        if (!current[part].childrenMap) {
          current[part].childrenMap = {};
        }
        current = current[part].childrenMap;
      }
    });
  });
  
  const convertToArray = (obj: any): FileNode[] => {
    return Object.values(obj).map((node: any) => {
      if (node.childrenMap) {
        node.children = convertToArray(node.childrenMap);
        delete node.childrenMap;
      }
      return node;
    });
  };
  
  return convertToArray(root);
};

export const findFirstFile = (nodes: FileNode[]): FileNode | null => {
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

export const isReactProject = (files: FileNode[]): boolean => {
  const flattenFiles = (nodes: FileNode[]): FileNode[] => {
    return nodes.reduce((acc, node) => {
      if (node.type === 'file') {
        acc.push(node);
      }
      if (node.children) {
        acc.push(...flattenFiles(node.children));
      }
      return acc;
    }, [] as FileNode[]);
  };
  
  const allFiles = flattenFiles(files);
  return allFiles.some(f => 
    f.name === 'package.json' && 
    f.content?.includes('"react"')
  );
};
