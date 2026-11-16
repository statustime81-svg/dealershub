import { CreateManufacturerForm } from "../components/CreateManufacturerForm";
import { useSearchParams } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import { SearchInput } from "@/components/shared/SearchInput";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { useDebounce } from "@/hooks/useDebounce";
import { usePlatformBusinesses } from "../super-admin.hooks";
import { businessStatusSchema,verificationSchema,businessTypeSchema,type PlatformBusinessFilters } from "../super-admin.schemas";
import { BusinessesTable } from "../components/BusinessesTable";
export default function BusinessesPage(){
  const [params] = useSearchParams();
  const[filters,setFilters]=useState<Omit<PlatformBusinessFilters,"page">>(() => ({search:"",status:businessStatusSchema.safeParse(params.get("status")).data ?? "all",verification:verificationSchema.safeParse(params.get("verification")).data ?? "all",type:"all"}));
  const debounced=useDebounce(filters);const key=JSON.stringify(debounced);
  const[pagination,setPagination]=useState({key:"",page:1});const page=pagination.key===key?pagination.page:1;
  const businesses=usePlatformBusinesses({...debounced,page});
  const pages=Math.max(1,Math.ceil((businesses.data?.total??0)/(businesses.data?.pageSize??15)));
  function go(next:number){setPagination({key,page:Math.max(1,Math.min(pages,next))});}
  const [createOpen,setCreateOpen]=useState(false);
  return <div className="space-y-6"><PageHeader title="Businesses" description="Review registered manufacturers and distributors."/>
    <Button onClick={()=>setCreateOpen(value=>!value)}>{createOpen?"Close account form":"+ Create manufacturer"}</Button>
    {createOpen&&<CreateManufacturerForm/>}
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <SearchInput label="Search businesses" placeholder="Search company or contact email…" maxLength={200} value={filters.search} onChange={event=>setFilters(current=>({...current,search:event.target.value}))}/>
      <Select aria-label="Business status" value={filters.status} onChange={event=>{const result=businessStatusSchema.safeParse(event.target.value);if(event.target.value==="all")setFilters(current=>({...current,status:"all"}));else if(result.success)setFilters(current=>({...current,status:result.data}));}}>
        <option value="all">All statuses</option><option value="active">Active</option><option value="suspended">Suspended</option>
      </Select>
      <Select aria-label="Verification status" value={filters.verification} onChange={event=>{const result=verificationSchema.safeParse(event.target.value);if(event.target.value==="all")setFilters(current=>({...current,verification:"all"}));else if(result.success)setFilters(current=>({...current,verification:result.data}));}}>
        <option value="all">All verification states</option><option value="verified">Verified</option><option value="unverified">Unverified</option>
      </Select>
      <Select aria-label="Business type" value={filters.type} onChange={event=>{const result=businessTypeSchema.safeParse(event.target.value);if(event.target.value==="all")setFilters(current=>({...current,type:"all"}));else if(result.success)setFilters(current=>({...current,type:result.data}));}}>
        <option value="all">All types</option><option value="manufacturer">Manufacturer</option><option value="distributor">Distributor</option>
      </Select>
    </div>
    {businesses.isPending?<Spinner label="Loading businesses"/>:businesses.isError?<div><p role="alert" className="text-sm text-danger">Businesses could not load.</p>
      <Button className="mt-3" variant="secondary" onClick={()=>{void businesses.refetch();}}>Try again</Button></div>:<>
      {businesses.data.items.length?<BusinessesTable businesses={businesses.data.items}/>:<EmptyState title="No businesses found" description="Try changing filters or wait for business registrations."/>}
      <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-muted" aria-live="polite">{businesses.data.total} businesses · Page {page} of {pages}</p><div className="flex gap-2">
        <Button size="sm" variant="secondary" disabled={page<=1||businesses.isFetching} onClick={()=>go(page-1)}>Previous</Button>
        <Button size="sm" variant="secondary" disabled={page>=pages||businesses.isFetching} onClick={()=>go(page+1)}>Next</Button>
      </div></div>
    </>}
  </div>;
}
