'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';

export async function transitionDealStatusAction(id: string, status: string, reason?: string) {
  const db = await createServerSupabaseClient();
  const actor = await requireAuth(db);

  const VALID = ['active','negotiation','closed','cancelled'];
  if (!status || !VALID.includes(status)) {
    throw new Error(`VALIDATION: status must be one of ${VALID.join(', ')}`);
  }

  // Verify deal belongs to agency + actor has access
  const { data: deal, error: fetchErr } = await db
    .from('deals')
    .select('id, status, agent_id, agency_id')
    .eq('id', id)
    .eq('agency_id', actor.agencyId)
    .is('deleted_at', null)
    .single();

  if (fetchErr || !deal) throw new Error('DEAL_NOT_FOUND');

  const d = deal as any;
  if (actor.role === 'agent' && d.agent_id !== actor.id) {
    throw new Error('PERMISSION_DENIED: Not your deal');
  }

  // Perform update — DB trigger enforces state machine
  const { data: updated, error: updateErr } = await db
    .from('deals')
    .update({
      status,
      cancellation_reason: status === 'cancelled' ? (reason ?? null) : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('agency_id', actor.agencyId)
    .select()
    .single();

  if (updateErr) {
    throw new Error(updateErr.message);
  }

  // Log status history
  await db.from('deal_status_history').insert({
    agency_id:   actor.agencyId,
    deal_id:     id,
    from_status: d.status,
    to_status:   status,
    changed_by:  actor.id,
    notes:       reason ?? null,
  });

  // Financial audit for closes
  if (status === 'closed') {
    await db.from('financial_audit').insert({
      agency_id:   actor.agencyId,
      actor_id:    actor.id,
      action:      'deal.closed',
      entity_type: 'deals',
      entity_id:   id,
      before_state: { status: d.status },
      after_state:  { status: 'closed' },
    });
  }

  return updated;
}
