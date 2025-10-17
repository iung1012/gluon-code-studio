import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@supabase/supabase-js';

export const useProjectManagement = (user: User | null) => {
  const [currentProjectId, setCurrentProjectId] = useState<string | undefined>();
  const [currentProjectName, setCurrentProjectName] = useState<string>('');
  const { toast } = useToast();

  const saveProject = async (htmlContent: string, projectName?: string) => {
    if (!user) return;

    try {
      const name = projectName || currentProjectName || `Projeto ${new Date().toLocaleDateString('pt-BR')}`;
      
      if (currentProjectId) {
        const { error } = await supabase
          .from('projects')
          .update({
            html_content: htmlContent,
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentProjectId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('projects')
          .insert({
            name,
            html_content: htmlContent,
            user_id: user.id,
          })
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setCurrentProjectId(data.id);
          setCurrentProjectName(data.name);
        }
      }
    } catch (error) {
      console.error('Error saving project:', error);
      toast({
        title: "Erro ao salvar projeto",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const resetProject = () => {
    setCurrentProjectId(undefined);
    setCurrentProjectName('');
  };

  return {
    currentProjectId,
    currentProjectName,
    setCurrentProjectId,
    setCurrentProjectName,
    saveProject,
    resetProject
  };
};
