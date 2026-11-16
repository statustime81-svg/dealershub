import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.24.2";
const headers={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Content-Type":"application/json","Cache-Control":"no-store"};
const respond=(status:number,message:string)=>new Response(JSON.stringify({success:status===200,message}),{status,headers});
const schema=z.object({userId:z.string().uuid(),confirmation:z.string().trim().min(1).max(254)}).strict();
Deno.serve(async request=>{
 if(request.method==="OPTIONS")return new Response(null,{status:204,headers});
 if(request.method!=="POST")return respond(405,"POST required.");
 try{
  const admin=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,{auth:{persistSession:false,autoRefreshToken:false}});
  const token=request.headers.get("Authorization")?.match(/^Bearer\s+(\S+)$/i)?.[1];if(!token)return respond(401,"Sign in first.");
  const{data:auth,error:authError}=await admin.auth.getUser(token);if(authError||!auth.user)return respond(401,"Session expired. Sign in again.");
  if(!request.headers.get("content-type")?.includes("application/json"))return respond(415,"JSON required.");
  const raw=await request.text();if(new TextEncoder().encode(raw).length>4096)return respond(413,"Request too large.");
  let body:unknown;try{body=JSON.parse(raw);}catch{return respond(400,"Invalid JSON.");}
  const parsed=schema.safeParse(body);if(!parsed.success)return respond(400,"Choose a user and type its email to confirm deletion.");const input=parsed.data;
  const{data:actor,error:ae}=await admin.from("platform_admins").select("user_id").eq("user_id",auth.user.id).maybeSingle();if(ae)return respond(500,"Unable to verify administrator.");if(!actor)return respond(403,"Only Super Admin can delete user accounts.");
  if(input.userId===auth.user.id)return respond(403,"You cannot delete your own account.");
  const{data:targetAdmin,error:te}=await admin.from("platform_admins").select("user_id").eq("user_id",input.userId).maybeSingle();if(te)return respond(500,"Unable to check account role.");if(targetAdmin)return respond(403,"Super Admin accounts cannot be deleted here.");
  const{data:target,error:ue}=await admin.auth.admin.getUserById(input.userId);if(ue||!target.user)return respond(404,"User not found. Refresh the user list.");
  const expected=target.user.email??target.user.id;
  if(input.confirmation.toLowerCase()!==expected.toLowerCase())return respond(400,"Confirmation must match the selected user's current email.");
  const{data:blocker,error:be}=await admin.rpc("user_deletion_blocker",{p_user_id:input.userId});if(be)return respond(500,"Unable to check linked data. Run the delete-user SQL migration first.");
  if(blocker)return respond(409,typeof blocker==="string"?blocker:"Linked data prevents deletion.");
  const{error:de}=await admin.auth.admin.deleteUser(input.userId,false);
  if(de)return respond(409,"Deletion could not complete. Linked records, uploaded-file ownership or a concurrent change may prevent deletion. Refresh before retrying.");
  return respond(200,"User account deleted.");
 }catch{return respond(500,"Unable to complete deletion. Refresh the user list before retrying.");}
});
