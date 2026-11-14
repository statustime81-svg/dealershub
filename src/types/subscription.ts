export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "expired"
  | "cancelled";

export type BillingInterval =
  | "month"
  | "year"
  | "custom";

export interface SubscriptionPlan {
  id: string;

  name: string;
  slug: string;
  description: string | null;

  price_amount: number | null;
  currency: string;

  billing_interval: BillingInterval | null;

  max_products: number | null;
  max_dealers: number | null;
  max_salespeople: number | null;
  max_stores: number | null;
  max_storage_bytes: number | null;

  is_active: boolean;

  created_at: string;
  updated_at: string;
}

export interface BusinessSubscription {
  id: string;

  business_id: string;
  plan_id: string;

  status: SubscriptionStatus;

  starts_at: string;
  ends_at: string | null;

  created_at: string;
  updated_at: string;
}