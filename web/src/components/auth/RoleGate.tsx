"use client";

import type { UserRole } from "@/lib/types";
import { useUser } from "@clerk/nextjs";

interface RoleGateProps {
  children: React.ReactNode;
  allowed: UserRole[];
  fallback?: React.ReactNode;
}

export function useCurrentRole(): UserRole {
  const { user } = useUser();
  return (user?.publicMetadata?.role as UserRole) || "citizen";
}

export default function RoleGate({
  children,
  allowed,
  fallback = null,
}: RoleGateProps) {
  const role = useCurrentRole();

  if (!allowed.includes(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
