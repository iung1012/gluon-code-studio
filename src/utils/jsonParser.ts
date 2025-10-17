export const parseProjectStructure = (content: string): { path: string; content: string }[] => {
  console.log('📄 Parsing content from API:', content.substring(0, 200) + '...');
  
  let cleanContent = content.trim();
  
  // Check if it's old HTML format (legacy projects)
  if (cleanContent.startsWith('<!DOCTYPE') || cleanContent.startsWith('<html')) {
    console.log('⚠️ Legacy HTML format detected, converting to React structure...');
    return [{
      path: 'package.json',
      content: JSON.stringify({
        name: 'legacy-project',
        private: true,
        version: '0.0.0',
        type: 'module',
        scripts: {
          dev: 'vite',
          build: 'tsc && vite build',
          preview: 'vite preview'
        },
        dependencies: {
          react: '^18.3.1',
          'react-dom': '^18.3.1'
        },
        devDependencies: {
          '@types/react': '^18.3.3',
          '@types/react-dom': '^18.3.0',
          '@vitejs/plugin-react': '^4.3.1',
          typescript: '^5.5.4',
          vite: '^5.4.2'
        }
      }, null, 2)
    }, {
      path: 'index.html',
      content: cleanContent
    }, {
      path: 'vite.config.ts',
      content: `import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\n\nexport default defineConfig({\n  plugins: [react()],\n})`
    }, {
      path: 'tsconfig.json',
      content: JSON.stringify({
        compilerOptions: {
          target: 'ES2020',
          useDefineForClassFields: true,
          lib: ['ES2020', 'DOM', 'DOM.Iterable'],
          module: 'ESNext',
          skipLibCheck: true,
          moduleResolution: 'bundler',
          allowImportingTsExtensions: true,
          resolveJsonModule: true,
          isolatedModules: true,
          noEmit: true,
          jsx: 'react-jsx',
          strict: true
        },
        include: ['src']
      }, null, 2)
    }, {
      path: 'src/main.tsx',
      content: `import React from 'react'\nimport ReactDOM from 'react-dom/client'\nimport App from './App.tsx'\n\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>,\n)`
    }, {
      path: 'src/App.tsx',
      content: `export default function App() {\n  return (\n    <div className="min-h-screen flex items-center justify-center bg-gray-100">\n      <h1 className="text-4xl font-bold">Legacy Project - Please regenerate</h1>\n    </div>\n  )\n}`
    }];
  }
  
  // Remove markdown code blocks
  if (cleanContent.startsWith('```')) {
    cleanContent = cleanContent.replace(/^```(?:json|html)?\s*\n?/, '');
    cleanContent = cleanContent.replace(/\n?```\s*$/, '');
    console.log('🧹 Removed markdown code block wrapper');
  }
  
  cleanContent = cleanContent.replace(/^`+|`+$/g, '').trim();
  cleanContent = fixJsonIssues(cleanContent);
  
  try {
    const parsed = JSON.parse(cleanContent);
    
    if (parsed.files && Array.isArray(parsed.files)) {
      console.log('✅ React project detected:', parsed.files.length, 'files');
      return parsed.files;
    }
  } catch (e) {
    console.error('❌ JSON parse failed:', e);
    console.error('Content length:', cleanContent.length);
    console.error('Failed content (first 300 chars):', cleanContent.substring(0, 300));
    console.error('Failed content (last 300 chars):', cleanContent.substring(cleanContent.length - 300));
    
    const extractedFiles = tryExtractFilesFromMalformedJson(cleanContent);
    if (extractedFiles.length > 0) {
      console.log('✅ Successfully extracted files from malformed JSON:', extractedFiles.length);
      return extractedFiles;
    }
    
    throw new Error('Resposta da API está incompleta ou malformada. Tente novamente.');
  }
  
  throw new Error('Formato inválido: A IA deve retornar um projeto React em JSON');
};

const fixJsonIssues = (content: string): string => {
  let fixed = content;
  
  if (fixed.endsWith('...') || (!fixed.endsWith('}') && !fixed.endsWith(']'))) {
    console.warn('⚠️ Content appears truncated, attempting to fix...');
    
    const lastBrace = fixed.lastIndexOf('}');
    if (lastBrace > 0) {
      fixed = fixed.substring(0, lastBrace + 1);
      
      if (!fixed.includes('"files"')) {
        const filesStart = fixed.indexOf('"files"');
        if (filesStart > 0) {
          const beforeFiles = fixed.substring(0, filesStart);
          const filesContent = fixed.substring(filesStart);
          
          const lastFileEnd = filesContent.lastIndexOf('}');
          if (lastFileEnd > 0) {
            fixed = beforeFiles + filesContent.substring(0, lastFileEnd + 1) + ']}';
          }
        }
      }
    }
  }
  
  fixed = fixed
    .replace(/\\n/g, '\\n')
    .replace(/\\"/g, '\\"')
    .replace(/\\\\/g, '\\\\');
  
  return fixed;
};

const tryExtractFilesFromMalformedJson = (content: string): {path: string, content: string}[] => {
  const files: {path: string, content: string}[] = [];
  
  try {
    const filePattern = /"path"\s*:\s*"([^"]+)"\s*,\s*"content"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/g;
    let match;
    
    while ((match = filePattern.exec(content)) !== null) {
      const [, path, content] = match;
      files.push({
        path: path,
        content: content.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\')
      });
    }
    
    if (files.length === 0) {
      const pathMatches = content.match(/"path"\s*:\s*"([^"]+)"/g);
      const contentMatches = content.match(/"content"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/g);
      
      if (pathMatches && contentMatches && pathMatches.length === contentMatches.length) {
        for (let i = 0; i < pathMatches.length; i++) {
          const path = pathMatches[i].match(/"path"\s*:\s*"([^"]+)"/)?.[1];
          const fileContent = contentMatches[i].match(/"content"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/)?.[1];
          
          if (path && fileContent) {
            files.push({
              path: path,
              content: fileContent.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\')
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Error extracting files from malformed JSON:', error);
  }
  
  return files;
};
