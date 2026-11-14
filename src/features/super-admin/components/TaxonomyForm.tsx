import { useRef,useState } from "react";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { useSaveConfiguration } from "../configuration.hooks";
import type { TaxonomyKind,TaxonomyRow } from "../configuration.schemas";
export function TaxonomyForm({kind,row,onClose}:{kind:TaxonomyKind;row?:TaxonomyRow;onClose:()=>void}){
 const[name,setName]=useState(row?.name??"");const[slug,setSlug]=useState(row?.slug??"");const[active,setActive]=useState(row?.is_active??true);
 const[id]=useState(()=>row?.id??crypto.randomUUID());const request=useRef<{signature:string;key:string}|null>(null);const save=useSaveConfiguration();
 return <form className="space-y-4 rounded-xl border border-border bg-surface p-5" onSubmit={event=>{
 event.preventDefault();if(save.isPending)return;
 const values={name:name.trim(),slug,is_active:active};const signature=JSON.stringify(values);
 if(request.current?.signature!==signature)request.current={signature,key:crypto.randomUUID()};
 save.mutate({kind,id,revision:row?.revision??null,requestKey:request.current.key,values},{onSuccess:onClose});
 }}><h2 className="text-lg font-semibold">{row?"Edit entry":"Add entry"}</h2>
 <Input label="Name" value={name} required maxLength={150} disabled={save.isPending} onChange={e=>setName(e.target.value)}/>
 <Input label="URL name" value={slug} pattern="[a-z0-9]+(-[a-z0-9]+)*" required maxLength={100} hint="Lowercase letters, numbers and single hyphens." disabled={save.isPending} onChange={e=>setSlug(e.target.value)}/>
 <Checkbox label="Active" checked={active} disabled={save.isPending} onChange={e=>setActive(e.target.checked)}/>
 <p className="text-xs leading-5 text-muted">Inactive entries disappear from new selections. Existing product and store references are retained. No records are deleted.</p>
 {save.isError&&<p role="alert" className="text-sm text-danger">Could not save. Check duplicate names or URL names, then reload the current entry before retrying.</p>}
 <div className="flex gap-2"><Button type="submit" isLoading={save.isPending}>Save entry</Button><Button variant="secondary" disabled={save.isPending} onClick={onClose}>Close</Button></div></form>;
}
