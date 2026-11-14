import { z } from "zod";
import { getSupabaseClient } from "@/lib/supabase/client";
export const verificationSchema = z.object({paymentAttemptId:z.string().uuid(),razorpay_order_id:z.string().regex(/^order_[a-zA-Z0-9]+$/),razorpay_payment_id:z.string().regex(/^pay_[a-zA-Z0-9]+$/),razorpay_signature:z.string().regex(/^[a-f0-9]{64}$/i)});
export type Verification = z.infer<typeof verificationSchema>;
export const checkoutSchema = z.object({mode:z.literal("test"),paymentAttemptId:z.string().uuid(),businessOrderId:z.string().uuid(),razorpayOrderId:z.string().regex(/^order_[a-zA-Z0-9]+$/),keyId:z.string().startsWith("rzp_test_"),amount:z.number().int().positive().safe(),currency:z.literal("INR")});
export async function paymentFunction(name:string,body:Record<string,unknown>) {
  const client=getSupabaseClient();
  const {data:{session},error:sessionError}=await client.auth.getSession();
  if(sessionError || !session)throw new Error("Sign in before continuing.");
  const {data,error}=await client.functions.invoke(name,{body,headers:{Authorization:`Bearer ${session.access_token}`}});
  if(error){
    let message="Payment request could not complete. Check your session and Edge Function logs.";
    const context:unknown=error.context;
    if(context instanceof Response){const payload=await context.clone().json().catch(()=>null);if(typeof payload?.error==="string")message=payload.error;}
    throw new Error(message);
  }
  return data as unknown;
}
export async function verifyTestPayment(payload:Verification){
  return z.object({mode:z.literal("test"),success:z.boolean(),status:z.enum(["authorized","captured"]),businessOrderId:z.string().uuid()})
    .parse(await paymentFunction("verify-razorpay-test-payment",verificationSchema.parse(payload)));
}
type CheckoutResult = {razorpay_order_id:string;razorpay_payment_id:string;razorpay_signature:string};
type CheckoutOptions = {key:string;amount:number;currency:"INR";order_id:string;name:string;description:string;handler:(result:CheckoutResult)=>void;modal:{ondismiss:()=>void};theme:{color:string}};
export interface RazorpayInstance {open:()=>void;on:(event:"payment.failed",handler:()=>void)=>void;}
declare global {interface Window {Razorpay?:new(options:CheckoutOptions)=>RazorpayInstance;}}
let sdk:Promise<void>|null=null;
export function loadRazorpay():Promise<void>{
  if(window.Razorpay)return Promise.resolve();
  if(sdk)return sdk;
  sdk=new Promise<void>((resolve,reject)=>{
    const script=document.createElement("script");script.src="https://checkout.razorpay.com/v1/checkout.js";script.async=true;
    const timer=window.setTimeout(()=>{script.remove();reject(new Error("Checkout loading timed out. Try again."));},20000);
    script.onload=()=>{window.clearTimeout(timer);if(window.Razorpay)resolve();else{script.remove();reject(new Error("Checkout unavailable."));}};
    script.onerror=()=>{window.clearTimeout(timer);script.remove();reject(new Error("Could not load Razorpay. Check your connection."));};document.head.appendChild(script);
  }).catch(error=>{sdk=null;throw error;});
  return sdk;
}
