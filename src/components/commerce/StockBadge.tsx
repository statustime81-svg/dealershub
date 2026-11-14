import type { StockAvailability } from "@/types/catalog";
const labels:Record<StockAvailability,string>={in_stock:'In stock',low_stock:'Low stock',out_of_stock:'Out of stock',enquire:'Enquire'};
export function StockBadge({availability}:{availability:StockAvailability}){return <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${availability==='in_stock'?'bg-green-50 text-success':availability==='out_of_stock'?'bg-red-50 text-danger':'bg-amber-50 text-warning'}`}>{labels[availability]}</span>;}
