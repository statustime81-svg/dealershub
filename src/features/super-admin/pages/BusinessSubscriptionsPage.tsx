import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchInput } from "@/components/shared/SearchInput";
import { QueryState } from "@/components/shared/QueryState";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { useDebounce } from "@/hooks/useDebounce";
import { usePlatformBusinesses } from "../super-admin.hooks";
import { usePlatformSubscription } from "../configuration.hooks";
import { BusinessSubscriptionForm } from "../components/BusinessSubscriptionForm";
function SubscriptionEditor({businessId,name}:{businessId:string;name:string}){
 const q=usePlatformSubscription(businessId);
 return <section className="space-y-3"><h2 className="text-lg font-semibold">{name}</h2><QueryState pending={q.isPending} error={q.isError} retry={q.refetch}>{q.data!==undefined&&<BusinessSubscriptionForm key={`${businessId}:${q.data?.revision??'new'}`} businessId={businessId} current={q.data}/>}</QueryState></section>;
}
export default function BusinessSubscriptionsPage(){
 const[search,setSearch]=useState("");const[page,setPage]=useState(1);const[selected,setSelected]=useState<{id:string;name:string}|null>(null);const q=usePlatformBusinesses({search:useDebounce(search),page,status:"all",verification:"all",type:"all"});
 return <div className="space-y-6"><PageHeader title="Business subscriptions" description="Find a business and manage its current plan and subscription status."/>
 <SearchInput label="Search businesses" maxLength={200} value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/>
 <QueryState pending={q.isPending} error={q.isError} retry={q.refetch}>{q.data&&<><div className="grid gap-3 md:grid-cols-2">{q.data.items.map(b=><div key={b.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4"><span className="font-medium">{b.companyName}</span><Button size="sm" variant={selected?.id===b.id?"primary":"secondary"} onClick={()=>setSelected({id:b.id,name:b.companyName})}>Manage</Button></div>)}</div><Pagination page={page} total={q.data.total} busy={q.isFetching} onChange={setPage}/></>}</QueryState>
 {selected&&<SubscriptionEditor key={selected.id} businessId={selected.id} name={selected.name}/>}</div>;
}
