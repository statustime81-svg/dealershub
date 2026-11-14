import type { AppRole } from "@/types/auth";

export type Permission =
  | "business.manage"
  | "store.manage"
  | "catalog.manage"
  | "inventory.manage"
  | "dealers.manage"
  | "sales_team.manage"
  | "business_orders.manage"
  | "business_reports.view"
  | "authorized_stores.view"
  | "dealer_orders.create"
  | "dealer_orders.view"
  | "assigned_dealers.view"
  | "assigned_dealer_orders.create"
  | "assigned_dealer_orders.view"
  | "platform.manage";

const rolePermissions: Record<
  AppRole,
  readonly Permission[]
> = {
  business_admin: [
    "business.manage",
    "store.manage",
    "catalog.manage",
    "inventory.manage",
    "dealers.manage",
    "sales_team.manage",
    "business_orders.manage",
    "business_reports.view",
  ],

  dealer: [
    "authorized_stores.view",
    "dealer_orders.create",
    "dealer_orders.view",
  ],

  salesperson: [
    "assigned_dealers.view",
    "assigned_dealer_orders.create",
    "assigned_dealer_orders.view",
  ],

  super_admin: [
    "platform.manage",
  ],
};

export function hasPermission(
  role: AppRole | null | undefined,
  permission: Permission,
): boolean {
  if (!role) {
    return false;
  }

  return rolePermissions[role].includes(permission);
}