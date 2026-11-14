import { useQuery,useMutation,useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useBusiness } from "@/hooks/useBusiness";
import { getTaxonomy,getPlans,getSubscription,saveConfiguration } from "./configuration.api";
import type { TaxonomyKind } from "./configuration.schemas";
export function usePlatformTaxonomy(kind:TaxonomyKind,search:string,state:string,page:number){
 const{user}=useAuth();const{isPlatformAdmin}=useBusiness();
 return useQuery({queryKey:["user",user?.id,"platform","taxonomy",kind,search,state,page],enabled:Boolean(user&&isPlatformAdmin),queryFn:({signal})=>getTaxonomy(kind,search,state,page,signal)});
}
export function usePlatformPlans(search:string,page:number){
 const{user}=useAuth();const{isPlatformAdmin}=useBusiness();
 return useQuery({queryKey:["user",user?.id,"platform","plans",search,page],enabled:Boolean(user&&isPlatformAdmin),queryFn:({signal})=>getPlans(search,page,signal)});
}
export function usePlatformSubscription(businessId:string){
 const{user}=useAuth();const{isPlatformAdmin}=useBusiness();
 return useQuery({queryKey:["user",user?.id,"platform","subscription",businessId],enabled:Boolean(user&&isPlatformAdmin&&businessId),queryFn:({signal})=>getSubscription(businessId,signal)});
}
export function useSaveConfiguration(){
 const{user}=useAuth();const cache=useQueryClient();
 return useMutation({mutationFn:saveConfiguration,retry:false,onSettled:async()=>{
 await Promise.all([cache.invalidateQueries({queryKey:["user",user?.id,"platform"]}),cache.invalidateQueries({queryKey:["user",user?.id,"business"]}),cache.invalidateQueries({queryKey:["business-categories"]})]);
 }});
}
