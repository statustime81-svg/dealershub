import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useBusiness } from "@/hooks/useBusiness";
import { getBusinessDashboardCounts } from "./dashboard.api";
export function useBusinessDashboardCounts(){const{user}=useAuth();const{activeBusinessId}=useBusiness();return useQuery({queryKey:["user",user?.id,"business",activeBusinessId,"dashboard-counts"],enabled:Boolean(activeBusinessId),queryFn:({signal})=>getBusinessDashboardCounts(activeBusinessId!,signal)});}
