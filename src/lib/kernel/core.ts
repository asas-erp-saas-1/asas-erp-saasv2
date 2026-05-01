import { enforceExecution } from '../enforcement/core';

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

const kernelCore: IKernel = {
  identity: async (): Promise<KernelIdentity> => {
    // Mock identity for compilation
    return {
      userId: 'mock-user-id',
      tenantId: 'mock-tenant-id',
      role: 'owner',
      sessionId: 'mock-session-id',
      deviceId: 'mock-device-id'
    };
  },
  query: async <T>(tableName: string, options?: QueryOptions): Promise<T[]> => {
    return [];
  },
  mutate: async <T>(
    tableName: string, 
    action: 'INSERT' | 'UPDATE' | 'DELETE', 
    data: any, 
    match?: Record<string, any>
  ): Promise<T> => {
    return data as T;
  },
  transaction: async <T>(
    callback: (txKernel: Omit<IKernel, 'transaction'>) => Promise<T>
  ): Promise<T> => {
    return callback(kernelCore);
  }
};

export const kernel = enforceExecution(kernelCore);
