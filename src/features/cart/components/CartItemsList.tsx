import { CartItem } from "@/components/commerce/CartItem";
import type { CartLine } from "../cart.schemas";
export function CartItemsList({items,storeId,disabled,onUpdate,onRemove}:{items:CartLine[];storeId:string;disabled:boolean;onUpdate:(item:CartLine,quantity:number)=>void;onRemove:(item:CartLine)=>void}){return <div className="rounded-xl border border-border bg-surface">{items.map(i=><CartItem key={`${i.id}:${i.quantity}`} item={i} storeId={storeId} disabled={disabled} onUpdate={q=>onUpdate(i,q)} onRemove={()=>onRemove(i)}/>)}</div>;}
