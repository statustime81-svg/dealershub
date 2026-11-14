import { getSupabaseClient } from "@/lib/supabase/client";
import { invokeAuthenticatedFunction } from "@/lib/supabase/function-client";
import {
  platformOverviewSchema,platformBusinessListSchema,platformBusinessSchema,platformUserListSchema,platformAuditSchema,
  platformBusinessActionSchema,platformActionResponseSchema,
  type PlatformBusinessFilters,type PlatformUserFilters,type PlatformBusinessAction,
} from "./super-admin.schemas";
export async function getPlatformOverview(signal?:AbortSignal){
  let request=getSupabaseClient().rpc("get_platform_overview");if(signal)request=request.abortSignal(signal);
  const{data,error}=await request;if(error)throw error;return platformOverviewSchema.parse(data);
}
export async function getPlatformBusinesses(input:PlatformBusinessFilters,signal?:AbortSignal){
  let request=getSupabaseClient().rpc("get_platform_businesses",{
    p_search:input.search,p_status:input.status,p_verification:input.verification,p_type:input.type,p_page:input.page,
  });if(signal)request=request.abortSignal(signal);
  const{data,error}=await request;if(error)throw error;return platformBusinessListSchema.parse(data);
}
export async function getPlatformBusiness(businessId:string,signal?:AbortSignal){
  let request=getSupabaseClient().rpc("get_platform_business",{p_business_id:businessId});if(signal)request=request.abortSignal(signal);
  const{data,error}=await request;if(error)throw error;return platformBusinessSchema.parse(data);
}
export async function getPlatformUsers(input:PlatformUserFilters,signal?:AbortSignal){
  let request=getSupabaseClient().rpc("get_platform_users",{p_search:input.search,p_role:input.role,p_page:input.page});if(signal)request=request.abortSignal(signal);
  const{data,error}=await request;if(error)throw error;return platformUserListSchema.parse(data);
}
export async function getPlatformBusinessAudit(businessId:string,signal?:AbortSignal){
  let request=getSupabaseClient().rpc("get_platform_business_actions",{p_business_id:businessId});if(signal)request=request.abortSignal(signal);
  const{data,error}=await request;if(error)throw error;return platformAuditSchema.parse(data);
}
export async function updatePlatformBusiness(values:PlatformBusinessAction){
  const input=platformBusinessActionSchema.parse(values);
  const result=await invokeAuthenticatedFunction<unknown>("platform-admin",input);
  return platformActionResponseSchema.parse(result);
}
