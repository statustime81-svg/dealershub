import { useRef,useState } from "react";
import { Outlet,useNavigate } from "react-router-dom";
import { Menu,X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { routes } from "@/config/routes";
import { signOut } from "@/features/auth/auth.api";
import { AdminSidebar } from "./components/AdminSidebar";
export default function SuperAdminLayout(){
  const dialog=useRef<HTMLDialogElement>(null);const{user}=useAuth();const navigate=useNavigate();
  const[busy,setBusy]=useState(false);const[error,setError]=useState(false);
  function close(){dialog.current?.close();}
  return <div className="min-h-dvh bg-canvas">
    <aside className="fixed inset-y-0 left-0 hidden w-56 overflow-y-auto lg:block"><AdminSidebar/></aside>
    <dialog ref={dialog} aria-label="Platform navigation" className="fixed inset-y-0 left-0 right-auto m-0 h-dvh max-h-dvh w-72 max-w-[90vw] border-0 bg-midnight p-0 text-white backdrop:bg-black/40">
      <div className="flex h-full flex-col"><div className="flex justify-end px-3 pt-3"><Button autoFocus variant="ghost" size="icon" aria-label="Close platform navigation" onClick={close} className="text-white hover:bg-midnight-raised"><X size={20} aria-hidden="true"/></Button></div>
        <div className="min-h-0 flex-1 overflow-y-auto"><AdminSidebar onNavigate={close}/></div></div>
    </dialog>
   <div className="lg:pl-56"><header className="sticky top-0 z-40 border-b border-border bg-surface px-4 py-3 sm:px-6">
      <div className="flex min-h-11 items-center justify-between gap-3"><div className="flex items-center gap-3"><Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open platform navigation" onClick={()=>{if(dialog.current&&!dialog.current.open)dialog.current.showModal();}}><Menu size={20} aria-hidden="true"/></Button>
        <p className="text-sm font-semibold">DealersHub platform</p></div><div className="flex items-center gap-3"><span className="hidden max-w-48 truncate text-xs text-muted sm:block">{user?.email}</span>
        <Button variant="secondary" size="sm" isLoading={busy} loadingText="Signing out…" onClick={()=>{
          setBusy(true);setError(false);void signOut().then(()=>navigate(routes.auth.login,{replace:true})).catch(()=>setError(true)).finally(()=>setBusy(false));
        }}>Sign out</Button></div></div>
      {error&&<p role="alert" className="mt-2 text-xs text-danger">Sign-out failed. Try again.</p>}
    </header><main className="p-4 sm:p-6"><Outlet/></main></div>
  </div>;
}
