import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { getSupabaseClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/formatters";
import { checkoutSchema,loadRazorpay,paymentFunction,verificationSchema,verifyTestPayment,type Verification } from "../razorpay-test.api";
const attemptSchema=z.object({id:z.string().uuid(),status:z.enum(["created","authorized","captured","failed"]),amount_paise:z.number().int(),razorpay_order_id:z.string().nullable()});
export function TestPaymentPanel({orderId,orderStatus}:{orderId:string;orderStatus:string}){
  const {user}=useAuth();const request=useRef(crypto.randomUUID());const locked=useRef(false);
  const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");const [error,setError]=useState("");
  const storageKey=`dh-test-payment:${user?.id}:${orderId}`;
  const [pending,setPending]=useState<Verification|null>(()=>{try{const value=JSON.parse(sessionStorage.getItem(storageKey)??"null");const parsed=verificationSchema.safeParse(value);return parsed.success?parsed.data:null;}catch{return null;}});
  const attempts=useQuery({queryKey:["user",user?.id,"test-payments",orderId],enabled:Boolean(user),refetchInterval:10000,queryFn:async()=>{
    const {data,error}=await getSupabaseClient().from("razorpay_test_payments").select("id,status,amount_paise,razorpay_order_id").eq("order_id",orderId).order("created_at",{ascending:false}).limit(20);
    if(error)throw error;return z.array(attemptSchema).parse(data);
  }});
  const captured=attempts.data?.find(item=>item.status==="captured");
  const authorized=attempts.data?.some(item=>item.status==="authorized");
  function release(){locked.current=false;setBusy(false);}
  async function verify(payload:Verification){
    locked.current=true;setBusy(true);setError("");
    try{const result=await verifyTestPayment(payload);if(result.businessOrderId!==orderId)throw new Error("Order verification mismatch.");
      if(result.success&&result.status==="captured"){setMessage("Test payment verified. No real money was collected.");setPending(null);sessionStorage.removeItem(storageKey);}
      else setMessage("Payment authorized; capture is pending. Retry verification, not payment.");
    }catch(err){setError(err instanceof Error?err.message:"Verification failed. Retry verification, not payment.");}
    finally{await attempts.refetch();release();}
  }
  async function pay(){
    if(locked.current||!user)return;locked.current=true;setBusy(true);setError("");setMessage("");
    try{
      await loadRazorpay();
      const config=checkoutSchema.parse(await paymentFunction("create-razorpay-test-order",{orderId,requestKey:request.current}));
      if(config.businessOrderId!==orderId||!window.Razorpay)throw new Error("Checkout order mismatch.");
      let returned=false;
      const checkout=new window.Razorpay({key:config.keyId,amount:config.amount,currency:config.currency,order_id:config.razorpayOrderId,name:"DealersHub",description:"TEST PAYMENT — no real money",theme:{color:"#0b1220"},
        handler:result=>{returned=true;const payload=verificationSchema.parse({paymentAttemptId:config.paymentAttemptId,...result});setPending(payload);try{sessionStorage.setItem(storageKey,JSON.stringify(payload));}catch{/* In-memory retry still works. */}void verify(payload);},
        modal:{ondismiss:()=>{if(!returned){setMessage("Checkout closed. No payment success is confirmed. Check status before retrying.");void attempts.refetch();release();}}}});
      checkout.on("payment.failed",()=>{setError("A test payment attempt failed. You may retry inside checkout, or close it and check status.");});
      checkout.open();
    }catch(err){setError(err instanceof Error?err.message:"Checkout could not open.");await attempts.refetch();release();}
  }
  return <section className="space-y-4 rounded-xl border border-border bg-surface p-5">
    <div><span className="rounded bg-lime/20 px-2 py-1 text-xs font-semibold">TEST MODE</span><h2 className="mt-3 text-lg font-semibold">Razorpay test payment</h2><p className="mt-2 text-xs leading-6 text-muted">Simulated payment for this saved order. Stock and business order status remain unchanged.</p></div>
    {attempts.isPending&&<p className="text-sm text-muted">Checking test payment status…</p>}
    {attempts.isError&&<div><p role="alert" className="text-sm text-danger">Payment status could not load. Check the payment table and order access.</p><Button variant="secondary" onClick={()=>{void attempts.refetch();}}>Refresh status</Button></div>}
    {captured?<p role="status" className="text-sm font-medium text-success">Test payment captured: {formatCurrency(captured.amount_paise/100)}. No real money collected.</p>:pending?<Button disabled={busy||attempts.isError} onClick={()=>{if(!locked.current)void verify(pending);}}>Retry payment verification</Button>:authorized?<p className="text-sm text-muted">Payment authorized; capture/verification is pending. Do not make another payment.</p>:<Button disabled={busy||!attempts.isSuccess||["cancelled","rejected"].includes(orderStatus)} isLoading={busy} loadingText="Processing…" onClick={()=>{void pay();}}>Pay in Test Mode</Button>}
    {message&&<p role="status" className="text-sm leading-6 text-muted">{message}</p>}
    {error&&<p role="alert" className="text-sm leading-6 text-danger">{error}</p>}
    <Button size="sm" variant="secondary" disabled={busy} onClick={()=>{void attempts.refetch();}}>Refresh payment status</Button>
  </section>;
}
