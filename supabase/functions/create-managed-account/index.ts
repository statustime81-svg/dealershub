import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.24.2";
const headers = {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Content-Type":"application/json","Cache-Control":"no-store"};
const respond = (status:number,message:string,extra:Record<string,unknown>={}) => new Response(JSON.stringify({success:status===200,message,...extra}),{status,headers});
const schema = z.object({businessId:z.string().uuid(),storeId:z.string().uuid().optional(),role:z.enum(["dealer","salesperson"]),fullName:z.string().trim().min(1).max(200),companyName:z.string().trim().min(1).max(200).optional(),email:z.string().trim().email().max(254).transform(v=>v.toLowerCase()),password:z.string().min(12).max(128)}).strict().refine(v=>v.role==="dealer" ? Boolean(v.storeId && v.companyName) : !v.storeId,{message:"Dealer store/company required; salesperson must not specify a store."});
Deno.serve(async request => {
 if(request.method === "OPTIONS") return new Response(null,{status:204,headers});
 if(request.method !== "POST") return respond(405,"POST required.");
 try {    
  const admin=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,{auth:{persistSession:false,autoRefreshToken:false}});
  const token=request.headers.get("Authorization")?.match(/^Bearer\s+(\S+)$/i)?.[1];
  if(!token) return respond(401,"Sign in first.");
  const {data:auth,error:authError}=await admin.auth.getUser(token);
  if(authError || !auth.user) return respond(401,"Session expired. Sign in again.");
  if(!request.headers.get("content-type")?.includes("application/json")) return respond(415,"JSON required.");
  const raw=await request.text(); if(new TextEncoder().encode(raw).length>8192) return respond(413,"Request too large.");
  let body:unknown;try{body=JSON.parse(raw);}catch{return respond(400,"Invalid JSON.");}
  const parsed=schema.safeParse(body);if(!parsed.success) return respond(400,parsed.error.issues[0]?.message ?? "Invalid input.");
  const input=parsed.data;
  const {data:business,error:be}=await admin.from("businesses").select("id,status").eq("id",input.businessId).maybeSingle();
  if(be) return respond(500,"Unable to verify business.");
  if(!business || business.status!=="active") return respond(403,"Business unavailable.");
  const {data:member,error:me}=await admin.from("business_memberships").select("id").eq("business_id",input.businessId).eq("user_id",auth.user.id).eq("role","business_admin").eq("status","active").maybeSingle();
  if(me) return respond(500,"Unable to verify permission.");
  if(!member) return respond(403,"Business administrator access required.");
  if(input.role==="dealer") {
   const {data:store,error:se}=await admin.from("stores").select("id").eq("id",input.storeId!).eq("business_id",input.businessId).maybeSingle();
   if(se) return respond(500,"Unable to verify store.");
   if(!store) return respond(403,"Store does not belong to this business.");
  }
  const {data:existing,error:lookupError}=await admin.rpc("find_invitation_user",{p_email:input.email});
  if(lookupError) return respond(500,"Unable to check existing account.");
  if(existing) return respond(409,"This email already has an account. Its password was not changed. Ask Super Admin to manage existing access, or use Admin password reset for an authorized account.");
  const {data:created,error:createError}=await admin.auth.admin.createUser({email:input.email,password:input.password,email_confirm:true,user_metadata:{full_name:input.fullName},app_metadata:{managed_by:auth.user.id,managed_business:input.businessId}});
  if(createError || !created.user) return respond(409,"Account could not be created. Check password policy or whether the email already exists.");
  const {data:access,error:accessError}=await admin.rpc("finalize_managed_account",{p_actor_id:auth.user.id,p_user_id:created.user.id,p_business_id:input.businessId,p_store_id:input.storeId ?? null,p_role:input.role,p_full_name:input.fullName,p_company_name:input.companyName ?? null});
  if(accessError) {
   if(!accessError.code || accessError.code.startsWith("PGRST")) return respond(500,"Access setup result is uncertain. Check the account and access lists before retrying.");
   const {error:cleanupError}=await admin.auth.admin.deleteUser(created.user.id);
   if(cleanupError) return respond(500,"Access setup failed and account cleanup needs administrator review. Do not retry with another email.");
   return respond(500,"Access setup failed; the new account was removed. Check the migration and function logs before retrying.");
  }
  return respond(200,"Account created with active access. No email verification is required.",{userId:created.user.id,access,loginUrl:"https://dealershub.vercel.app/login"});
 } catch { return respond(500,"Unable to complete account creation. Check function configuration."); }
});
