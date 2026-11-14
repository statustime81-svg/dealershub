import { handlePreflight } from "../_shared/cors.ts";
import { requireUser } from "../_shared/auth.ts";
import { createAdminClient } from "../_shared/supabase-admin.ts";
import { errorResponse,HttpError,jsonResponse,requirePost } from "../_shared/responses.ts";
import { parseBody,uuidSchema,z } from "../_shared/validation.ts";
const schema=z.object({
  action:z.literal("business.update"),businessId:uuidSchema,
  expectedUpdatedAt:z.string().datetime({offset:true}),
  status:z.enum(["active","suspended"]),verificationStatus:z.enum(["verified","unverified"]),
  requestKey:uuidSchema,note:z.string().trim().max(2000),
}).strict();
Deno.serve(async(request)=>{
  const preflight=handlePreflight(request);if(preflight)return preflight;
  try{
    requirePost(request);const admin=createAdminClient();const user=await requireUser(request,admin);
    const input=await parseBody(request,schema);
    const {data,error}=await admin.rpc("update_platform_business",{
      p_actor_id:user.id,p_business_id:input.businessId,p_expected_updated_at:input.expectedUpdatedAt,
      p_status:input.status,p_verification:input.verificationStatus,p_request_key:input.requestKey,p_note:input.note,
    });
    if(error){
      if(error.code==="42501")throw new HttpError(403,"Platform administrator access is required.");
      throw new HttpError(409,"Business changed or action could not be completed. Refresh before retrying.");
    }
    const result=z.object({businessId:uuidSchema,alreadyUpdated:z.boolean()}).parse(data);
    return jsonResponse({success:true,...result});
  }catch(error:unknown){return errorResponse(error);}
});
