import { kernel } from '@/lib/kernel/core';

export async function processLeadAssignment(payload: { tenantId: string, leadId: string }) {
  await kernel.transaction(async (tx) => {
    // Round robin logic mock
    console.log(`Assigning lead ${payload.leadId} in tenant ${payload.tenantId}`);
    
    // Find agents
    const agents = await tx.query<any>('tenant_members', {
      select: 'user_id',
      filters: { tenant_id: payload.tenantId, role: 'agent' }
    });
    
    if (agents.length === 0) {
      console.log(`No agents found for tenant ${payload.tenantId}`);
      return;
    }
    
    // Pick first (mock round robin)
    const agentId = agents[0].user_id;
    
    await tx.mutate('leads', 'UPDATE', { assigned_to: agentId }, { id: payload.leadId });
    
    console.log(`Lead ${payload.leadId} assigned to ${agentId}`);
  });
}
