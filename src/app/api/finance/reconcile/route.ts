// src/app/api/finance/reconcile/route.ts
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { resolvePermissionContext, createPermissionService, PermissionDeniedError } from '@/lib/permissions';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    // 1. Resolve Context (Server-Side identity + Database Role lookup)
    const ctx = await resolvePermissionContext(supabase);

    // 2. Initialize Permission Service (Includes Automatic Logging)
    const permissions = createPermissionService(supabase, ctx, {
      ipAddress: req.headers.get('x-forwarded-for') ?? 'unknown',
      userAgent: req.headers.get('user-agent') ?? 'unknown',
    });

    // 3. Enforce Server-Side Logic (Throws if invalid)
    await permissions.enforce('finance.reconcile');

    // --- SENSITIVE BUSINESS LOGIC HERE ---
    return NextResponse.json({ success: true, message: 'Finance reconciled securely.' });

  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
