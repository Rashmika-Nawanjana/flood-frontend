<<<<<<< HEAD
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
=======
"use client";

import type { UserRole } from "@/lib/types";
import { useUser } from "@clerk/nextjs";
>>>>>>> origin/main

interface RoleGateProps {
  children: React.ReactNode;
  allowed: UserRole[];
  fallback?: React.ReactNode;
}

<<<<<<< HEAD
import { useAuthStore } from '@/store/useAuthStore';

// TODO: Replace with real session role from Keycloak when A4 integrates
function useCurrentRole(): UserRole {
  // Read role from Zustand store
  const user = useAuthStore((state) => state.user);
  return user?.role || 'admin'; // Fallback to admin for dev until SSO is ready
}

export default function RoleGate({ children, allowed, fallback = null }: RoleGateProps) {
=======
export function useCurrentRole(): UserRole {
  const { user } = useUser();
  return (user?.publicMetadata?.role as UserRole) || "officer";
}

export default function RoleGate({
  children,
  allowed,
  fallback = null,
}: RoleGateProps) {
>>>>>>> origin/main
  const role = useCurrentRole();

  if (!allowed.includes(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
<<<<<<< HEAD

export { useCurrentRole };
=======
>>>>>>> origin/main
