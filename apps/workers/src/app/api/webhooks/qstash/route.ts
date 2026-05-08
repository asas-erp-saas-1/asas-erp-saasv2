import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function POST(req: Request) {
  // 1. Verify QStash Signature (Implementation omitted for brevity)
  
  const event = await req.json();

  // Initialize DB Service Role strictly to manage idempotency locks
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const db = createServerClient(supabaseUrl, supabaseKey, { 
    cookies: {
      getAll() { return []; },
    }
  });

  // 2. Obtain Idempotency Lock
  const { error: lockError } = await db
    .from('processed_events')
    .insert({ event_id: event.id, worker_name: 'WebhookNotifierAggregator' });

  // 23505 is PostgreSQL Unique Violation Error
  if (lockError?.code === '23505') {
    return NextResponse.json({ message: 'Already Processed' }, { status: 200 });
  }

  // 3. Execute Worker Logic
  try {
     if (event.type === 'DEAL_STAGE_CHANGED') {
       // e.g. Send an Email, Sync with Hubspot, etc.
       console.log(`[WORKER] Syncing Deal ${event.aggregateId} to Hubspot. Stage: ${event.payload.to}`);
     }

     // 4. Mark Outbox Processed
     await db.from('outbox_events').update({ status: 'PROCESSED' }).eq('id', event.id);
     
     return NextResponse.json({ success: true });
  } catch (error: any) {
     // Do NOT release lock! If it failed due to an external 5xx, we let QStash automatically retry
     // so we can resume.
     console.error(`[WORKER FAILED] ${error.message}`);
     
     // 5. Send to dead letter processing
     await db.from('dead_letter_events').insert({ event_id: event.id, error_payload: error.message });
     
     // Returning 500 triggers QStash exponential backoff retry
     return NextResponse.json({ success: false }, { status: 500 });
  }
}
