import { handlePreflight } from "../_shared/cors.ts";
import { requireUser } from "../_shared/auth.ts";
import { createAdminClient } from "../_shared/supabase-admin.ts";
import { errorResponse,HttpError,jsonResponse,requirePost } from "../_shared/responses.ts";
import { parseBody,uuidSchema,z } from "../_shared/validation.ts";
const integer=z.number().int().min(0).max(2147483647).nullable();
const slug=z.string().min(1).max(100).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);
const envelope={id:uuidSchema,revision:z.number().int().positive().nullable(),requestKey:uuidSchema};
const taxonomy=z.object({...envelope,kind:z.enum(["business_categories","product_categories","brands"]),values:z.object({name:z.string().trim().min(1).max(150),slug,is_active:z.boolean()}).strict()}).strict();
const plan=z.object({...envelope,kind:z.literal("plan"),values:z.object({name:z.string().trim().min(1).max(150),slug,description:z.string().max(3000),price_amount:z.number().finite().min(0).max(999999999999.99).multipleOf(0.01).nullable(),currency:z.string().regex(/^[A-Z]{3}$/),billing_interval:z.enum(["month","year","custom"]).nullable(),max_products:integer,max_dealers:integer,max_salespeople:integer,max_stores:integer,max_storage_bytes:z.number().int().min(0).max(Number.MAX_SAFE_INTEGER).nullable(),is_active:z.boolean()}).strict()}).strict();
const subscription=z.object({...envelope,kind:z.literal("subscription"),values:z.object({business_id:uuidSchema,plan_id:uuidSchema,status:z.enum(["trialing","active","expired","cancelled"]),starts_at:z.string().datetime({offset:true}),ends_at:z.string().datetime({offset:true}).nullable()}).strict()}).strict();
const schema=z.union([taxonomy,plan,subscription]);
Deno.serve(async request=>{
 const preflight=handlePreflight(request);if(preflight)return preflight;
 try{
  requirePost(request);const admin=createAdminClient();const user=await requireUser(request,admin);const input=await parseBody(request,schema);
  const result=input.kind==="plan"||input.kind==="subscription"?
   await admin.rpc("save_platform_subscription_config",{p_actor_id:user.id,p_request_key:input.requestKey,p_kind:input.kind,p_id:input.id,p_revision:input.revision,p_values:input.values}):
   await admin.rpc("save_platform_taxonomy",{p_actor_id:user.id,p_request_key:input.requestKey,p_kind:input.kind,p_id:input.id,p_revision:input.revision,p_name:input.values.name,p_slug:input.values.slug,p_active:input.values.is_active});
  if(result.error)throw new HttpError(result.error.code==="42501"?403:409,result.error.code==="42501"?"Platform access required.":"Unable to save. Check duplicate names, dates and refreshed record.");
  return jsonResponse(z.object({success:z.literal(true),id:uuidSchema}).parse(result.data));
 }catch(error:unknown){return errorResponse(error);}
});
