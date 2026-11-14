import type { BusinessType } from "./auth";

export type BusinessStatus =
  | "active"
  | "suspended";

export type VerificationStatus =
  | "unverified"
  | "verified";

export interface Business {
  id: string;
  owner_id: string;

  business_type: BusinessType;
  category_id: string | null;

  company_name: string;
  logo_path: string | null;

  contact_email: string;
  contact_phone: string | null;
  address: string | null;
  gstin: string | null;

  status: BusinessStatus;
  verification_status: VerificationStatus;

  created_at: string;
  updated_at: string;
}

export interface Store {
  id: string;
  business_id: string;

  name: string;
  slug: string;
  description: string | null;

  is_published: boolean;

  created_at: string;
  updated_at: string;
}

export interface BusinessCategory {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: string;
}