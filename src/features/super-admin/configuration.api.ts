import { getSupabaseClient } from "@/lib/supabase/client";
import { invokeAuthenticatedFunction } from "@/lib/supabase/function-client";
import { taxonomyListSchema,planListSchema,subscriptionSchema,type TaxonomyKind,type ConfigurationInput } from "./configuration.schemas";
import { z } from "zod";
export async function getTaxonomy(kind:TaxonomyKind,search:string,state:string,page:number,signal?:AbortSignal){
 let req=getSupabaseClient().rpc("get_platform_taxonomy",{p_kind:kind,p_search:search,p_state:state,p_page:page});if(signal)req=req.abortSignal(signal);
 const{data,error}=await req;if(error)throw error;return taxonomyListSchema.parse(data);
}
export async function getPlans(search:string,page:number,signal?:AbortSignal){
 let req=getSupabaseClient().rpc("get_platform_plans",{p_search:search,p_page:page});if(signal)req=req.abortSignal(signal);
 const{data,error}=await req;if(error)throw error;return planListSchema.parse(data);
}
export async function getSubscription(businessId:string,signal?:AbortSignal){
 let req=getSupabaseClient().rpc("get_platform_subscription",{p_business_id:businessId});if(signal)req=req.abortSignal(signal);
 const{data,error}=await req;if(error)throw error;return subscriptionSchema.nullable().parse(data);
}
export async function saveConfiguration(input:ConfigurationInput){
 return z.object({success:z.literal(true),id:z.string().uuid()}).parse(await invokeAuthenticatedFunction("manage-platform-configuration",{...input}));
}
