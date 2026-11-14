import type { ReactNode } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
export function QueryState({pending,error,retry,children}:{pending:boolean;error:boolean;retry:()=>unknown;children:ReactNode}){
 if(pending)return <Spinner label="Loading workspace"/>;
 if(error)return <div className="rounded-xl border border-border bg-surface p-5"><p role="alert" className="text-sm text-danger">Data could not load. Refresh and try again.</p><Button variant="secondary" className="mt-3" onClick={()=>{void retry();}}>Try again</Button></div>;
 return <>{children}</>;
}
