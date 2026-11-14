import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/shared/PageHeader";
import { TaxonomyManager } from "../components/TaxonomyManager";
export default function PlatformCategoriesPage(){
 const[kind,setKind]=useState<"business_categories"|"product_categories">("business_categories");
 return <div className="space-y-6"><PageHeader title="Categories" description="Maintain business and product categories shared across the platform."/>
 <div className="flex gap-2"><Button variant={kind==="business_categories"?"primary":"secondary"} onClick={()=>setKind("business_categories")}>Business categories</Button><Button variant={kind==="product_categories"?"primary":"secondary"} onClick={()=>setKind("product_categories")}>Product categories</Button></div>
 <TaxonomyManager key={kind} kind={kind}/></div>;
}
