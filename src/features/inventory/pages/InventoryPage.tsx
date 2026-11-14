import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useBusiness } from "@/hooks/useBusiness";
import { useDebounce } from "@/hooks/useDebounce";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchInput } from "@/components/shared/SearchInput";
import { QueryState } from "@/components/shared/QueryState";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { getInventory } from "../inventory.api";
import type { InventoryRow } from "../inventory.schemas";
import { StockAvailabilityForm } from "../components/StockAvailabilityForm";
function InventoryWorkspace({businessId}:{businessId:string}){
 const{user}=useAuth();const[search,setSearch]=useState("");const[page,setPage]=useState(1);const[selected,setSelected]=useState<InventoryRow|null>(null);const debounced=useDebounce(search);
 const q=useQuery({queryKey:["user",user?.id,"business",businessId,"inventory",debounced,page],queryFn:({signal})=>getInventory(businessId,debounced,page,signal)});
 return <div className="space-y-4"><SearchInput label="Search product, variant or SKU" maxLength={200} value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/>
 {selected&&<StockAvailabilityForm key={`${selected.id}:${selected.updated_at}`} row={selected} onClose={()=>setSelected(null)}/>}
 <QueryState pending={q.isPending} error={q.isError} retry={q.refetch}>{q.data&&<><div className="overflow-x-auto rounded-xl border border-border bg-surface"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-soft text-xs"><tr>{['Product / variant','Store','SKU','Stock','Availability','Action'].map(s=><th key={s} className="px-4 py-3">{s}</th>)}</tr></thead><tbody>{q.data.items.map(r=><tr key={r.id} className="border-t border-border"><td className="px-4 py-3"><p className="font-medium">{r.product_name}</p><p className="text-xs text-muted">{r.name}{r.is_active?'':' · inactive'}</p></td><td className="px-4 py-3">{r.store_name}</td><td className="px-4 py-3 font-mono text-xs">{r.sku??'—'}</td><td className="px-4 py-3 font-mono">{r.stock_quantity??'Not tracked'}</td><td className="px-4 py-3">{r.availability.replaceAll('_',' ')}</td><td className="px-4 py-3"><Button size="sm" variant="secondary" onClick={()=>setSelected(r)}>Update</Button></td></tr>)}</tbody></table></div>{!q.data.total&&<p className="text-sm text-muted">No matching variants found.</p>}<Pagination page={page} total={q.data.total} busy={q.isFetching} onChange={setPage}/></>}</QueryState></div>;
}
export default function InventoryPage(){const{activeBusinessId}=useBusiness();return <div className="space-y-6"><PageHeader title="Inventory" description="Manage variant stock and availability for your business."/>{activeBusinessId&&<InventoryWorkspace key={activeBusinessId} businessId={activeBusinessId}/>}</div>;}
