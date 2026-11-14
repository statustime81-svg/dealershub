import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";
import { getSupabaseClient } from "@/lib/supabase/client";
const rowSchema = z.object({id:z.string().uuid(),name:z.string(),revision:z.number().int()});
type Row = z.infer<typeof rowSchema>;
export function BusinessCategoryManager({businessId,storeId}:{businessId:string;storeId:string}) {
  const {user} = useAuth(); const cache = useQueryClient();
  const [editing,setEditing] = useState<Row | null>(null);
  const [name,setName] = useState(""); const [creating,setCreating] = useState(false);
  const [confirm,setConfirm] = useState<Row | null>(null);
  const [requestId,setRequestId] = useState(()=>crypto.randomUUID());
  const query = useQuery({queryKey:["user",user?.id,"business",businessId,"owned-categories"], enabled:Boolean(user),queryFn:async()=>{
    const {data,error}=await getSupabaseClient().rpc("get_business_categories_owned",{p_business_id:businessId});
    if(error)throw error; return z.array(rowSchema).parse(data);
  }});
  const mutation = useMutation({mutationFn:async(action:"save"|"delete")=>{
    const target = action === "delete" ? confirm : editing;
    const {error}=await getSupabaseClient().rpc("manage_business_category",{
      p_business_id:businessId,p_store_id:storeId,p_id:target?.id ?? requestId,
      p_revision:target?.revision ?? null,p_name:name.trim(),p_delete:action==="delete",
    }); if(error)throw error;
  },onSuccess:()=>{setCreating(false);setEditing(null);setConfirm(null);setName("");setRequestId(crypto.randomUUID());},
  onSettled:async()=>{await cache.invalidateQueries({queryKey:["user",user?.id]});}});
  return <section className="space-y-4 rounded-xl border border-border bg-surface p-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Your company categories</h2><p className="mt-1 text-xs leading-5 text-muted">Create and manage categories for your company. Shared platform categories below remain read-only.</p></div>
      <Button disabled={mutation.isPending} onClick={()=>{setCreating(true);setEditing(null);setName("");setRequestId(crypto.randomUUID());mutation.reset();}}>Create category</Button></div>
    {query.isPending && <p className="text-sm text-muted">Loading categories…</p>}
    {query.isError && <div><p role="alert" className="text-sm text-danger">Categories could not load. Check the new migration and business access.</p><Button variant="secondary" onClick={()=>{void query.refetch();}}>Try again</Button></div>}
    {(creating || editing) && <form className="space-y-3 rounded-lg bg-soft p-4" onSubmit={event=>{event.preventDefault();mutation.mutate("save");}}>
      <Input label={editing ? "Edit category name" : "New category name"} required maxLength={150} value={name} disabled={mutation.isPending} onChange={event=>setName(event.target.value)}/>
      <div className="flex gap-2"><Button type="submit" disabled={!name.trim() || mutation.isPending}>Save category</Button><Button variant="secondary" disabled={mutation.isPending} onClick={()=>{setCreating(false);setEditing(null);}}>Cancel</Button></div>
    </form>}
    {mutation.isError && <p role="alert" className="text-sm text-danger">Could not save. Names must be unique within your company. Categories used by products cannot be deleted. Refresh before retrying an edited category.</p>}
    {mutation.isSuccess && <p role="status" className="text-sm text-success">Category change saved.</p>}
    {query.data?.length===0 && <p className="text-sm text-muted">No company categories yet. Create your first category above.</p>}
    <div className="divide-y divide-border">{query.data?.map(row=><div key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><span className="break-words text-sm font-medium">{row.name}</span><div className="flex gap-2">
      <Button size="sm" variant="secondary" disabled={mutation.isPending} onClick={()=>{setEditing(row);setCreating(false);setName(row.name);setConfirm(null);mutation.reset();}}>Edit</Button>
      <Button size="sm" variant="secondary" disabled={mutation.isPending} onClick={()=>{setConfirm(row);mutation.reset();}}>Delete</Button>
    </div></div>)}</div>
    {confirm && <div role="group" aria-label="Confirm category deletion" className="space-y-3 rounded-lg border border-border p-4"><p className="text-sm">Delete “{confirm.name}” from your company and all its stores? Products using this category must be moved first.</p><div className="flex gap-2"><Button disabled={mutation.isPending} onClick={()=>mutation.mutate("delete")}>Confirm delete</Button><Button variant="secondary" disabled={mutation.isPending} onClick={()=>setConfirm(null)}>Cancel</Button></div></div>}
  </section>;
}
