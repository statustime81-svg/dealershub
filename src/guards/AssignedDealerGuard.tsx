import { useEffect } from "react";
import { Link, Navigate, Outlet, useParams, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { routes } from "@/config/routes";
import { useBusiness } from "@/hooks/useBusiness";
import { useAssignedDealerWorkspace } from "@/features/salesperson/salesperson.hooks";
function DealerAssignmentCheck({ businessId, dealerId, requestedStore }: { businessId: string; dealerId: string; requestedStore: string | null }) {
  const workspace = useAssignedDealerWorkspace(businessId, dealerId);
  if (workspace.isPending) return <Spinner label="Checking dealer assignment" />;
  const invalidStore = Boolean(requestedStore && workspace.data && !workspace.data.stores.some((store) => store.id === requestedStore));
  if (workspace.isError || invalidStore) return <section className="space-y-4 p-5">
    <h1 className="text-xl font-bold">Dealer workspace unavailable</h1>
    <p role="alert" className="text-sm leading-6 text-muted">Check your current assignment, dealer store access and selected store.</p>
    <div className="flex flex-wrap gap-3"><Button variant="secondary" onClick={() => { void workspace.refetch(); }}>Try again</Button>
      <Link to={`${routes.salesperson.dealers}?businessId=${businessId}`} className="inline-flex min-h-11 items-center text-sm text-info">Assigned dealers</Link></div>
  </section>;
  return <Outlet />;
}
export function AssignedDealerGuard({ requireDealer = true }: { requireDealer?: boolean }) {
  const { memberships, activeBusinessId, isLoading, error, selectBusiness, refreshAccess } = useBusiness();
  const [params, setParams] = useSearchParams(); const { dealerId } = useParams();
  const requested = params.get("businessId");
  const available = memberships.filter((membership) => membership.role === "salesperson");
  const selected = requested ? available.find((membership) => membership.business_id === requested)
    : available.find((membership) => membership.business_id === activeBusinessId) ?? available[0];
  useEffect(() => {
    if (!selected || isLoading || error) return;
    if (activeBusinessId !== selected.business_id) selectBusiness(selected.business_id);
    if (!requested) {
      const next = new URLSearchParams(params); next.set("businessId", selected.business_id);
      setParams(next, { replace: true });
    }
  }, [selected, activeBusinessId, isLoading, error, requested, params, setParams, selectBusiness]);
  if (isLoading) return <Spinner label="Checking salesperson membership" />;
  if (error) return <section className="space-y-3 p-5"><p role="alert" className="text-sm text-danger">Business access could not load.</p>
    <Button onClick={() => { void refreshAccess().catch(() => {}); }}>Try again</Button></section>;
  if (!selected) return <Navigate to={routes.forbidden} replace />;
  if (activeBusinessId !== selected.business_id || !requested) return <Spinner label="Selecting business workspace" />;
  if (!requireDealer) return <Outlet />;
  if (!z.string().uuid().safeParse(dealerId).success) return <Navigate to={routes.forbidden} replace />;
  return <DealerAssignmentCheck key={`${selected.business_id}:${dealerId}`} businessId={selected.business_id} dealerId={dealerId!} requestedStore={params.get("storeId")} />;
}
