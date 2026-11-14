import {
  hasPermission,
  type Permission,
} from "@/config/permissions";

import type { AppRole } from "@/types/auth";

export function usePermissions(
  role: AppRole | null | undefined,
) {
  function can(permission: Permission): boolean {
    return hasPermission(role, permission);
  }

  function canAny(
    permissions: readonly Permission[],
  ): boolean {
    return permissions.some(can);
  }

  function canAll(
    permissions: readonly Permission[],
  ): boolean {
    return permissions.every(can);
  }

  return {
    role: role ?? null,
    can,
    canAny,
    canAll,
  };
}