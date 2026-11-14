import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { PageHeader } from "@/components/shared/PageHeader";
import { OrderStatusBadge } from "@/components/commerce/OrderStatusBadge";
import { routes } from "@/config/routes";
import { formatNumber } from "@/lib/formatters";
import { usePlatformOverview } from "../super-admin.hooks";
import { PlatformMetrics } from "../components/PlatformMetrics";
export default function PlatformDashboardPage(){
  const overview=usePlatformOverview();
  return <div className="space-y-6"><PageHeader title="Platform overview" description="Registered businesses, users and submitted orders across DealersHub."
    actions={<div className="flex flex-wrap gap-2"><Link to={routes.admin.businesses} className="inline-flex min-h-11 items-center rounded-lg bg-lime px-4 text-sm font-semibold">Manage businesses</Link>
      <Link to={routes.admin.users} className="inline-flex min-h-11 items-center rounded-lg border border-border bg-surface px-4 text-sm font-medium">View users</Link></div>}/>
    {overview.isPending?<Spinner label="Loading platform overview"/>:overview.isError?<div><p role="alert" className="text-sm text-danger">Platform overview could not load. Check administrator access and connection.</p>
      <Button className="mt-3" variant="secondary" onClick={()=>{void overview.refetch();}}>Try again</Button></div>:<>
      <PlatformMetrics overview={overview.data}/>
      <section className="max-w-2xl rounded-xl border border-border bg-surface p-5"><h2 className="text-lg font-semibold">Order status distribution</h2>
        <dl className="mt-4 divide-y divide-border">{overview.data.orderStatuses.map(item=><div key={item.status} className="flex items-center justify-between gap-4 py-3">
          <dt><OrderStatusBadge status={item.status}/></dt><dd className="font-mono text-sm">{formatNumber(item.count)}</dd>
        </div>)}</dl>
      </section>
    </>}
  </div>;
}
