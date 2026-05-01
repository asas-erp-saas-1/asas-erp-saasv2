import { createClient } from '@supabase/supabase-js';

// Server-side realtime broadcaster (trusted client)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-service-key'; 

const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export class RealtimeEngine {
  static async broadcast(tenantId: string, channel: string, event: string, payload: any) {
    if (!supabase) {
      console.log(`[Realtime Mock] Tenant: ${tenantId}, Channel: ${channel}, Event: ${event}`, payload);
      return;
    }
    
    const room = `tenant:${tenantId}:${channel}`;
    const ch = supabase.channel(room);
    
    await ch.send({
      type: 'broadcast',
      event: event,
      payload: payload
    });
    
    await supabase.removeChannel(ch);
  }

  static async notifyLeadCreated(tenantId: string, lead: any) {
    await this.broadcast(tenantId, 'leads', 'created', lead);
  }

  static async notifyDealUpdated(tenantId: string, deal: any) {
    await this.broadcast(tenantId, 'deals', 'updated', deal);
  }
}
