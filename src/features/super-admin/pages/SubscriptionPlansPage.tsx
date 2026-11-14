import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { QueryState } from "@/components/shared/QueryState";
import { SearchInput } from "@/components/shared/SearchInput";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { useDebounce } from "@/hooks/useDebounce";
import { usePlatformPlans } from "../configuration.hooks";
import type { PlatformPlan } from "../configuration.schemas";
import { SubscriptionPlanForm } from "../components/SubscriptionPlanForm";
export default function SubscriptionPlansPage(){
 const[search,setSearch]=useState("");const[page,setPage]=useState(1);const[editor,setEditor]=useState<PlatformPlan|"new"|null>(null);const q=usePlatformPlans(useDebounce(search),page);
 return <div className="space-y-6"><PageHeader title="Subscription plans" description="Configure approved plans, prices and limits."/>
 <div className="flex flex-wrap items-end gap-3"><SearchInput label="Search plans" value={search} maxLength={200} onChange={e=>{setSearch(e.target.value);setPage(1);}}/><Button onClick={()=>setEditor("new")}>Add plan</Button></div>
 {editor&&<SubscriptionPlanForm key={editor==="new"?"new":`${editor.id}:${editor.revision}`} plan={editor==="new"?undefined:editor} onClose={()=>setEditor(null)}/>}
 <QueryState pending={q.isPending} error={q.isError} retry={q.refetch}>{q.data&&<><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{q.data.items.map(p=><article key={p.id} className="rounded-xl border border-border bg-surface p-5"><div className="flex justify-between gap-3"><h2 className="text-lg font-semibold">{p.name}</h2><span className="text-xs text-muted">{p.is_active?"Active":"Inactive"}</span></div><p className="mt-2 text-sm text-muted">{p.description}</p><p className="mt-4 font-mono text-xl font-semibold">{p.price_amount===null?"Price not configured":`${p.currency} ${p.price_amount.toLocaleString('en-IN',{minimumFractionDigits:2})}`}<span className="text-xs font-normal"> {p.billing_interval?`/ ${p.billing_interval}`:""}</span></p>
 <dl className="my-4 grid grid-cols-2 gap-2 text-xs">{[['Products',p.max_products],['Dealers',p.max_dealers],['Salespeople',p.max_salespeople],['Stores',p.max_stores],['Storage bytes',p.max_storage_bytes]].map(([label,value])=><div key={String(label)}><dt className="text-muted">{label}</dt><dd className="font-mono">{value??"Unspecified"}</dd></div>)}</dl><Button size="sm" variant="secondary" onClick={()=>setEditor(p)}>Edit plan</Button></article>)}</div>{!q.data.total&&<p className="text-sm text-muted">No plans configured. Add only approved plan details.</p>}<Pagination page={page} total={q.data.total} busy={q.isFetching} onChange={setPage}/></>}</QueryState></div>;
}
