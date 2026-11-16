import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.24.2";
const headers={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Content-Type":"application/json","Cache-Control":"no-store"};
const respond=(status:number,message:string,extra:Record<string,unknown>={})=>new Response(JSON.stringify({success:status===200,message,...extra}),{status,headers});
const schema=z.object({requestKey:z.string().uuid(),fullName:z.string().trim().min(1).max(150),companyName:z.string().trim().min(1).max(200),email:z.string().trim().email().max(254).transform(v=>v.toLowerCase()),password:z.string().min(12).max(128),storeName:z.string().trim().min(1).max(200),storeSlug:z.string().min(1).max(100).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)}).strict();
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

 const{data:actor,error:ae}=await admin.from("platform_admins").select("user_id").eq("user_id",auth.user.id).maybeSingle();
 if(ae)return respond(500,"Unable to verify administrator.");if(!actor)return respond(403,"Only Super Admin can create manufacturer accounts.");
 const{data:existing,error:le}=await admin.rpc("find_invitation_user",{p_email:input.email});if(le)return respond(500,"Unable to check account.");if(existing)return respond(409,"This email already has an account. It was not changed. Choose a new manufacturer email or manage the existing account.");
 const{data:store,error:se}=await admin.from("stores").select("id").eq("slug",input.storeSlug).maybeSingle();if(se)return respond(500,"Unable to check store address.");if(store)return respond(409,"Store slug already exists. Choose another.");
 const{data:created,error:ce}=await admin.auth.admin.createUser({email:input.email,password:input.password,email_confirm:true,user_metadata:{full_name:input.fullName},app_metadata:{managed_by:auth.user.id}});
 if(ce||!created.user)return respond(409,"Account could not be created. Check password policy and email availability.");
 const{data:business,error:be}=await admin.rpc("finalize_manufacturer_account",{p_actor_id:auth.user.id,p_user_id:created.user.id,p_request_key:input.requestKey,p_full_name:input.fullName,p_company_name:input.companyName,p_email:input.email,p_store_name:input.storeName,p_store_slug:input.storeSlug});
 if(be){
  if(!be.code||be.code.startsWith("PGRST"))return respond(500,"Business setup result is uncertain. Check Users and Businesses before retrying; do not create duplicate accounts.");
  const{error:cleanup}=await admin.auth.admin.deleteUser(created.user.id);return respond(500,cleanup?"Business setup failed and account cleanup needs administrator review.":"Business setup failed; the new account was removed. Check the migration and store slug.");
 }
 return respond(200,"Manufacturer account created.",{userId:created.user.id,business,loginUrl:"https://dealershub.vercel.app/login"});
 }catch{return respond(500,"Unable to complete account action. Check function configuration.");}
});
