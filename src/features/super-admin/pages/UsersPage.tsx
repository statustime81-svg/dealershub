import { useSearchParams } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import { SearchInput } from "@/components/shared/SearchInput";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { useDebounce } from "@/hooks/useDebounce";
import { usePlatformUsers } from "../super-admin.hooks";
import { platformRoleSchema,type PlatformUserFilters } from "../super-admin.schemas";
import { UsersTable } from "../components/UsersTable";
const roleLabels={super_admin:"Super Admin",business_admin:"Business Admin",dealer:"Dealer",salesperson:"Salesperson"};
export default function UsersPage(){
  const [params] = useSearchParams();
  const[filters,setFilters]=useState<Omit<PlatformUserFilters,"page">>(() => ({search:"",role:platformRoleSchema.safeParse(params.get("role")).data ?? "all"}));const debounced=useDebounce(filters);const key=JSON.stringify(debounced);
  const[pagination,setPagination]=useState({key:"",page:1});const page=pagination.key===key?pagination.page:1;
  const users=usePlatformUsers({...debounced,page});const pages=Math.max(1,Math.ceil((users.data?.total??0)/(users.data?.pageSize??15)));
  function go(next:number){setPagination({key,page:Math.max(1,Math.min(pages,next))});}
  return <div className="space-y-6"><PageHeader title="Users" description="Registered accounts and their assigned platform/business roles."/>
    <p className="text-xs leading-5 text-muted">Use Reset password to set a user’s new password. Assigned roles do not imply active business or store access. Team memberships count business-team links, not dealer-store authorizations.</p>
    <div className="grid gap-3 sm:grid-cols-[1fr_220px]"><SearchInput label="Search users" placeholder="Search name or email…" maxLength={200} value={filters.search} onChange={event=>setFilters(current=>({...current,search:event.target.value}))}/>
      <Select aria-label="Assigned role" value={filters.role} onChange={event=>{const result=platformRoleSchema.safeParse(event.target.value);if(event.target.value==="all")setFilters(current=>({...current,role:"all"}));else if(result.success)setFilters(current=>({...current,role:result.data}));}}>
        <option value="all">All assigned roles</option>{platformRoleSchema.options.map(role=><option key={role} value={role}>{roleLabels[role]}</option>)}
      </Select></div>
    {users.isPending?<Spinner label="Loading platform users"/>:users.isError?<div><p role="alert" className="text-sm text-danger">User directory could not load.</p><Button className="mt-3" variant="secondary" onClick={()=>{void users.refetch();}}>Try again</Button></div>:<>
      {users.data.items.length?<UsersTable users={users.data.items}/>:<EmptyState title="No users found" description="Adjust search or assigned-role filter."/>}
      <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-muted" aria-live="polite">{users.data.total} users · Page {page} of {pages}</p><div className="flex gap-2">
        <Button size="sm" variant="secondary" disabled={page<=1||users.isFetching} onClick={()=>go(page-1)}>Previous</Button><Button size="sm" variant="secondary" disabled={page>=pages||users.isFetching} onClick={()=>go(page+1)}>Next</Button>
      </div></div>
    </>}
  </div>;
}
