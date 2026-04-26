import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dealsService } from '../services/dealsService';

export function useDeals() {
  return useQuery({
    queryKey: ['deals'],
    queryFn: dealsService.getDeals,
  });
}

export function useUpdateDealStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) => 
      dealsService.updateDealStage(id, stage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });
}

export function useDeleteDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dealsService.deleteDeal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });
}

export function useCreateDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ dealData, commissionData }: { dealData: any; commissionData: any }) => 
      dealsService.createDeal(dealData, commissionData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });
}
