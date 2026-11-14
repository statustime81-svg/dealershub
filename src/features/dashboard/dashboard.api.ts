import { getSupabaseClient } from "@/lib/supabase/client";
export async function getBusinessDashboardCounts(businessId:string,signal?:AbortSignal){
 const c=getSupabaseClient();let req=c.from('stores').select('id').eq('business_id',businessId);if(signal)req=req.abortSignal(signal);const stores=await req;if(stores.error)throw stores.error;const ids=(stores.data??[]).map(r=>String(r.id));
 const withSignal=<T extends {abortSignal:(signal:AbortSignal)=>T}>(r:T)=>signal?r.abortSignal(signal):r;
 const [products,dealers,salespeople]=await Promise.all([
 ids.length?withSignal(c.from('products').select('id',{count:'exact',head:true}).in('store_id',ids).eq('is_active',true)):Promise.resolve({count:0,error:null}),
 withSignal(c.from('dealer_store_access').select('dealer_id').eq('business_id',businessId).eq('status','active')),
 withSignal(c.from('business_memberships').select('id',{count:'exact',head:true}).eq('business_id',businessId).eq('role','salesperson').eq('status','active'))]);
 if(products.error)throw products.error;if(dealers.error)throw dealers.error;if(salespeople.error)throw salespeople.error;
 return{products:products.count??0,dealers:new Set((dealers.data??[]).map(x=>String(x.dealer_id))).size,salespeople:salespeople.count??0,stores:ids.length};
}
