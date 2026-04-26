import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';

type Deal = Database['public']['Tables']['deals']['Row'];
type InsertDeal = Database['public']['Tables']['deals']['Insert'];
type UpdateDeal = Database['public']['Tables']['deals']['Update'];

export const dealsService = {
  async getDeals() {
    const { data, error } = await supabase
      .from('deals')
      .select(`
        *,
        contacts ( name, phone ),
        agents ( name ),
        units ( unit_number, price, projects ( name, developers ( name ) ) ),
        commissions ( expected_commission )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async updateDealStage(id: string, stage: string) {
    const { data, error } = await supabase
      .from('deals')
      .update({ status: stage } as never)
      .eq('deal_id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteDeal(id: string) {
    const { error } = await supabase
      .from('deals')
      .delete()
      .eq('deal_id', id);

    if (error) throw error;
  },

  async createDeal(dealData: any, commissionData: any) {
    // 1. Create Deal
    const { data: newDeal, error: dealError } = await supabase
      .from('deals')
      .insert(dealData as any)
      .select()
      .single();

    if (dealError) throw dealError;
    if (!newDeal) throw new Error('Failed to retrieve created deal data.');

    // 2. Create Commission Entry
    const { error: commError } = await supabase
      .from('commissions')
      .insert({
        ...commissionData,
        deal_id: (newDeal as any).deal_id
      } as any);

    if (commError) {
      console.error('Commission creation failed:', commError);
      throw new Error('Deal created, but commission creation failed. Please contact admin.');
    }

    return newDeal;
  }
};
