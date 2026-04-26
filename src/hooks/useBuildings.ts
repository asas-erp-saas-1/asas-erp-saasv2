import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { buildingsService } from '../services/buildingsService';
import { Database } from '../types/supabase';

type InsertBuilding = any; // Database['public']['Tables']['buildings']['Insert'];

export function useBuildings() {
  return useQuery({
    queryKey: ['buildings'],
    queryFn: buildingsService.getBuildings,
  });
}

export function useCreateBuilding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (buildingData: InsertBuilding) => buildingsService.createBuilding(buildingData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
    },
  });
}
