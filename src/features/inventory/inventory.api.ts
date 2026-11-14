import { getSupabaseClient } from "@/lib/supabase/client";
import { inventoryListSchema,stockUpdateSchema,type StockUpdate } from "./inventory.schemas";
export async function getInventory(businessId:string,search:string,page:number,signal?:AbortSignal){
 let req=getSupabaseClient().rpc("get_business_inventory",{p_business_id:businessId,p_search:search,p_page:page});if(signal)req=req.abortSignal(signal);const{data,error}=await req;if(error)throw error;return inventoryListSchema.parse(data);
}
export async function updateStock(input:StockUpdate){
 const v=stockUpdateSchema.parse(input);const{error}=await getSupabaseClient().rpc("update_inventory_availability",{p_variant_id:v.variantId,p_expected_updated_at:v.expectedUpdatedAt,p_quantity:v.quantity,p_availability:v.availability});if(error)throw error;
}
