import type { AppRole } from "@/types/auth";
import type { Permission } from "./permissions";

import { routes } from "./routes";

export type NavigationIcon =
  | "dashboard"
  | "business"
  | "store"
  | "products"
  | "inventory"
  | "orders"
  | "dealers"
  | "sales-team"
  | "reports"
  | "categories"
  | "brands"
  | "plans"
  | "subscriptions"
  | "users"
  | "profile";

export interface NavigationItem {
  label: string;
  href: string;
  icon: NavigationIcon;
  permission?: Permission;
}

export const navigation: Record<
  AppRole,
  readonly NavigationItem[]
> = {
  business_admin: [
    {
      label: "Dashboard",
      href: routes.manufacturer.dashboard,
      icon: "dashboard",
      permission: "business_reports.view",
    },
    {
      label: "Storefront",
      href: routes.manufacturer.store,
      icon: "store",
      permission: "store.manage",
    },
    {
      label: "Products",
      href: routes.manufacturer.products,
      icon: "products",
      permission: "catalog.manage",
    },
    {
      label: "Inventory",
      href: routes.manufacturer.inventory,
      icon: "inventory",
      permission: "inventory.manage",
    },
    {
      label: "Orders",
      href: routes.manufacturer.orders,
      icon: "orders",
      permission: "business_orders.manage",
    },
    {
      label: "Dealers",
      href: routes.manufacturer.dealers,
      icon: "dealers",
      permission: "dealers.manage",
    },
    {
      label: "Sales team",
      href: routes.manufacturer.salesTeam,
      icon: "sales-team",
      permission: "sales_team.manage",
    },
    {
      label: "Reports",
      href: routes.manufacturer.reports,
      icon: "reports",
      permission: "business_reports.view",
    },
    {
      label: "Business settings",
      href: routes.manufacturer.business,
      icon: "business",
      permission: "business.manage",
    },
  ],

  dealer: [
    {
      label: "Stores",
      href: routes.dealer.stores,
      icon: "store",
      permission: "authorized_stores.view",
    },
    {
      label: "My orders",
      href: routes.dealer.orders,
      icon: "orders",
      permission: "dealer_orders.view",
    },
    {
      label: "Profile",
      href: routes.dealer.profile,
      icon: "profile",
    },
  ],

  salesperson: [
    {
      label: "Assigned dealers",
      href: routes.salesperson.dealers,
      icon: "dealers",
      permission: "assigned_dealers.view",
    },
    {
      label: "Order history",
      href: routes.salesperson.orders,
      icon: "orders",
      permission: "assigned_dealer_orders.view",
    },
  ],

  super_admin: [
    {
      label: "Platform overview",
      href: routes.admin.dashboard,
      icon: "dashboard",
      permission: "platform.manage",
    },
    {
      label: "Businesses",
      href: routes.admin.businesses,
      icon: "business",
      permission: "platform.manage",
    },
    {
      label: "Users",
      href: routes.admin.users,
      icon: "users",
      permission: "platform.manage",
    },
    {
      label: "Categories",
      href: routes.admin.categories,
      icon: "categories",
      permission: "platform.manage",
    },
    {
      label: "Brands",
      href: routes.admin.brands,
      icon: "brands",
      permission: "platform.manage",
    },
    {
      label: "Plans",
      href: routes.admin.plans,
      icon: "plans",
      permission: "platform.manage",
    },
    {
      label: "Subscriptions",
      href: routes.admin.subscriptions,
      icon: "subscriptions",
      permission: "platform.manage",
    },
    {
      label: "Reports",
      href: routes.admin.reports,
      icon: "reports",
      permission: "platform.manage",
    },
  ],
};