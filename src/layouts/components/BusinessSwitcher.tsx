import { useId } from "react";
import { useNavigate } from "react-router-dom";
import { routes } from "@/config/routes";
import { useBusiness } from "@/hooks/useBusiness";
export function BusinessSwitcher({ onSwitch }: { onSwitch?: () => void }) {
  const id = useId(); const navigate = useNavigate();
  const { memberships, activeBusinessId, selectBusiness } = useBusiness();
  return <div><label htmlFor={id} className="mb-2 block text-xs font-medium text-slate-300">Business workspace</label>
    <select id={id} value={activeBusinessId ?? ""} onChange={(event) => {
      const businessId = event.target.value; const membership = memberships.find((item) => item.business_id === businessId);
      if (!membership) return;
      selectBusiness(businessId); onSwitch?.();
      navigate(membership.role === "business_admin" ? routes.manufacturer.dashboard : `${routes.salesperson.dealers}?businessId=${encodeURIComponent(businessId)}`);
    }} className="min-h-11 w-full rounded-lg border border-white/15 bg-midnight-raised px-3 py-2 text-sm text-white">
      {memberships.map((membership) => <option key={membership.id} value={membership.business_id}>{membership.business.company_name}</option>)}
    </select>
  </div>;
}
