import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/Badge";
import { routeBuilders } from "@/config/routes";
import { formatDateTime } from "@/lib/formatters";
import type { PlatformBusinessRow } from "../super-admin.schemas";
export function BusinessesTable({businesses}:{businesses:PlatformBusinessRow[]}){
  return <div className="overflow-x-auto rounded-xl border border-border bg-surface"><table className="w-full min-w-[900px] text-left text-sm">
    <caption className="sr-only">Registered platform businesses</caption><thead className="bg-soft text-xs text-muted"><tr>
      {["Business","Type","Owner","Status","Verification","Registered"].map(label=><th key={label} scope="col" className="px-4 py-3">{label}</th>)}
    </tr></thead><tbody className="divide-y divide-border">{businesses.map(business=><tr key={business.id} className="hover:bg-soft/50">
      <td className="px-4 py-3"><Link to={routeBuilders.adminBusiness(business.id)} className="font-medium hover:underline">{business.companyName}</Link><p className="mt-1 text-xs text-muted">{business.contactEmail}</p></td>
      <td className="px-4 py-3">{business.businessType=== "manufacturer"?"Manufacturer":"Distributor"}</td>
      <td className="px-4 py-3">{business.ownerName||"—"}</td>
      <td className="px-4 py-3"><Badge variant={business.status==="active"?"success":"danger"}>{business.status}</Badge></td>
      <td className="px-4 py-3"><Badge variant={business.verificationStatus==="verified"?"success":"neutral"}>{business.verificationStatus}</Badge></td>
      <td className="px-4 py-3 text-xs">{formatDateTime(business.createdAt)}</td>
    </tr>)}</tbody>
  </table></div>;
}
