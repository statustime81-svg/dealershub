import { useRef,useState } from "react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { usePlatformBusinessAction } from "../super-admin.hooks";
import { businessStatusSchema,verificationSchema,type PlatformBusiness } from "../super-admin.schemas";
export function BusinessVerificationPanel({business}:{business:PlatformBusiness["business"]}){
  const[status,setStatus]=useState(business.status);const[verification,setVerification]=useState(business.verificationStatus);const[note,setNote]=useState("");
  const request=useRef<{signature:string;key:string}|null>(null);const mutation=usePlatformBusinessAction(business.id);
  const changed=status!==business.status||verification!==business.verificationStatus;
  return <form className="space-y-4 rounded-xl border border-border bg-surface p-5" onSubmit={event=>{
    event.preventDefault();if(!changed||mutation.isPending)return;
    if(status==="suspended"&&business.status!=="suspended"&&!window.confirm(`Suspend ${business.companyName}? Its tenant workspace and ordering will be unavailable until reactivated.`))return;
    const values={action:"business.update" as const,businessId:business.id,expectedUpdatedAt:business.updatedAt,status,verificationStatus:verification,note:note.trim()};
    const signature=JSON.stringify(values);if(request.current?.signature!==signature)request.current={signature,key:crypto.randomUUID()};
    mutation.mutate({...values,requestKey:request.current.key});
  }}>
    <h2 className="text-lg font-semibold">Business access and verification</h2>
    <p className="text-xs leading-5 text-muted">Suspension restricts this business workspace and ordering. It does not delete data or ban the owner's entire login account.</p>
    <Select label="Business status" value={status} disabled={mutation.isPending} onChange={event=>{const parsed=businessStatusSchema.safeParse(event.target.value);if(parsed.success){setStatus(parsed.data);mutation.reset();}}}>
      <option value="active">Active</option><option value="suspended">Suspended</option>
    </Select>
    <Select label="Verification" value={verification} disabled={mutation.isPending} onChange={event=>{const parsed=verificationSchema.safeParse(event.target.value);if(parsed.success){setVerification(parsed.data);mutation.reset();}}}>
      <option value="unverified">Unverified</option><option value="verified">Verified</option>
    </Select>
    <Textarea label="Admin note" hint="Visible only to platform administrators." value={note} maxLength={2000} disabled={mutation.isPending} onChange={event=>{setNote(event.target.value);mutation.reset();}}/>
    {mutation.isError&&<p role="alert" className="text-sm text-danger">Action could not be saved. Check the refreshed business record before retrying.</p>}
    {mutation.isSuccess&&<p role="status" className="text-sm text-success">Business updated.</p>}
    <Button type="submit" disabled={!changed} isLoading={mutation.isPending} loadingText="Saving…">Save business status</Button>
  </form>;
}
