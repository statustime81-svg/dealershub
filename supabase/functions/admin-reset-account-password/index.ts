import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.24.2";
const headers={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Content-Type":"application/json","Cache-Control":"no-store"};
const respond=(status:number,message:string,extra:Record<string,unknown>={})=>new Response(JSON.stringify({success:status===200,message,...extra}),{status,headers});
const schema=z.object({userId:z.string().uuid(),businessId:z.string().uuid().optional(),password:z.string().min(12).max(128)}).strict();
Deno.serve(async request=>{
 if(request.method==="OPTIONS")return new Response(null,{status:204,headers});
 if(request.method!=="POST")return respond(405,"POST required.");
 try{
 const admin=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,{auth:{persistSession:false,autoRefreshToken:false}});
 const token=request.headers.get("Authorization")?.match(/^Bearer\s+(\S+)$/i)?.[1];if(!token)return respond(401,"Sign in first.");
 const {data:auth,error:authError}=await admin.auth.getUser(token);if(authError||!auth.user)return respond(401,"Session expired. Sign in again.");
 if(!request.headers.get("content-type")?.includes("application/json"))return respond(415,"JSON required.");
 const raw=await request.text();if(new TextEncoder().encode(raw).length>8192)return respond(413,"Request too large.");
 let body:unknown;try{body=JSON.parse(raw);}catch{return respond(400,"Invalid JSON.");}
 const parsed=schema.safeParse(body);if(!parsed.success)return respond(400,parsed.error.issues[0]?.message??"Invalid input.");const input=parsed.data;

 const{data:allowed,error:permissionError}=await admin.rpc("can_admin_reset_account",{p_actor_id:auth.user.id,p_user_id:input.userId,p_business_id:input.businessId??null});
 if(permissionError)return respond(500,"Unable to verify reset permission. Check migration deployment.");
 if(allowed!==true)return respond(403,"Password reset is not allowed for this account. Contact Super Admin for shared or administrator accounts.");
 const{error:updateError}=await admin.auth.admin.updateUserById(input.userId,{password:input.password,email_confirm:true});
 if(updateError)return respond(400,"Password could not be updated. Check the configured password policy.");
 return respond(200,"Password updated. Share the new password privately.");
 }catch{return respond(500,"Unable to complete account action. Check function configuration.");}
});
