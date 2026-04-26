import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { unitsService } from '../services/unitsService';
import { Database } from '../types/supabase';

type InsertUnit = any; // Database['public']['Tables']['units']['Insert'];

export function useUnits() {
  return useQuery({
    queryKey: ['units'],
    queryFn: unitsService.getUnits,
  });
}

export function useCreateUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (unitData: InsertUnit) => unitsService.createUnit(unitData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
    },
  });
}
