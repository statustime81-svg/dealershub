import { useRef,useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Pagination } from "@/components/ui/Pagination";
import { QueryState } from "@/components/shared/QueryState";
import { SearchInput } from "@/components/shared/SearchInput";
import { useDebounce } from "@/hooks/useDebounce";
import { usePlatformPlans,useSaveConfiguration } from "../configuration.hooks";
import type { PlatformSubscription } from "../configuration.schemas";
function localDate(value:string|null|undefined){if(!value)return "";const d=new Date(value);return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);}
export function BusinessSubscriptionForm({businessId,current}:{businessId:string;current:PlatformSubscription|null}){
 const[id]=useState(()=>current?.id??crypto.randomUUID());const[selected,setSelected]=useState(current?.plan_id??"");const[search,setSearch]=useState("");const[page,setPage]=useState(1);const[error,setError]=useState("");const q=usePlatformPlans(useDebounce(search),page);const save=useSaveConfiguration();const req=useRef<{signature:string;key:string}|null>(null);
 return <form className="space-y-4 rounded-xl border border-border bg-surface p-5" onSubmit={e=>{
 e.preventDefault();if(save.isPending)return;const f=new FormData(e.currentTarget);const start=new Date(String(f.get("starts_at")));const endText=String(f.get("ends_at")??"");const end=endText?new Date(endText):null;
 if(!selected||!Number.isFinite(start.getTime())||(end&&(!Number.isFinite(end.getTime())||end<=start))){setError("Choose a plan and valid dates. End must be after start.");return;}
 setError("");const values={business_id:businessId,plan_id:selected,status:String(f.get("status")),starts_at:start.toISOString(),ends_at:end?.toISOString()??null};const signature=JSON.stringify(values);
 if(req.current?.signature!==signature)req.current={signature,key:crypto.randomUUID()};save.mutate({kind:"subscription",id,revision:current?.revision??null,requestKey:req.current.key,values});
 }}><h2 className="text-lg font-semibold">Business subscription</h2>
 <p className="text-xs leading-5 text-muted">Set the approved subscription manually. This does not charge the business or automatically suspend access. Dates use your browser's local timezone.</p>
 <SearchInput label="Find plan" maxLength={200} value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/>
 <p className="break-all text-xs text-muted">Selected plan ID: {selected||"None"}</p>
 <QueryState pending={q.isPending} error={q.isError} retry={q.refetch}>{q.data&&<><div className="flex flex-wrap gap-2">{q.data.items.map(p=><Button key={p.id} type="button" variant={selected===p.id?"primary":"secondary"} disabled={save.isPending||(!p.is_active&&p.id!==current?.plan_id)} onClick={()=>setSelected(p.id)}>{p.name}{p.is_active?"":" (inactive)"}</Button>)}</div><Pagination page={page} total={q.data.total} busy={q.isFetching} onChange={setPage}/></>}</QueryState>
 <fieldset disabled={save.isPending} className="grid gap-4 sm:grid-cols-3"><Select name="status" label="Status" defaultValue={current?.status??"trialing"}><option value="trialing">Trialing</option><option value="active">Active</option><option value="expired">Expired</option><option value="cancelled">Cancelled</option></Select><Input name="starts_at" label="Starts at" type="datetime-local" required defaultValue={localDate(current?.starts_at)}/><Input name="ends_at" label="Ends at (optional)" type="datetime-local" defaultValue={localDate(current?.ends_at)}/></fieldset>
 {(error||save.isError)&&<p role="alert" className="text-sm text-danger">{error||"Could not save. Refresh the subscription and review current values."}</p>}{save.isSuccess&&<p role="status" className="text-sm text-success">Subscription saved.</p>}
 <Button type="submit" disabled={!selected||q.isError} isLoading={save.isPending}>Save subscription</Button></form>;
}
