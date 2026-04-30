'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSystemContext } from '@/lib/system-context';
import type { Profile, UserRole } from '@/types/app';

// Mock types to replace @supabase/supabase-js Session and User requirements
type MockSession = { access_token: string };
type MockUser = { id: string; email: string };

type AuthContextType = {
  session:     MockSession | null;
  user:        MockUser | null;
  profile:     Profile | null;
  agencyId:    string | null;
  loading:     boolean;
  signOut:     () => Promise<void>;
};

// No-op AuthProvider to not break imports
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

export const useAuth = (): AuthContextType => {
  const sysCtx = getSystemContext();

  const mockUser: MockUser = {
    id: sysCtx.userId,
    email: 'system.admin@asas-re-os.local',
  };

  const mockSession: MockSession = {
    access_token: 'system-token',
  };

  const mockProfile: Profile = {
    id: sysCtx.userId,
    agency_id: sysCtx.organizationId,
    role: sysCtx.role as UserRole,
    is_active: true,
    full_name: 'System Administrator',
    email: 'system.admin@asas-re-os.local',
    phone: null,
    avatar_url: null,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z'
  };

  return {
    session: mockSession,
    user: mockUser,
    profile: mockProfile,
    agencyId: mockProfile.agency_id ?? null,
    loading: false,
    signOut: async () => { console.log('[ASAS] Action disabled in System Fallback mode'); }
  };
};

