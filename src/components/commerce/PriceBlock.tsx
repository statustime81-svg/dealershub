import { formatCurrency } from "@/lib/formatters";
export function PriceBlock({price,unit}:{price:number;unit?:string}){return <p className="font-mono text-xl font-semibold">{formatCurrency(price)}{unit&&<span className="ml-2 font-sans text-xs font-normal text-muted">/ {unit}</span>}</p>;}
