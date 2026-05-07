'use client';

import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useAuthStore } from '@/store/useAuthStore';
import type { UserRole } from '@/lib/types';
import { api } from '@/lib/api';

/**
 * ClerkSync — invisible component that syncs Clerk auth state
 * into the Zustand useAuthStore so all existing pages work without changes.
 */
export function ClerkSync() {
  const { user, isLoaded } = useUser();
  const setUser = useAuthStore((state) => state.setUser);
  const clearUser = useAuthStore((state) => state.clearUser);

  useEffect(() => {
    if (!isLoaded) return;

    if (user) {
      const role = (user.publicMetadata?.role as UserRole) || 'officer';
      
      const syncUser = async () => {
        let zone_id: string | null = null;
        if (role !== 'admin') {
          try {
            const res = await api.users.getZone(user.id);
            if (res.data?.zone_id) {
              zone_id = res.data.zone_id;
            }
          } catch (err) {
            console.error('Failed to fetch user zone:', err);
          }
        }

        setUser({
          id: user.id,
          name: user.fullName || user.username || user.primaryEmailAddress?.emailAddress || 'User',
          email: user.primaryEmailAddress?.emailAddress || '',
          role,
          zone_id,
        });
      };

      syncUser();
    } else {
      clearUser();
    }
  }, [user, isLoaded, setUser, clearUser]);

  return null;
}
