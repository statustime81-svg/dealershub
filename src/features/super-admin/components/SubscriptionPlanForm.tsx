import { useRef,useState } from "react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { useSaveConfiguration } from "../configuration.hooks";
import type { PlatformPlan } from "../configuration.schemas";
const limits=[['max_products','Products'],['max_dealers','Dealers'],['max_salespeople','Salespeople'],['max_stores','Stores'],['max_storage_bytes','Storage bytes']] as const;
export function SubscriptionPlanForm({plan,onClose}:{plan?:PlatformPlan;onClose:()=>void}){
 const[id]=useState(()=>plan?.id??crypto.randomUUID());const save=useSaveConfiguration();const request=useRef<{signature:string;key:string}|null>(null);
 const[error,setError]=useState("");
 return <form className="space-y-4 rounded-xl border border-border bg-surface p-5" onSubmit={event=>{
 event.preventDefault();if(save.isPending)return;const form=new FormData(event.currentTarget);
 const nullable=(key:string)=>{const s=String(form.get(key)??"").trim();return s===""?null:Number(s);};
 const values={name:String(form.get("name")??"").trim(),slug:String(form.get("slug")??""),description:String(form.get("description")??""),currency:String(form.get("currency")??""),price_amount:nullable("price_amount"),billing_interval:String(form.get("billing_interval")??"")||null,is_active:form.get("is_active")==="on",...Object.fromEntries(limits.map(([key])=>[key,nullable(key)]))};
 if(limits.some(([key])=>{const n=nullable(key);return n!==null&&(!Number.isSafeInteger(n)||n<0||(key!=="max_storage_bytes"&&n>2147483647));})){setError("Limits must be non-negative whole numbers within the supported range.");return;}
 setError("");const signature=JSON.stringify(values);if(request.current?.signature!==signature)request.current={signature,key:crypto.randomUUID()};
 save.mutate({kind:"plan",id,revision:plan?.revision??null,requestKey:request.current.key,values},{onSuccess:onClose});
 }}><h2 className="text-lg font-semibold">{plan?"Edit plan":"Create plan"}</h2><fieldset disabled={save.isPending} className="grid gap-4 sm:grid-cols-2">
 <Input name="name" label="Plan name" defaultValue={plan?.name} required maxLength={150}/><Input name="slug" label="URL name" defaultValue={plan?.slug} required maxLength={100} pattern="[a-z0-9]+(-[a-z0-9]+)*"/>
 <Textarea name="description" label="Description" defaultValue={plan?.description??""} maxLength={3000}/>
 <Input name="price_amount" label="Price" type="number" min="0" max="999999999999.99" step="0.01" defaultValue={plan?.price_amount??""} hint="Blank means not configured. Enter only the approved price."/>
 <Input name="currency" label="Currency code" placeholder="INR" defaultValue={plan?.currency??""} required pattern="[A-Z]{3}" maxLength={3}/>
 <Select name="billing_interval" label="Billing interval" defaultValue={plan?.billing_interval??""}><option value="">Not configured</option><option value="month">Monthly</option><option value="year">Yearly</option><option value="custom">Custom</option></Select>
 {limits.map(([key,label])=><Input key={key} name={key} label={`${label} limit`} type="number" min="0" step="1" max={key==="max_storage_bytes"?Number.MAX_SAFE_INTEGER:2147483647} defaultValue={plan?.[key]??""} hint="Blank means unspecified. Zero is an explicit zero limit."/>)}
 <Checkbox name="is_active" label="Active plan" defaultChecked={plan?.is_active??true}/></fieldset>
 <p className="text-xs leading-5 text-muted">This saves plan configuration. Payments, automatic charging and hard quota enforcement are not enabled by this form.</p>
 {(save.isError||error)&&<p role="alert" className="text-sm text-danger">{error||"Could not save. Check values and duplicate names, then refresh the plan."}</p>}
 <div className="flex gap-2"><Button type="submit" isLoading={save.isPending}>Save plan</Button><Button variant="secondary" disabled={save.isPending} onClick={onClose}>Close</Button></div></form>;
}
