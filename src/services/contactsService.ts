import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';

type Contact = any; // Database['public']['Tables']['contacts']['Row'];
type InsertContact = any; // Database['public']['Tables']['contacts']['Insert'];
type UpdateContact = any; // Database['public']['Tables']['contacts']['Update'];

export const contactsService = {
  async getContacts() {
    const { data, error } = await supabase
      .from('contacts')
      .select(`
        *,
        agents!contacts_owner_agent_id_fkey ( name )
      `)
      .eq('is_archived', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getContactById(id: string) {
    const { data, error } = await supabase
      .from('contacts')
      .select(`
        *,
        agents!contacts_owner_agent_id_fkey ( name )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async createContact(contact: any) {
    const { data, error } = await supabase
      .from('contacts')
      .insert(contact as any)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateContact(id: string, updates: any) {
    const { data, error } = await supabase
      .from('contacts')
      .update(updates as never)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async archiveContact(id: string) {
    const { error } = await supabase
      .from('contacts')
      .update({ is_archived: true } as never)
      .eq('id', id);

    if (error) throw error;
  },

  async deleteContact(id: string) {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
