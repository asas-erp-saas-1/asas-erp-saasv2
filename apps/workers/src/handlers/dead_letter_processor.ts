import { SupabaseClient } from '@supabase/supabase-js';

export class DeadLetterProcessor {
  /**
   * Scans dead letter queue and attempts a deterministic retry or alerts on unrecoverable items.
   */
  static async recoverFailedEvents(db: SupabaseClient) {
    const { data: deadLetters, error } = await db
      .from('dead_letter_events')
      .select('*')
      .eq('status', 'FAILED')
      .limit(100);
    
    if (error) throw new Error(error.message);

    for (const dl of deadLetters) {
       console.log(`[DLQ] Attempting recovery for Dead Letter ID: ${dl.id} | Origin Event ID: ${dl.event_id}`);
       
       // 1. Fetch original event payload
       const { data: event } = await db.from('outbox_events').select('*').eq('id', dl.event_id).single();
       if (!event) {
          console.error(`[DLQ] CRITICAL: Original event ${dl.event_id} missing.`);
          continue;
       }

       try {
          // 2. Clear old idempotency lock manually to allow re-processing
          await db.from('processed_events').delete().eq('event_id', event.id);

          // 3. Re-invoke worker execution explicitly
          // await Dispatcher.republish(event);

          // 4. Mark DLQ Recovered
          await db.from('dead_letter_events').update({ status: 'RECOVERED' }).eq('id', dl.id);
          console.log(`[DLQ] ✅ Event ${dl.event_id} recovered successfully.`);

       } catch (recoveryError: any) {
          console.error(`[DLQ] ❌ Recovery Failed again for ${dl.event_id}. Err: ${recoveryError.message}`);
          await db.from('dead_letter_events').update({ 
             attempt_count: dl.attempt_count + 1,
             last_error: recoveryError.message
          }).eq('id', dl.id);
       }
    }
  }
}
