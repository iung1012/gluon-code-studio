import { useState, useEffect } from "react";
import { ChevronRight, FileText, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
interface Project {
  id: string;
  name: string;
  description: string | null;
  html_content: string;
  created_at: string;
  updated_at: string;
}
interface ProjectSidebarProps {
  onProjectSelect: (project: Project) => void;
  onNewProject: () => void;
  currentProjectId?: string;
}
export const ProjectSidebar = ({
  onProjectSelect,
  onNewProject,
  currentProjectId
}: ProjectSidebarProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const {
    toast
  } = useToast();
  useEffect(() => {
    loadProjects();
  }, []);
  const loadProjects = async () => {
    setLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.from('projects').select('*').order('updated_at', {
        ascending: false
      });
      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error loading projects:', error);
      toast({
        title: "Erro ao carregar projetos",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInHours < 1) return "Agora";
    if (diffInHours < 24) return `${diffInHours}h atrás`;
    if (diffInDays === 1) return "Ontem";
    if (diffInDays < 7) return `${diffInDays} dias atrás`;
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short'
    });
  };
  return <>
      {/* Trigger area - invisible hover zone */}
      <div className="fixed left-0 top-16 bottom-0 w-2 z-50" onMouseEnter={() => setIsExpanded(true)} />
      
      {/* Sidebar */}
      <div className={`fixed left-0 top-16 bottom-0 z-40 transition-all duration-300 ease-in-out bg-background border-r border-border shadow-lg ${isExpanded ? 'translate-x-0' : '-translate-x-full'}`} style={{
      width: '280px'
    }} onMouseLeave={() => setIsExpanded(false)}>
        <div className="flex flex-col h-full">
          {/* Header */}
          

          {/* New Project Button */}
          <div className="p-2">
            <Button onClick={onNewProject} variant="outline" size="sm" className="w-full justify-start gap-2" title="Novo Projeto">
              <Plus className="w-4 h-4" />
              <span>Novo Projeto</span>
            </Button>
          </div>

          {/* Projects List */}
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {loading ? <div className="text-xs text-muted-foreground p-2">
                  Carregando...
                </div> : projects.length === 0 ? <div className="text-xs text-muted-foreground p-2">
                  Nenhum projeto ainda
                </div> : projects.map(project => <button key={project.id} onClick={() => onProjectSelect(project)} className={`w-full text-left p-2 rounded-md transition-colors hover:bg-accent ${currentProjectId === project.id ? 'bg-accent' : ''}`} title={project.name}>
                    <div className="flex items-start gap-2">
                      <FileText className="w-4 h-4 flex-shrink-0 mt-0.5 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{project.name}</div>
                        {project.description && <div className="text-xs text-muted-foreground truncate">
                            {project.description}
                          </div>}
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatDate(project.updated_at)}
                        </div>
                      </div>
                    </div>
                  </button>)}
            </div>
          </ScrollArea>
        </div>
      </div>
    </>;
};