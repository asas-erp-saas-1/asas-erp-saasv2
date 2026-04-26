// src/app/api/finance/reconcile/route.ts
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { resolvePermissionContext, createPermissionService, PermissionDeniedError } from '@/lib/permissions';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch (error) {
              // Ignore in context of server component/next.js middleware
            }
          },
        },
      }
    );

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
