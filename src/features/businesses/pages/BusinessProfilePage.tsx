import { Link } from "react-router-dom";
import { useQuery,useMutation,useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useBusiness } from "@/hooks/useBusiness";
import { PageHeader } from "@/components/shared/PageHeader";
import { QueryState } from "@/components/shared/QueryState";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { routes } from "@/config/routes";
import { getBusinessCategories } from "../businesses.api";
import { getBusinessProfile,updateBusinessProfile,type BusinessProfile } from "../business-profile.api";
function Editor({business}:{business:BusinessProfile}){
 const{user}=useAuth();const cache=useQueryClient();const{refreshAccess}=useBusiness();const cats=useQuery({queryKey:["business-categories"],queryFn:({signal})=>getBusinessCategories(signal)});
 const save=useMutation({mutationFn:(f:FormData)=>updateBusinessProfile(business,f),retry:false,onSettled:async()=>{await cache.invalidateQueries({queryKey:["user",user?.id,"business",business.id]});await refreshAccess();}});
 return <form className="space-y-4 rounded-xl border border-border bg-surface p-5" onSubmit={e=>{e.preventDefault();if(!save.isPending)save.mutate(new FormData(e.currentTarget));}}><p className="text-xs capitalize text-muted">Business type: {business.business_type}</p><fieldset disabled={save.isPending} className="grid gap-4 sm:grid-cols-2"><Input label="Company name" name="companyName" defaultValue={business.company_name} required maxLength={200}/><Input label="Contact email" type="email" name="contactEmail" defaultValue={business.contact_email} required maxLength={254}/><Input label="Contact phone" type="tel" name="contactPhone" defaultValue={business.contact_phone??''} maxLength={30}/><Input label="GSTIN (optional)" name="gstin" defaultValue={business.gstin??''} maxLength={30}/><Textarea label="Business address" name="address" defaultValue={business.address??''} maxLength={2000}/><Select label="Business category" name="categoryId" defaultValue={business.category_id??''}><option value="">No category</option>{business.category_id&&!cats.data?.some(c=>c.id===business.category_id)&&<option value={business.category_id}>Current category</option>}{cats.data?.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</Select></fieldset>
 {cats.isError&&<p role="alert" className="text-xs text-danger">Category options could not load. Current selection is retained.</p>}
 {save.isError&&<p role="alert" className="text-sm text-danger">Could not save. Review the refreshed profile before retrying.</p>}{save.isSuccess&&<p role="status" className="text-sm text-success">Business profile saved.</p>}<Button type="submit" isLoading={save.isPending}>Save business profile</Button>
 <p className="text-xs text-muted">Store branding and logo are managed in <Link className="underline" to={`${routes.manufacturer.store}/settings`}>Store settings</Link>.</p></form>;
}
export default function BusinessProfilePage(){
 const{user}=useAuth();const{activeBusinessId}=useBusiness();const q=useQuery({queryKey:["user",user?.id,"business",activeBusinessId,"profile"],enabled:Boolean(activeBusinessId),queryFn:({signal})=>getBusinessProfile(activeBusinessId!,signal)});
 return <div className="space-y-6"><PageHeader title="Business settings" description="Manage the selected business profile."/><QueryState pending={q.isPending} error={q.isError} retry={q.refetch}>{q.data&&<Editor key={`${q.data.id}:${q.data.updated_at}`} business={q.data}/>}</QueryState></div>;
}
