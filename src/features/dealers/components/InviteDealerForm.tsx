import { ManagedAccountForm } from "@/features/auth/components/ManagedAccountForm";
export function InviteDealerForm({businessId,storeId}:{businessId:string;storeId:string}) { return <ManagedAccountForm key={`${businessId}:${storeId}`} businessId={businessId} storeId={storeId} role="dealer"/>; }
