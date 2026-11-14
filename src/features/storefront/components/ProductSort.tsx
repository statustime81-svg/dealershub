import { Select } from "@/components/ui/Select";
import type { ProductSort as Sort } from "../storefront.schemas";
export function ProductSort({value,onChange}:{value:Sort;onChange:(value:Sort)=>void}){return <Select label="Sort products" value={value} onChange={e=>{const v=e.target.value;if(v==='newest'||v==='price_low'||v==='price_high')onChange(v);}}><option value="newest">Newest</option><option value="price_low">Price: low to high</option><option value="price_high">Price: high to low</option></Select>;}
