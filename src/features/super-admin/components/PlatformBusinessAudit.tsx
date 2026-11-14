import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { formatDateTime } from "@/lib/formatters";
import { usePlatformBusinessAudit } from "../super-admin.hooks";
export function PlatformBusinessAudit({businessId}:{businessId:string}){
  const audit=usePlatformBusinessAudit(businessId);
  return <section className="space-y-4 rounded-xl border border-border bg-surface p-5">
    <h2 className="text-lg font-semibold">Recent platform actions</h2><p className="text-xs text-muted">Latest 20 access/verification actions. Notes are platform-admin only.</p>
    {audit.isPending?<Spinner label="Loading business audit"/>:audit.isError?<div><p role="alert" className="text-sm text-danger">Audit history could not load.</p>
      <Button className="mt-3" variant="secondary" onClick={()=>{void audit.refetch();}}>Try again</Button></div>:audit.data.length?
      <ol className="space-y-4">{audit.data.map(action=><li key={action.id} className="rounded-lg border border-border p-4">
        <p className="text-sm font-medium">{action.actorName||"Platform administrator"}</p><p className="mt-1 text-xs text-muted">{formatDateTime(action.createdAt)}</p>
        <p className="mt-2 text-xs">Status: {action.before.status} → {action.after.status}</p>
        <p className="mt-1 text-xs">Verification: {action.before.verificationStatus} → {action.after.verificationStatus}</p>
        {action.note&&<p className="mt-3 whitespace-pre-line text-sm leading-6">{action.note}</p>}
      </li>)}</ol>:<p className="text-sm text-muted">No platform actions recorded yet.</p>}
  </section>;
}
