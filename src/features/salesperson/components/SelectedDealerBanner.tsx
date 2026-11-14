import { Link } from "react-router-dom";
import { ArrowLeftRight } from "lucide-react";
import { routes } from "@/config/routes";
import type { DealerWorkspace } from "../salesperson.schemas";
export function SelectedDealerBanner({ dealer, businessId }: { dealer: DealerWorkspace; businessId: string }) {
  return <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
    <div className="min-w-0"><p className="text-xs text-muted">Dealer workspace</p>
      <h1 className="mt-1 break-words text-xl font-semibold tracking-tight">{dealer.companyName}</h1>
    </div>
    <Link to={`${routes.salesperson.dealers}?businessId=${encodeURIComponent(businessId)}`}
      className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-xs font-medium transition-colors hover:border-lime-hover hover:bg-soft">
      <ArrowLeftRight size={15} aria-hidden="true"/>Change dealer
    </Link>
  </div>;
}
