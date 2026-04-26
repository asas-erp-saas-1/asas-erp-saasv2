import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';

type Project = Database['public']['Tables']['projects']['Row'];
type InsertProject = Database['public']['Tables']['projects']['Insert'];

export const projectsService = {
  async getProjects() {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        developers ( name ),
        buildings ( building_id ),
        units (
          unit_id,
          status,
          deals ( status )
        )
      `)
      .eq('is_archived', false);

    if (error) throw error;
    return data;
  },

  async createProject(projectData: any) {
    const { data, error } = await supabase
      .from('projects')
      .insert(projectData as any)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
