import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsService } from '../services/projectsService';
import { Database } from '../types/supabase';

type InsertProject = Database['public']['Tables']['projects']['Insert'];

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: projectsService.getProjects,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (projectData: InsertProject) => projectsService.createProject(projectData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
