import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useBusiness } from "@/hooks/useBusiness";
import { getWorkspaceReport } from "./reports.api";
export function useWorkspaceReport(businessId:string|null,from:string,to:string,platform=false){
 const{user}=useAuth();const{isPlatformAdmin}=useBusiness();
 return useQuery({queryKey:["user",user?.id,platform?"platform":"business",businessId,"report",from,to],enabled:Boolean(user&&(platform?isPlatformAdmin:businessId)),queryFn:({signal})=>getWorkspaceReport(businessId,from,to,signal)});
}
