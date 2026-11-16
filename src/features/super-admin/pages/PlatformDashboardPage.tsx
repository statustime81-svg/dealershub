import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight,Building2,Users,Tags,CreditCard,BarChart3,RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { OrderStatusBadge } from "@/components/commerce/OrderStatusBadge";
import { orderStatusSchema } from "@/features/orders/orders.schemas";
import { useWorkspaceReport } from "@/features/reports/reports.hooks";
import { formatCurrency,formatDateTime } from "@/lib/formatters";
import { routes } from "@/config/routes";
import { usePlatformOverview } from "../super-admin.hooks";
import { PlatformMetrics } from "../components/PlatformMetrics";
import { PlatformTrend,PlatformStatusChart } from "../components/PlatformCharts";
import { dashboardRange } from "../dashboard-chart.utils";
import "@/styles/platform-overview.css";
export default function PlatformDashboardPage(){
  const overview=usePlatformOverview();
  const [period,setPeriod]=useState(()=>({days:30,...dashboardRange(30)}));
  const report=useWorkspaceReport(null,period.from,period.to,true);
  const quick=[{label:"Manage businesses",href:routes.admin.businesses,Icon:Building2},{label:"View users",href:routes.admin.users,Icon:Users},{label:"Manage categories",href:routes.admin.categories,Icon:Tags},{label:"Subscription plans",href:routes.admin.plans,Icon:CreditCard},{label:"Platform reports",href:routes.admin.reports,Icon:BarChart3}];
  return <div className="po-dashboard">
    <header className="po-page-heading"><div><p className="po-eyebrow">DEALERSHUB / SUPER ADMIN</p><h1>Platform overview</h1><p>Your businesses, dealer network and order activity at a glance.</p></div><Button size="sm" variant="secondary" disabled={overview.isFetching||report.isFetching} onClick={()=>{void overview.refetch();void report.refetch();}}><RefreshCw size={14} aria-hidden="true"/>Refresh data</Button></header>
    <div className="po-toolbar"><nav aria-label="Platform shortcuts"><span aria-current="page">Overview</span><Link to={routes.admin.businesses}>Businesses</Link><Link to={routes.admin.users}>Users</Link><Link to={routes.admin.reports}>Reports</Link></nav><label>Order activity<select value={period.days} onChange={event=>{const days=Number(event.target.value);if([7,30,90].includes(days))setPeriod({days,...dashboardRange(days)});}}><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option></select></label></div>
    {overview.isPending?<Spinner label="Loading platform totals"/>:overview.isError?<div className="po-card"><p role="alert">Platform totals could not load.</p><Button variant="secondary" onClick={()=>{void overview.refetch();}}>Try again</Button></div>:<PlatformMetrics overview={overview.data}/>}
    <div className="po-period-label"><span>ORDER ACTIVITY · LAST {period.days} DAYS</span><small>UTC dates · submitted order value, not collected revenue</small></div>
    <div className="po-analytics-grid"><div className="po-report-region" aria-busy={report.isFetching}>
      {report.isPending?<div className="po-card"><Spinner label="Loading charts"/></div>:report.isError?<div className="po-card"><h2>Order activity unavailable</h2><p className="po-muted">The existing get_workspace_report API could not load. Platform totals above remain independent.</p><Button className="mt-3" variant="secondary" onClick={()=>{void report.refetch();}}>Retry charts</Button></div>:<><PlatformTrend report={report.data} from={period.from} to={period.to}/><PlatformStatusChart report={report.data}/></>}
    </div><section className="po-card po-quick"><div className="po-card-heading"><h2>Quick actions</h2></div><div>{quick.map(({label,href,Icon},i)=><Link className={i===0?"po-quick-primary":""} key={href} to={href}><Icon size={16}/><span>{label}</span><ArrowRight size={14}/></Link>)}</div><p>Manage your platform from one workspace.</p></section></div>
    <section className="po-card po-recent"><div className="po-card-heading"><div><h2>Recent orders</h2><p className="po-muted">Latest activity within the selected period</p></div><Link to={routes.admin.reports}>View reports <ArrowRight size={14}/></Link></div>
      {report.isPending?<Spinner label="Loading recent orders"/>:report.isError?<p className="po-muted">Recent orders could not load. Use Retry charts above.</p>:!report.data.recent.length?<div className="po-chart-empty">No orders in this period.</div>:<div className="po-table-scroll"><table><thead><tr><th>Order ID</th><th>Dealer</th><th>Order value</th><th>Status</th><th>Ordered on</th></tr></thead><tbody>{report.data.recent.map(row=>{const status=orderStatusSchema.safeParse(row.status);return <tr key={row.id}><td className="po-order-id">ORD-{row.order_number}</td><td>{row.dealer_name}</td><td className="po-money">{formatCurrency(row.grand_total)}</td><td>{status.success?<OrderStatusBadge status={status.data}/>:row.status}</td><td>{formatDateTime(row.created_at)}</td></tr>;})}</tbody></table></div>}
    </section>
    <p className="po-footnote">Order totals include all statuses. Sandbox fixture orders may appear in the existing report data. No collected-payment or growth figures are inferred.</p>
  </div>;
}
