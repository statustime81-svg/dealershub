export type AppRole =
  | "super_admin"
  | "business_admin"
  | "dealer"
  | "salesperson";

export type BusinessType =
  | "manufacturer"
  | "distributor";

export type MembershipStatus =
  | "active"
  | "inactive";

export interface BusinessMembership {
  id: string;
  userId: string;
  businessId: string;
  role: "business_admin" | "salesperson";
  status: MembershipStatus;
}

export interface AccessContext {
  userId: string;

  role: AppRole;

  businessId: string | null;
}