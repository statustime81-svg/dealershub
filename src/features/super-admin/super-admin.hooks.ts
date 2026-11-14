import { useMutation,useQuery,useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useBusiness } from "@/hooks/useBusiness";
import { getPlatformOverview,getPlatformBusinesses,getPlatformBusiness,getPlatformUsers,getPlatformBusinessAudit,updatePlatformBusiness } from "./super-admin.api";
import type { PlatformBusinessFilters,PlatformUserFilters } from "./super-admin.schemas";
export function usePlatformOverview(){
  const{user}=useAuth();const{isPlatformAdmin}=useBusiness();
  return useQuery({queryKey:["user",user?.id,"platform","overview"],enabled:Boolean(user&&isPlatformAdmin),
    queryFn:({signal})=>getPlatformOverview(signal),refetchInterval:30000});
}
export function usePlatformBusinesses(input:PlatformBusinessFilters){
  const{user}=useAuth();const{isPlatformAdmin}=useBusiness();
  return useQuery({queryKey:["user",user?.id,"platform","businesses",input],enabled:Boolean(user&&isPlatformAdmin),
    queryFn:({signal})=>getPlatformBusinesses(input,signal),refetchInterval:30000});
}
export function usePlatformBusiness(businessId:string){
  const{user}=useAuth();const{isPlatformAdmin}=useBusiness();
  return useQuery({queryKey:["user",user?.id,"platform","business",businessId],enabled:Boolean(user&&isPlatformAdmin&&businessId),
    queryFn:({signal})=>getPlatformBusiness(businessId,signal),refetchInterval:30000});
}
export function usePlatformUsers(input:PlatformUserFilters){
  const{user}=useAuth();const{isPlatformAdmin}=useBusiness();
  return useQuery({queryKey:["user",user?.id,"platform","users",input],enabled:Boolean(user&&isPlatformAdmin),
    queryFn:({signal})=>getPlatformUsers(input,signal),refetchInterval:30000});
}
export function usePlatformBusinessAudit(businessId:string){
  const{user}=useAuth();const{isPlatformAdmin}=useBusiness();
  return useQuery({queryKey:["user",user?.id,"platform","business-audit",businessId],enabled:Boolean(user&&isPlatformAdmin&&businessId),
    queryFn:({signal})=>getPlatformBusinessAudit(businessId,signal),refetchInterval:30000});
}
export function usePlatformBusinessAction(businessId:string){
  const{user}=useAuth();const cache=useQueryClient();
  return useMutation({mutationFn:updatePlatformBusiness,retry:false,
    onSuccess:async()=>{await Promise.all([
      cache.invalidateQueries({queryKey:["user",user?.id,"platform"]}),
      cache.invalidateQueries({queryKey:["user",user?.id,"account-access"]}),
      cache.invalidateQueries({queryKey:["user",user?.id,"business",businessId]}),
    ]);},
    onError:async()=>{await cache.invalidateQueries({queryKey:["user",user?.id,"platform","business",businessId]});},
  });
}
