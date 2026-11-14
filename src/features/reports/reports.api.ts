import { z } from "zod";
import { getSupabaseClient } from "@/lib/supabase/client";
export const reportSchema=z.object({orders:z.number().int().nonnegative(),submittedValue:z.number().nonnegative(),daily:z.array(z.object({day:z.string(),orders:z.number().int(),value:z.number()})),statuses:z.array(z.object({status:z.string(),orders:z.number().int(),value:z.number()})),recent:z.array(z.object({id:z.string().uuid(),order_number:z.number().int(),status:z.string(),grand_total:z.number(),created_at:z.string(),dealer_name:z.string()}))});
export type WorkspaceReport=z.infer<typeof reportSchema>;
export async function getWorkspaceReport(businessId:string|null,from:string,to:string,signal?:AbortSignal){
 let req=getSupabaseClient().rpc("get_workspace_report",{p_business_id:businessId,p_from:from,p_to:to});if(signal)req=req.abortSignal(signal);const{data,error}=await req;if(error)throw error;return reportSchema.parse(data);
}
