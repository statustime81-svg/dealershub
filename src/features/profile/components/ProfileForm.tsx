import { useMutation,useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { useAuth } from "@/hooks/useAuth";
import { saveAccountProfile,saveDealerProfile } from "../profile.api";
import type { AccountProfile,DealerProfile } from "../profile.schemas";
export function ProfileForm({profile,dealer}:{profile:AccountProfile;dealer?:DealerProfile}){
 const{user}=useAuth();const cache=useQueryClient();const mutation=useMutation({mutationFn:async(f:FormData)=>{
 if(!user||user.id!==profile.id)throw new Error("Sign in first");if(dealer)return saveDealerProfile(user.id,dealer.updated_at,{companyName:f.get('companyName'),contactPhone:f.get('contactPhone'),address:f.get('address'),gstin:f.get('gstin')});return saveAccountProfile(user.id,profile.updated_at,{fullName:f.get('fullName'),phone:f.get('phone')});
 },retry:false,onSettled:async()=>{await cache.invalidateQueries({queryKey:["user",user?.id,"profile"]});}});
 return <form className="space-y-4 rounded-xl border border-border bg-surface p-5" onSubmit={e=>{e.preventDefault();if(!mutation.isPending)mutation.mutate(new FormData(e.currentTarget));}}><h2 className="text-lg font-semibold">{dealer?'Dealer business details':'Your account'}</h2><fieldset disabled={mutation.isPending} className="grid gap-4 sm:grid-cols-2">{dealer?<><Input label="Company name" name="companyName" defaultValue={dealer.company_name} required maxLength={200}/><Input label="Business phone" type="tel" name="contactPhone" defaultValue={dealer.contact_phone??''} maxLength={30}/><Textarea label="Address" name="address" defaultValue={dealer.address??''} maxLength={2000}/><Input label="GSTIN (optional)" name="gstin" defaultValue={dealer.gstin??''} maxLength={30}/></>:<><Input label="Full name" name="fullName" defaultValue={profile.full_name} required maxLength={200}/><Input label="Phone" name="phone" type="tel" defaultValue={profile.phone??''} maxLength={30}/></>}</fieldset>
 {mutation.isError&&<p role="alert" className="text-sm text-danger">Could not save. Review the refreshed record and try again.</p>}{mutation.isSuccess&&<p role="status" className="text-sm text-success">Profile saved.</p>}<Button type="submit" isLoading={mutation.isPending}>Save profile</Button></form>;
}
