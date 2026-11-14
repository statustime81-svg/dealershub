import { Link,useParams } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { routes } from "@/config/routes";
import { formatCurrency,formatDateTime,formatNumber } from "@/lib/formatters";
import { usePlatformBusiness } from "../super-admin.hooks";
import { BusinessVerificationPanel } from "../components/BusinessVerificationPanel";
import { PlatformBusinessAudit } from "../components/PlatformBusinessAudit";
function BusinessDetail({businessId}:{businessId:string}){
  const result=usePlatformBusiness(businessId);
  if(result.isPending)return <Spinner label="Loading platform business details"/>;
  if(result.isError)return <div><p role="alert" className="text-sm text-danger">Business details unavailable or could not load.</p><Button className="mt-3" variant="secondary" onClick={()=>{void result.refetch();}}>Try again</Button></div>;
  const{business,metrics,subscription}=result.data;
  const fields:[string,string|null][]=[["Business type",business.businessType],["Category",business.categoryName],["Contact email",business.contactEmail],["Phone",business.phone],["GSTIN",business.gstin],["Owner",business.ownerName],["Owner email",business.ownerEmail],["Registered",formatDateTime(business.createdAt)]];
  const counts:[string,number][]=[["Stores",metrics.stores],["Active products",metrics.activeProducts],["Active dealer identities",metrics.activeDealers],["Active salespeople",metrics.activeSalespeople],["Orders",metrics.orders]];
  return <div className="space-y-6"><PageHeader title={business.companyName} description="Platform-level business review."
    actions={<Link to={routes.admin.businesses} className="inline-flex min-h-11 items-center text-sm font-medium text-info">All businesses</Link>}/>
    <div className="flex flex-wrap gap-2"><Badge variant={business.status==="active"?"success":"danger"}>{business.status}</Badge><Badge variant={business.verificationStatus==="verified"?"success":"neutral"}>{business.verificationStatus}</Badge></div>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{counts.map(([label,value])=><article key={label} className="rounded-xl border border-border bg-surface p-4"><h2 className="text-xs text-muted">{label}</h2><p className="mt-3 font-mono text-2xl font-semibold">{formatNumber(value)}</p></article>)}</section>
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-6"><section className="rounded-xl border border-border bg-surface p-5"><h2 className="text-lg font-semibold">Business information</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">{fields.map(([label,value])=><div key={label}><dt className="text-xs text-muted">{label}</dt><dd className="mt-1 break-words text-sm">{value||"—"}</dd></div>)}</dl>
        <h3 className="mt-5 text-xs text-muted">Address</h3><p className="mt-1 whitespace-pre-line text-sm">{business.address||"—"}</p>
      </section><PlatformBusinessAudit businessId={businessId}/></div>
      <aside className="space-y-5"><BusinessVerificationPanel key={`${business.id}:${business.updatedAt}`} business={business}/>
        <section className="rounded-xl border border-border bg-surface p-5"><h2 className="text-lg font-semibold">Subscription</h2>
          {subscription?<div className="mt-3 space-y-2 text-sm"><p>{subscription.planName}</p><Badge>{subscription.status}</Badge><p className="text-xs text-muted">Starts: {formatDateTime(subscription.startsAt)}</p><p className="text-xs text-muted">Ends: {subscription.endsAt?formatDateTime(subscription.endsAt):"Not specified"}</p></div>
            :<p className="mt-3 text-sm text-muted">No subscription assigned.</p>}
        </section><section className="rounded-xl border border-border bg-surface p-5"><h2 className="text-sm text-muted">Submitted order value</h2><p className="mt-2 font-mono text-xl font-semibold">{formatCurrency(metrics.submittedOrderValue)}</p><p className="mt-2 text-xs text-muted">All statuses; not collected revenue.</p></section>
      </aside>
    </div>
  </div>;
}
export default function BusinessDetailsPage(){
  const{businessId}=useParams();const result=z.string().uuid().safeParse(businessId);
  return result.success?<BusinessDetail key={result.data} businessId={result.data}/>:<EmptyState title="Invalid business link"/>;
}
