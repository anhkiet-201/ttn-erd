'use client';

import { useAuthContext } from '@/components/auth/AuthProvider';

/**
 * useAuth hook (vỏ bọc cho useAuthContext)
 * Giúp thống nhất source of truth về auth state trên toàn app
 */
export function useAuth() {
  const { user, loading } = useAuthContext();
  return { user, loading };
}

