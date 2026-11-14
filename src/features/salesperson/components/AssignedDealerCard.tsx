import { Link } from "react-router-dom";
import { routes } from "@/config/routes";
import type { AssignedDealer } from "../salesperson.schemas";
export function AssignedDealerCard({ dealer, businessId }: { dealer: AssignedDealer; businessId: string }) {
  return <article className="flex flex-col rounded-xl border border-border bg-surface p-5">
    <h2 className="text-lg font-semibold">{dealer.companyName}</h2>
    <p className="mt-2 text-sm text-muted">{dealer.phone || "No phone provided"}</p>
    {dealer.address && <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{dealer.address}</p>}
    <p className="mt-3 text-xs text-muted">{dealer.storeCount} authorized {dealer.storeCount === 1 ? "store" : "stores"}</p>
    <Link to={`${routes.salesperson.dealers}/${encodeURIComponent(dealer.dealerId)}?businessId=${encodeURIComponent(businessId)}`}
      className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-lime px-4 text-sm font-semibold">Open dealer workspace</Link>
  </article>;
}
