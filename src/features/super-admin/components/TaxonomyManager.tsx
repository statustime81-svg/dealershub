import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Pagination } from "@/components/ui/Pagination";
import { SearchInput } from "@/components/shared/SearchInput";
import { QueryState } from "@/components/shared/QueryState";
import { EmptyState } from "@/components/shared/EmptyState";
import { useDebounce } from "@/hooks/useDebounce";
import { usePlatformTaxonomy } from "../configuration.hooks";
import type { TaxonomyKind,TaxonomyRow } from "../configuration.schemas";
import { TaxonomyForm } from "./TaxonomyForm";
export function TaxonomyManager({kind}:{kind:TaxonomyKind}){
 const[search,setSearch]=useState("");const[state,setState]=useState("all");const[page,setPage]=useState(1);const[editor,setEditor]=useState<TaxonomyRow|"new"|null>(null);const q=usePlatformTaxonomy(kind,useDebounce(search),state,page);
 return <section className="space-y-4"><div className="flex flex-wrap items-end gap-3"><SearchInput label="Search entries" value={search} maxLength={200} onChange={e=>{setSearch(e.target.value);setPage(1);}}/>
 <Select label="Status" value={state} onChange={e=>{setState(e.target.value);setPage(1);}}><option value="all">All entries</option><option value="active">Active</option><option value="inactive">Inactive</option></Select>
 <Button onClick={()=>setEditor("new")}>Add entry</Button></div>
 {editor&&<TaxonomyForm key={editor==="new"?"new":`${editor.id}:${editor.revision}`} kind={kind} row={editor==="new"?undefined:editor} onClose={()=>setEditor(null)}/>}
 <QueryState pending={q.isPending} error={q.isError} retry={q.refetch}>{q.data&&<>
 {q.data.items.length?<div className="overflow-x-auto rounded-xl border border-border bg-surface"><table className="w-full text-left text-sm"><thead className="bg-soft text-xs"><tr>{["Name","URL name","Status","Action"].map(x=><th key={x} className="px-4 py-3">{x}</th>)}</tr></thead><tbody>{q.data.items.map(row=><tr key={row.id} className="border-t border-border"><td className="px-4 py-3 font-medium">{row.name}</td><td className="px-4 py-3 font-mono text-xs">{row.slug}</td><td className="px-4 py-3">{row.is_active?"Active":"Inactive"}</td><td className="px-4 py-3"><Button size="sm" variant="secondary" onClick={()=>setEditor(row)}>Edit</Button></td></tr>)}</tbody></table></div>:<EmptyState title="No entries found" description="Add the approved taxonomy or change the filters."/>}
 <Pagination page={page} total={q.data.total} busy={q.isFetching} onChange={setPage}/></>}</QueryState></section>;
}
