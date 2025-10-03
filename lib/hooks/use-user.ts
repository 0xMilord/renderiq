'use client';

import { useAuthStore } from '@/lib/stores/auth-store';

export function useUser() {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  
  return { user, loading };
}
