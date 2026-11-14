import { Button } from "./Button";
export function Pagination({page,total,pageSize=15,busy=false,onChange}:{page:number;total:number;pageSize?:number;busy?:boolean;onChange:(page:number)=>void}){
 const pages=Math.max(1,Math.ceil(total/pageSize));
 return <div className="flex flex-wrap items-center justify-between gap-3"><p aria-live="polite" className="text-xs text-muted">{total} records · Page {page} of {pages}</p><div className="flex gap-2"><Button size="sm" variant="secondary" disabled={busy||page<=1} onClick={()=>onChange(page-1)}>Previous</Button><Button size="sm" variant="secondary" disabled={busy||page>=pages} onClick={()=>onChange(page+1)}>Next</Button></div></div>;
}
