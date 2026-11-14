import { Link } from "react-router-dom";
import { Package,Users,UsersRound,Store } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { QueryState } from "@/components/shared/QueryState";
import { useBusiness } from "@/hooks/useBusiness";
import { routes } from "@/config/routes";
import { useBusinessDashboardCounts } from "../dashboard.hooks";
import { ReportWorkspace } from "@/features/reports/components/ReportWorkspace";
export default function ManufacturerDashboardPage(){
 const{activeBusinessId}=useBusiness();const q=useBusinessDashboardCounts();
 return <div className="space-y-6"><PageHeader title="Dashboard" description="Overview of your business, orders and dealer network."/>
 <QueryState pending={q.isPending} error={q.isError} retry={q.refetch}>{q.data&&<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[{label:'Active products',value:q.data.products,icon:Package},{label:'Active dealers',value:q.data.dealers,icon:Users},{label:'Active salespeople',value:q.data.salespeople,icon:UsersRound},{label:'Stores',value:q.data.stores,icon:Store}].map(({label,value,icon:Icon})=><div key={label} className="rounded-xl border border-border bg-surface p-5"><div className="flex items-center gap-3"><Icon size={20} aria-hidden="true"/><p className="text-sm">{label}</p></div><p className="mt-3 font-mono text-3xl font-semibold">{value.toLocaleString('en-IN')}</p></div>)}</div>}</QueryState>
 <section className="flex flex-wrap gap-2" aria-label="Quick actions">{[['Add product',routes.manufacturer.addProduct],['Manage dealers',routes.manufacturer.dealers],['Sales team',routes.manufacturer.salesTeam],['Review orders',routes.manufacturer.orders]].map(([name,path])=><Link key={path} className="inline-flex min-h-11 items-center rounded-lg border border-border bg-surface px-4 text-sm font-medium hover:bg-lime" to={path}>{name}</Link>)}</section>
 {activeBusinessId&&<ReportWorkspace key={activeBusinessId} businessId={activeBusinessId}/>}</div>;
}
