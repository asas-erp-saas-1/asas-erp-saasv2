import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';

type Unit = any; // Database['public']['Tables']['units']['Row'];
type InsertUnit = any; // Database['public']['Tables']['units']['Insert'];

export const unitsService = {
  async getUnits() {
    const { data, error } = await supabase
      .from('units')
      .select(`
        *,
        projects ( name, developers ( name ) ),
        buildings ( name ),
        floors ( floor_number ),
        deals ( deal_id, status )
      `)
      .eq('is_archived', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async createUnit(unitData: any) {
    const { data, error } = await supabase
      .from('units')
      .insert(unitData as any)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
