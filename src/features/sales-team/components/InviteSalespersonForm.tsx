import { ManagedAccountForm } from "@/features/auth/components/ManagedAccountForm";
export function InviteSalespersonForm({businessId}:{businessId:string}) { return <ManagedAccountForm key={businessId} businessId={businessId} role="salesperson"/>; }
