import { PageHeader } from "@/components/shared/PageHeader";
import { TaxonomyManager } from "../components/TaxonomyManager";
export default function PlatformBrandsPage(){return <div className="space-y-6"><PageHeader title="Brands" description="Maintain the brand names available to manufacturer stores."/><TaxonomyManager kind="brands"/></div>;}
