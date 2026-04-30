'use server';

import { createClient } from '@/lib/supabase-server';
import { resolvePermissionContext, createPermissionService } from '@/lib/permissions';
import { transitionLeadStatus } from '@/services/leadService';

export async function updateLeadStatusAction(leadId: string, newStatus: string) {
  const db = await createClient();
  const ctx = await resolvePermissionContext(db);
  const perms = createPermissionService(db, ctx);
  
  await perms.enforce('lead.update');

  const lead = await transitionLeadStatus(leadId, newStatus, ctx.actorId);
  return lead;
}
