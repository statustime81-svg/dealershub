export type DealerAccessStatus =
  | "pending"
  | "active"
  | "rejected"
  | "inactive";

export interface DealerProfile {
  user_id: string;

  company_name: string;
  contact_phone: string | null;
  address: string | null;
  gstin: string | null;

  created_at: string;
  updated_at: string;
}

export interface DealerStoreAccess {
  id: string;

  business_id: string;
  store_id: string;
  dealer_id: string;

  status: DealerAccessStatus;

  created_at: string;
  updated_at: string;
}

export type InvitationStatus =
  | "pending"
  | "accepted"
  | "revoked"
  | "expired";

export interface AccountInvitation {
  id: string;

  business_id: string;
  store_id: string | null;

  email: string;

  target_role: "dealer" | "salesperson";

  invited_user_id: string | null;
  invited_by: string;

  status: InvitationStatus;

  expires_at: string;
  created_at: string;
}