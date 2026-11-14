export interface SalespersonMembership {
  id: string;

  business_id: string;
  user_id: string;

  role: "salesperson";
  status: "active" | "inactive";

  created_at: string;
}

export interface SalespersonDealerAssignment {
  id: string;

  business_id: string;
  salesperson_id: string;
  dealer_id: string;

  is_active: boolean;

  created_at: string;
}

export interface AssignedDealerSummary {
  assignment: SalespersonDealerAssignment;

  dealer: {
    user_id: string;
    company_name: string;
    contact_phone: string | null;
    address: string | null;
  };
}