'use client';

/**
 * RoleGate — RBAC Component
 * 
 * Conditionally renders children based on user role.
 * Member 5 can extend this with more granular permissions.
 * 
 * Usage:
 *   <RoleGate allowed={['admin']}>
 *     <button>Delete Zone</button>
 *   </RoleGate>
 */

import type { UserRole } from '@/lib/types';

interface RoleGateProps {
  children: React.ReactNode;
  allowed: UserRole[];
  fallback?: React.ReactNode;
}

import { useAuthStore } from '@/store/useAuthStore';

// TODO: Replace with real session role from Keycloak when A4 integrates
function useCurrentRole(): UserRole {
  // Read role from Zustand store
  const user = useAuthStore((state) => state.user);
  return user?.role || 'admin'; // Fallback to admin for dev until SSO is ready
}

export default function RoleGate({ children, allowed, fallback = null }: RoleGateProps) {
  const role = useCurrentRole();

  if (!allowed.includes(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export { useCurrentRole };
