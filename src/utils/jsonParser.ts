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
