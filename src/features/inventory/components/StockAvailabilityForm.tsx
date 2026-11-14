import { useMutation,useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { useBusiness } from "@/hooks/useBusiness";
import { updateStock } from "../inventory.api";
import { availabilitySchema,type InventoryRow } from "../inventory.schemas";
export function StockAvailabilityForm({row,onClose}:{row:InventoryRow;onClose:()=>void}){
 const cache=useQueryClient();const{user}=useAuth();const{activeBusinessId}=useBusiness();const mutation=useMutation({mutationFn:updateStock,retry:false,onSuccess:async()=>{await cache.invalidateQueries({queryKey:["user",user?.id,"business",activeBusinessId]});onClose();},onError:async()=>{await cache.invalidateQueries({queryKey:["user",user?.id,"business",activeBusinessId,"inventory"]});}});
 return <form className="space-y-4 rounded-xl border border-border bg-surface p-5" onSubmit={e=>{
 e.preventDefault();if(mutation.isPending)return;const f=new FormData(e.currentTarget);const text=String(f.get("quantity")??"").trim();const availability=availabilitySchema.parse(f.get("availability"));mutation.mutate({variantId:row.id,expectedUpdatedAt:row.updated_at,quantity:text===""?null:Number(text),availability});
 }}><h2 className="text-lg font-semibold">{row.product_name} · {row.name}</h2><p className="text-xs leading-5 text-muted">Edit recorded stock and availability manually. Blank quantity means stock is not tracked numerically. This does not change automatic order-stock rules.</p><fieldset disabled={mutation.isPending} className="grid gap-3 sm:grid-cols-2"><Input label="Stock quantity" name="quantity" type="number" min="0" max="2147483647" step="1" defaultValue={row.stock_quantity??""}/><Select name="availability" label="Availability" defaultValue={row.availability}>{availabilitySchema.options.map(v=><option key={v} value={v}>{v.replaceAll('_',' ')}</option>)}</Select></fieldset>
 {mutation.isError&&<p role="alert" className="text-sm text-danger">Stock changed or could not save. Close and reopen the refreshed record.</p>}<div className="flex gap-2"><Button type="submit" isLoading={mutation.isPending}>Save availability</Button><Button variant="secondary" disabled={mutation.isPending} onClick={onClose}>Close</Button></div></form>;
}
