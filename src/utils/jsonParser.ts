export const parseProjectStructure = (content: string): { path: string; content: string }[] => {
  console.log('📄 Parsing content from API:', content.substring(0, 200) + '...');
  
  let cleanContent = content.trim();
  
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
    // Try to extract file objects with better handling of escaped content
    const fileObjectPattern = /\{\s*"path"\s*:\s*"([^"]+)"\s*,\s*"content"\s*:\s*"((?:[^"\\]|\\.)*)"\s*\}/g;
    let match;
    
    while ((match = fileObjectPattern.exec(content)) !== null) {
      const [, path, rawContent] = match;
      
      // Properly decode escaped JSON strings
      try {
        const decodedContent = JSON.parse(`"${rawContent}"`);
        files.push({
          path: path,
          content: decodedContent
        });
      } catch {
        // Fallback to manual replacement if JSON.parse fails
        const decodedContent = rawContent
          .replace(/\\n/g, '\n')
          .replace(/\\t/g, '\t')
          .replace(/\\r/g, '\r')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\');
        
        files.push({
          path: path,
          content: decodedContent
        });
      }
    }
    
    // If no files found with strict pattern, try looser matching
    if (files.length === 0) {
      console.warn('🔍 Trying alternative extraction method...');
      const pathPattern = /"path"\s*:\s*"([^"]+)"/g;
      const paths: string[] = [];
      
      while ((match = pathPattern.exec(content)) !== null) {
        paths.push(match[1]);
      }
      
      // For each path, try to find the corresponding content
      paths.forEach(path => {
        const pathIndex = content.indexOf(`"path":"${path}"`);
        if (pathIndex === -1) return;
        
        const contentStart = content.indexOf('"content":"', pathIndex);
        if (contentStart === -1) return;
        
        const contentValueStart = contentStart + 11; // length of '"content":"'
        let contentEnd = contentValueStart;
        let escapeNext = false;
        
        // Find the end of the content string, respecting escapes
        while (contentEnd < content.length) {
          const char = content[contentEnd];
          if (escapeNext) {
            escapeNext = false;
          } else if (char === '\\') {
            escapeNext = true;
          } else if (char === '"') {
            break;
          }
          contentEnd++;
        }
        
        const rawContent = content.substring(contentValueStart, contentEnd);
        
        try {
          const decodedContent = JSON.parse(`"${rawContent}"`);
          files.push({ path, content: decodedContent });
        } catch {
          const decodedContent = rawContent
            .replace(/\\n/g, '\n')
            .replace(/\\t/g, '\t')
            .replace(/\\r/g, '\r')
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\');
          
          files.push({ path, content: decodedContent });
        }
      });
    }
  } catch (error) {
    console.error('Error extracting files from malformed JSON:', error);
  }
  
  return files;
};
