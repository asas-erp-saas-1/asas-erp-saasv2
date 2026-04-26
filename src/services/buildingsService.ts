import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';

type Building = any; // Database['public']['Tables']['buildings']['Row'];
type InsertBuilding = any; // Database['public']['Tables']['buildings']['Insert'];

export const buildingsService = {
  async getBuildings() {
    const { data, error } = await supabase.from('buildings').select(`
      *,
      projects ( name ),
      units (
        unit_id,
        status,
        deals ( status )
      )
    `);

    if (error) throw error;
    return data;
  },

  async createBuilding(buildingData: any) {
    const { data, error } = await supabase
      .from('buildings')
      .insert(buildingData as any)
      .select()
      .single();

    if (error) throw error;

    const buildingId = data ? (data as any).building_id : null;
    const totalFloors = buildingData.total_floors || 0;

    if (totalFloors > 0) {
      const floorsToInsert = Array.from({ length: totalFloors }, (_, i) => ({
        building_id: buildingId,
        floor_number: i + 1,
        name: `Floor ${i + 1}`
      }));
      
      const { error: floorsError } = await supabase
        .from('floors')
        .insert(floorsToInsert as any);
        
      if (floorsError) {
        console.error('Error adding floors:', floorsError);
      }
    }

    return data;
  }
};
