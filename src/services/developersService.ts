import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';

type Developer = Database['public']['Tables']['developers']['Row'];
type InsertDeveloper = Database['public']['Tables']['developers']['Insert'];

export const developersService = {
  async getDevelopers() {
    const { data, error } = await supabase
      .from('developers')
      .select(`
        *,
        projects (
          project_id,
          units (
            unit_id,
            status,
            price,
            deals ( status )
          )
        ),
        deals (
          deal_id,
          status,
          final_price,
          expected_price
        )
      `)
      .eq('is_archived', false);

    if (error) throw error;
    return data;
  },

  async createDeveloper(developerData: any) {
    const { data, error } = await supabase
      .from('developers')
      .insert(developerData as any)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
