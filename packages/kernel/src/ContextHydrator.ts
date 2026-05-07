import { SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

export interface IdentityContext {
  userId: string;
  tenantId: string;
  role: string;
  email: string;
}

export interface KernelContext {
  traceId: string;
  timestamp: string;
  identity: IdentityContext;
  isShadow: boolean;
  // Encapsulated client scoping tenant headers
  db: SupabaseClient; 
}

export class ContextHydrator {
  static async build(
    req: Request, 
    supabase: SupabaseClient, 
    isShadow: boolean = false
  ): Promise<KernelContext> {
    
    // 1. Resolve Identity
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      throw new Error("Unauthorized: Identity resolution failed.");
    }
    
    // 2. Fetch specific tenant via safe RPC or indexed lookup
    const { data: profile } = await supabase
      .from('users')
      .select('agency_id, role')
      .eq('id', user.id)
      .single();

    if (!profile?.agency_id) {
       throw new Error("Unauthorized: Tenant missing.");
    }

    // 3. Inject trace correlation
    const traceId = req.headers.get('traceparent') || uuidv4();

    // 4. Return Immutable Context
    return {
      traceId,
      timestamp: new Date().toISOString(),
      isShadow,
      identity: {
        userId: user.id,
        tenantId: profile.agency_id,
        role: profile.role,
        email: user.email!
      },
      db: supabase
    };
  }
}
