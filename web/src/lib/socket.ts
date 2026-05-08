import type { UserRole } from './types';

export type SocketNamespace = '/admin' | '/officer' | '/public';

export function normalizeSocketUrl(rawUrl: string) {
  try {
    const url = new URL(rawUrl);
    url.pathname = url.pathname.replace(/\/(?:ws\/live|public|officer|admin)\/?$/, '') || '/';
    return url.toString().replace(/\/$/, '');
  } catch {
    return rawUrl;
  }
}

export function isValidSocketNamespace(value: string): value is SocketNamespace {
  return value === '/admin' || value === '/officer' || value === '/public';
}

export function getNamespaceForRole(role?: UserRole): SocketNamespace {
  if (role === 'admin') return '/admin';
  if (role === 'officer') return '/officer';
  return '/public';
}

export function getDefaultSocketNamespace(
  role?: UserRole,
  envNamespace?: string,
): SocketNamespace {
  if (envNamespace && isValidSocketNamespace(envNamespace)) {
    return envNamespace;
  }
  return getNamespaceForRole(role);
}

export function buildSocketUrl(rawUrl: string, namespace: SocketNamespace) {
  return `${normalizeSocketUrl(rawUrl)}${namespace}`;
}
