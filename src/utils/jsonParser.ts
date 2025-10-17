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
    // Try to extract complete file objects including truncated ones
    const filePattern = /\{"path"\s*:\s*"([^"]+)"\s*,\s*"content"\s*:\s*"((?:[^"\\]|\\.)*)"\}/gs;
    let match;
    
    while ((match = filePattern.exec(content)) !== null) {
      const [, path, fileContent] = match;
      files.push({
        path: path,
        content: fileContent.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\')
      });
    }
    
    // Fallback: try to match incomplete entries
    if (files.length === 0) {
      const pathPattern = /"path"\s*:\s*"([^"]+)"/g;
      const matches = [...content.matchAll(pathPattern)];
      
      for (let i = 0; i < matches.length; i++) {
        const path = matches[i][1];
        const startIdx = matches[i].index! + matches[i][0].length;
        const endIdx = i < matches.length - 1 ? matches[i + 1].index! : content.length;
        const section = content.substring(startIdx, endIdx);
        
        const contentMatch = section.match(/"content"\s*:\s*"((?:[^"\\]|\\.)*)"/s);
        if (contentMatch) {
          files.push({
            path: path,
            content: contentMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\')
          });
        }
      }
    }
    
    console.log(`✅ Extracted ${files.length} files from malformed JSON`);
    files.forEach(f => console.log(`  - ${f.path} (${f.content.length} chars)`));
    
  } catch (error) {
    console.error('Error extracting files from malformed JSON:', error);
  }
  
  return files;
};
