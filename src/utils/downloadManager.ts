interface ProjectFile {
  name: string;
  path: string;
  content: string;
  type: string;
}

interface DownloadProject {
  files: ProjectFile[];
  projectName: string;
}

export class DownloadManager {
  static async downloadAsZip(project: DownloadProject) {
    // Import JSZip dynamically
    const JSZip = (await import('jszip')).default;
    
    const zip = new JSZip();
    const projectFolder = zip.folder(project.projectName);
    
    if (!projectFolder) {
      throw new Error('Erro ao criar pasta do projeto');
    }

    // Adicionar arquivos ao ZIP
    project.files.forEach(file => {
      projectFolder.file(file.path, file.content);
    });

    // Adicionar arquivos adicionais
    this.addProjectExtras(projectFolder);

    // Gerar e download do ZIP
    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.projectName}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Cleanup
    URL.revokeObjectURL(url);
  }

  static downloadSingleFile(filename: string, content: string, mimeType = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  static generateProjectName(prompt: string): string {
    // Extrair palavras-chave do prompt
    const words = prompt
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2)
      .slice(0, 3);
    
    if (words.length === 0) {
      return `projeto-${Date.now()}`;
    }
    
    return words.join('-') + '-website';
  }

  private static addProjectExtras(folder: any) {
    // .gitignore
    folder.file('.gitignore', `node_modules/
.DS_Store
*.log
.env
dist/
build/`);

    // package.json básico para projetos Node.js
    const packageJson = {
      name: "website-gerado",
      version: "1.0.0",
      description: "Website gerado automaticamente",
      main: "index.html",
      scripts: {
        start: "npx serve .",
        dev: "npx live-server .",
        build: "echo 'Build concluído'"
      },
      keywords: ["website", "html", "css", "javascript"],
      author: "Studio de Desenvolvimento",
      license: "MIT",
      devDependencies: {
        "live-server": "^1.2.2",
        "serve": "^14.0.1"
      }
    };
    
    folder.file('package.json', JSON.stringify(packageJson, null, 2));

    // Instruções de uso
    const instructions = `# Instruções de Uso

## Instalação
1. Extraia o arquivo ZIP
2. Navegue até a pasta do projeto
3. Abra \`index.html\` diretamente no navegador

## Desenvolvimento
Para desenvolvimento local com servidor:

\`\`\`bash
npm install
npm run dev
\`\`\`

## Estrutura do Projeto
- \`index.html\` - Página principal
- \`css/\` - Arquivos de estilo
- \`js/\` - Scripts JavaScript
- \`assets/\` - Imagens e recursos

## Personalização
1. Modifique \`css/styles.css\` para alterar estilos
2. Edite \`js/script.js\` para funcionalidades
3. Atualize \`index.html\` para conteúdo

## Responsividade
O projeto já inclui:
- Design mobile-first
- Breakpoints para tablet e desktop
- Imagens otimizadas
- Navegação adaptável

## Deploy
Para fazer deploy:
1. Teste localmente
2. Faça upload dos arquivos para seu servidor
3. Configure domínio se necessário

---
Criado com ❤️ pelo Studio de Desenvolvimento`;

    folder.file('INSTRUCOES.md', instructions);

    // Manifest para PWA
    const manifest = {
      name: "Website Gerado",
      short_name: "Website",
      description: "Website gerado automaticamente",
      start_url: "/",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#3b82f6",
      icons: [
        {
          src: "assets/icon-192.png",
          sizes: "192x192",
          type: "image/png"
        }
      ]
    };
    
    folder.file('manifest.json', JSON.stringify(manifest, null, 2));
  }

  static createProjectStructure(files: ProjectFile[]) {
    // Organizar arquivos em estrutura hierárquica
    const structure: any = {};
    
    files.forEach(file => {
      const pathParts = file.path.split('/');
      let current = structure;
      
      pathParts.forEach((part, index) => {
        if (index === pathParts.length - 1) {
          // É um arquivo
          current[part] = {
            type: 'file',
            content: file.content,
            name: file.name
          };
        } else {
          // É uma pasta
          if (!current[part]) {
            current[part] = {
              type: 'folder',
              children: {}
            };
          }
          current = current[part].children;
        }
      });
    });
    
    return structure;
  }

  static async shareProject(project: DownloadProject) {
    if (navigator.share) {
      try {
        // Criar um arquivo temporário para compartilhamento
        const zipBlob = await this.createZipBlob(project);
        const file = new File([zipBlob], `${project.projectName}.zip`, {
          type: 'application/zip'
        });

        await navigator.share({
          title: project.projectName,
          text: 'Projeto gerado pelo Studio de Desenvolvimento',
          files: [file]
        });
      } catch (error) {
        console.error('Erro ao compartilhar:', error);
        // Fallback para download
        this.downloadAsZip(project);
      }
    } else {
      // Fallback para download
      this.downloadAsZip(project);
    }
  }

  private static async createZipBlob(project: DownloadProject): Promise<Blob> {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    const projectFolder = zip.folder(project.projectName);
    
    if (!projectFolder) {
      throw new Error('Erro ao criar pasta do projeto');
    }

    project.files.forEach(file => {
      projectFolder.file(file.path, file.content);
    });

    this.addProjectExtras(projectFolder);

    return await zip.generateAsync({ type: 'blob' });
  }
}