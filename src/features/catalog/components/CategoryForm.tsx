import { TaxonomyForm } from "@/features/super-admin/components/TaxonomyForm";
import type { TaxonomyRow } from "@/features/super-admin/configuration.schemas";
export function CategoryForm({row,onClose}:{row?:TaxonomyRow;onClose:()=>void}){return <TaxonomyForm kind="product_categories" row={row} onClose={onClose}/>;}
