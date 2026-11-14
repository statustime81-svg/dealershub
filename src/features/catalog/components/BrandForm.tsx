import { TaxonomyForm } from "@/features/super-admin/components/TaxonomyForm";
import type { TaxonomyRow } from "@/features/super-admin/configuration.schemas";
export function BrandForm({row,onClose}:{row?:TaxonomyRow;onClose:()=>void}){return <TaxonomyForm kind="brands" row={row} onClose={onClose}/>;}
