import { z } from "zod";
import { getSupabaseClient } from "@/lib/supabase/client";
export const businessProfileSchema=z.object({id:z.string().uuid(),company_name:z.string(),business_type:z.string(),contact_email:z.string(),contact_phone:z.string().nullable(),address:z.string().nullable(),gstin:z.string().nullable(),category_id:z.string().uuid().nullable(),updated_at:z.string()});
export type BusinessProfile=z.infer<typeof businessProfileSchema>;
export async function getBusinessProfile(businessId:string,signal?:AbortSignal){
 let req=getSupabaseClient().from("businesses").select("id,company_name,business_type,contact_email,contact_phone,address,gstin,category_id,updated_at").eq("id",businessId);if(signal)req=req.abortSignal(signal);const{data,error}=await req.single();if(error)throw error;return businessProfileSchema.parse(data);
}
export async function updateBusinessProfile(b:BusinessProfile,f:FormData){
 const{error}=await getSupabaseClient().rpc("update_business_profile",{p_business_id:b.id,p_expected_updated_at:b.updated_at,p_name:String(f.get("companyName")??'').trim(),p_email:String(f.get('contactEmail')??'').trim(),p_phone:String(f.get('contactPhone')??''),p_address:String(f.get('address')??''),p_gstin:String(f.get('gstin')??''),p_category_id:String(f.get('categoryId')??'')||null});if(error)throw error;
}
