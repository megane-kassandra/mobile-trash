import type { Href } from 'expo-router';

import type { UserRole } from '@/types/models';

export const PUBLIC_REGISTRATION_ROLES: readonly UserRole[] = ['CLIENT', 'COLLECTEUR'];

export function getRoleHomeRoute(role: UserRole): Href {
  switch (role) {
    case 'CLIENT':
      return '/client/dashboard';
    case 'COLLECTEUR':
      return '/collector/dashboard';
    case 'ADMIN':
      return '/admin/dashboard';
  }
}

export function canAccessRole(actualRole: UserRole, allowedRoles: readonly UserRole[]): boolean {
  return allowedRoles.includes(actualRole);
}

export function getRoleLabel(role: UserRole): string {
  switch (role) {
    case 'CLIENT':
      return 'Client';
    case 'COLLECTEUR':
      return 'Éboueur';
    case 'ADMIN':
      return 'Administrateur';
  }
}
