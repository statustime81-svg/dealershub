import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { accountAdminAction } from "@/features/auth/account-admin.api";
export function DeleteUserPanel({userId,email,onCancel,onDeleted}:{userId:string;email:string|null;onCancel:()=>void;onDeleted:()=>void}){
 const client=useQueryClient();const[confirmation,setConfirmation]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");const expected=email||userId;
 async function submit(event:React.FormEvent<HTMLFormElement>){event.preventDefault();if(busy||confirmation.trim().toLowerCase()!==expected.toLowerCase())return;setBusy(true);setError("");try{await accountAdminAction("admin-delete-user",{userId,confirmation:confirmation.trim()});onDeleted();void client.invalidateQueries();}catch(e){setError(e instanceof Error?e.message:"User could not be deleted.");setBusy(false);}}
 return <form onSubmit={submit} className="space-y-3 rounded-xl border border-red-200 bg-red-50/40 p-4"><h2 className="text-sm font-semibold text-danger">Delete user account</h2><p className="text-xs leading-5 text-muted">This permanently removes the login and unused access/cart records. Accounts with business ownership, order history or protected linked records cannot be deleted.</p><Input label={`Type ${expected} to confirm`} value={confirmation} onChange={event=>setConfirmation(event.target.value)} autoComplete="off" required maxLength={254} disabled={busy}/>{error&&<p role="alert" className="text-sm text-danger">{error}</p>}<div className="flex gap-2"><Button type="submit" size="sm" variant="danger" isLoading={busy} disabled={confirmation.trim().toLowerCase()!==expected.toLowerCase()}>Delete permanently</Button><Button size="sm" variant="secondary" disabled={busy} onClick={onCancel}>Cancel</Button></div></form>;
}
