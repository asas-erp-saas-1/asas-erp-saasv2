import { enforceExecution } from '../enforcement/core';
import { createClient } from '@supabase/supabase-js';

export type KernelIdentity = {
  userId: string;
  tenantId: string;
  role: 'owner' | 'manager' | 'agent' | 'accountant';
  sessionId: string;
  deviceId: string;
};

type QueryOptions = {
  select?: string;
  filters?: Record<string, any>;
  limit?: number;
  orderBy?: { column: string; ascending?: boolean };
};

export interface IKernel {
  identity(): Promise<KernelIdentity>;
  query<T>(tableName: string, options?: QueryOptions): Promise<T[]>;
  mutate<T>(
    tableName: string, 
    action: 'INSERT' | 'UPDATE' | 'DELETE', 
    data: any, 
    match?: Record<string, any>
  ): Promise<T>;
  transaction<T>(
    callback: (txKernel: Omit<IKernel, 'transaction'>) => Promise<T>
  ): Promise<T>;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

const kernelCore: IKernel = {
  identity: async (): Promise<KernelIdentity> => {
    return {
      userId: 'system',
      tenantId: 'default-tenant',
      role: 'owner',
      sessionId: 'system',
      deviceId: 'server'
    };
  },
  query: async <T>(tableName: string, options?: QueryOptions): Promise<T[]> => {
    let q = supabase.from(tableName).select(options?.select || '*');
    if (options?.filters) {
      for (const [k, v] of Object.entries(options.filters)) {
        q = q.eq(k, v);
      }
    }
    if (options?.orderBy) {
      q = q.order(options.orderBy.column, { ascending: options.orderBy.ascending });
    }
    if (options?.limit) {
      q = q.limit(options.limit);
    }
    const { data, error } = await q;
    if (error) throw new Error(`Query failed on ${tableName}: ${error.message}`);
    return data as T[];
  },
  mutate: async <T>(
    tableName: string, 
    action: 'INSERT' | 'UPDATE' | 'DELETE', 
    data: any, 
    match?: Record<string, any>
  ): Promise<T> => {
    let q = supabase.from(tableName);
    let result;
    
    if (action === 'INSERT') {
      result = await q.insert(data).select().single();
    } else if (action === 'UPDATE') {
      let u = q.update(data);
      if (match) {
        for (const [k, v] of Object.entries(match)) u = u.eq(k, v);
      }
      result = await u.select().single();
    } else if (action === 'DELETE') {
      let d = q.delete();
      if (match) {
        for (const [k, v] of Object.entries(match)) d = d.eq(k, v);
      }
      result = await d.select().single();
    }
    
    if (result?.error) throw new Error(`Mutation ${action} failed on ${tableName}: ${result.error.message}`);
    return result?.data as T;
  },
  transaction: async <T>(
    callback: (txKernel: Omit<IKernel, 'transaction'>) => Promise<T>
  ): Promise<T> => {
    // Supabase JS doesn't have true transactions over REST, so we run sequentially.
    return callback(kernelCore);
  }
};

export const kernel = enforceExecution(kernelCore);
