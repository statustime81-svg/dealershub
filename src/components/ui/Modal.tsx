import { useEffect,useId,useRef,type ReactNode } from "react";
import { Button } from "./Button";
import { cn } from "@/lib/utils";
export function Modal({open,title,onClose,children,busy=false,className}:{open:boolean;title:string;onClose:()=>void;children:ReactNode;busy?:boolean;className?:string}){
 const ref=useRef<HTMLDialogElement>(null);const id=useId();
 useEffect(()=>{const d=ref.current;if(!d)return;const prior=document.activeElement;if(open&&!d.open)d.showModal();if(!open&&d.open)d.close();return()=>{if(d.open)d.close();if(prior instanceof HTMLElement&&prior.isConnected)prior.focus();};},[open]);
 return <dialog ref={ref} aria-labelledby={id} onCancel={e=>{e.preventDefault();if(!busy)onClose();}} className={cn("m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-auto rounded-xl border border-border bg-surface p-5 text-foreground shadow-xl backdrop:bg-midnight/60",className)}><div className="mb-5 flex items-center justify-between gap-4"><h2 id={id} className="text-lg font-semibold">{title}</h2><Button size="sm" variant="secondary" disabled={busy} onClick={onClose}>Close</Button></div>{children}</dialog>;
}
