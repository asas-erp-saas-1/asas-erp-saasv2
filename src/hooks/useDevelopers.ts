import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { developersService } from '../services/developersService';
import { Database } from '../types/supabase';

type InsertDeveloper = Database['public']['Tables']['developers']['Insert'];

export function useDevelopers() {
  return useQuery({
    queryKey: ['developers'],
    queryFn: developersService.getDevelopers,
  });
}

export function useCreateDeveloper() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (developerData: InsertDeveloper) => developersService.createDeveloper(developerData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['developers'] });
    },
  });
}
