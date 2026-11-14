import { getSupabaseClient } from "@/lib/supabase/client";
import { accountProfileSchema,dealerProfileSchema,profileValuesSchema,dealerValuesSchema } from "./profile.schemas";
export async function getProfile(userId:string,signal?:AbortSignal){
 let a=getSupabaseClient().from("profiles").select("id,full_name,phone,updated_at").eq("id",userId);let b=getSupabaseClient().from("dealer_profiles").select("user_id,company_name,contact_phone,address,gstin,updated_at").eq("user_id",userId);if(signal){a=a.abortSignal(signal);b=b.abortSignal(signal);}const[p,d]=await Promise.all([a.single(),b.maybeSingle()]);if(p.error)throw p.error;if(d.error)throw d.error;return{profile:accountProfileSchema.parse(p.data),dealer:dealerProfileSchema.nullable().parse(d.data)};
}
export async function saveAccountProfile(userId:string,expected:string,values:unknown){
 const v=profileValuesSchema.parse(values);const{data,error}=await getSupabaseClient().from("profiles").update({full_name:v.fullName,phone:v.phone||null}).eq("id",userId).eq("updated_at",expected).select("id").single();if(error||!data)throw error??new Error("Profile changed; refresh");
}
export async function saveDealerProfile(userId:string,expected:string,values:unknown){
 const v=dealerValuesSchema.parse(values);const{data,error}=await getSupabaseClient().from("dealer_profiles").update({company_name:v.companyName,contact_phone:v.contactPhone||null,address:v.address||null,gstin:v.gstin||null}).eq("user_id",userId).eq("updated_at",expected).select("user_id").single();if(error||!data)throw error??new Error("Dealer profile changed; refresh");
}
