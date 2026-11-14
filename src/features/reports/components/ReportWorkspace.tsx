import { useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { QueryState } from "@/components/shared/QueryState";
import { formatCurrency,formatDateTime } from "@/lib/formatters";
import { routeBuilders } from "@/config/routes";
import { useWorkspaceReport } from "../reports.hooks";
function iso(d:Date){return d.toISOString().slice(0,10);}
export function ReportWorkspace({businessId,platform=false}:{businessId:string|null;platform?:boolean}){
 const[range,setRange]=useState(()=>{const now=new Date();const from=new Date(now);from.setUTCDate(now.getUTCDate()-29);return{from:iso(from),to:iso(now)};});
 const[from,setFrom]=useState(range.from);const[to,setTo]=useState(range.to);const[error,setError]=useState("");const exclusive=new Date(range.to+'T00:00:00Z');exclusive.setUTCDate(exclusive.getUTCDate()+1);
 const q=useWorkspaceReport(businessId,range.from,iso(exclusive),platform);
 return <div className="space-y-5"><form className="flex flex-wrap items-end gap-3" onSubmit={e=>{e.preventDefault();const a=Date.parse(from),b=Date.parse(to);if(!Number.isFinite(a)||!Number.isFinite(b)||b<a||b-a>365*86400000){setError("Choose a valid range of at most 366 days.");return;}setError("");setRange({from,to});}}><Input type="date" label="From (UTC)" value={from} required onChange={e=>setFrom(e.target.value)}/><Input type="date" label="Through (UTC)" value={to} required onChange={e=>setTo(e.target.value)}/><Button type="submit">Apply dates</Button></form>
 {error&&<p role="alert" className="text-sm text-danger">{error}</p>}
 <QueryState pending={q.isPending} error={q.isError} retry={q.refetch}>{q.data&&<>
 <div className="grid gap-4 sm:grid-cols-2"><div className="rounded-xl border border-border bg-surface p-5"><p className="text-sm text-muted">Submitted orders</p><p className="mt-2 font-mono text-3xl font-semibold">{q.data.orders}</p></div><div className="rounded-xl border border-border bg-surface p-5"><p className="text-sm text-muted">Submitted order value</p><p className="mt-2 font-mono text-3xl font-semibold">{formatCurrency(q.data.submittedValue)}</p></div></div>
 <p className="text-xs leading-5 text-muted">Totals include all order statuses within the selected UTC dates. They do not represent collected payments or revenue.</p>
 <div className="grid gap-4 lg:grid-cols-2"><section className="rounded-xl border border-border bg-surface p-5"><h2 className="mb-4 text-lg font-semibold">Orders by status</h2>{!q.data.statuses.length&&<p className="text-sm text-muted">No orders in this period.</p>}{q.data.statuses.map(row=><div key={row.status} className="mb-3"><div className="flex justify-between text-sm"><span className="capitalize">{row.status}</span><span className="font-mono">{row.orders}</span></div><div className="mt-2 h-2 rounded bg-soft"><div className="h-2 rounded bg-lime" style={{width:`${q.data?row.orders/Math.max(q.data.orders,1)*100:0}%`}}/></div></div>)}</section>
 <section className="max-h-96 overflow-auto rounded-xl border border-border bg-surface p-5"><h2 className="mb-3 text-lg font-semibold">Daily order trend</h2><table className="w-full text-left text-xs"><thead><tr><th className="py-2">UTC date</th><th>Orders</th><th>Value</th></tr></thead><tbody>{q.data.daily.map(r=><tr key={r.day} className="border-t border-border"><td className="py-2 font-mono">{r.day}</td><td className="font-mono">{r.orders}</td><td className="font-mono">{formatCurrency(r.value)}</td></tr>)}</tbody></table>{!q.data.daily.length&&<p className="py-3 text-sm text-muted">No orders in this period.</p>}</section></div>
 <section className="overflow-x-auto rounded-xl border border-border bg-surface p-5"><h2 className="mb-3 text-lg font-semibold">Recent orders</h2><table className="w-full min-w-[600px] text-left text-sm"><thead><tr>{['Order','Dealer','Status','Value','Created'].map(s=><th key={s} className="py-2">{s}</th>)}</tr></thead><tbody>{q.data.recent.map(r=><tr key={r.id} className="border-t border-border"><td className="py-3 font-mono">{platform?`ORD-${r.order_number}`:<Link className="underline underline-offset-4" to={routeBuilders.manufacturerOrder(r.id)}>ORD-{r.order_number}</Link>}</td><td>{r.dealer_name}</td><td className="capitalize">{r.status}</td><td className="font-mono">{formatCurrency(r.grand_total)}</td><td className="text-xs">{formatDateTime(r.created_at)}</td></tr>)}</tbody></table></section>
 </>}</QueryState></div>;
}
