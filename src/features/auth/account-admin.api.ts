import { getSupabaseClient } from "@/lib/supabase/client";
export async function accountAdminAction(name:string,body:Record<string,unknown>) {
 const {data,error}=await getSupabaseClient().functions.invoke(name,{body});
 if(error){let message="Unable to complete account action. Check function deployment and try again.";if(error.context instanceof Response){const detail=await error.context.json().catch(()=>null);if(typeof detail?.message === "string")message=detail.message;}throw new Error(message);}
 if(!data?.success)throw new Error("Account action did not complete.");return data;
}
