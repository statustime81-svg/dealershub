import { useId } from "react";
import type { WorkspaceReport } from "@/features/reports/reports.api";
import { formatCurrency,formatNumber } from "@/lib/formatters";
import { compactAxis,completeTrend } from "../dashboard-chart.utils";
const colors:Record<string,string>={pending:"#e2e8f0",confirmed:"#c6f432",processing:"#0b1220",dispatched:"#94a3b8",delivered:"#22a06b",cancelled:"#f59e0b",rejected:"#dc2626"};
export function PlatformTrend({report,from,to}:{report:WorkspaceReport;from:string;to:string}){
  const id=useId();const rows=completeTrend(report.daily,from,to);
  const maxValue=Math.max(1,...rows.map(row=>row.value));const maxOrders=Math.max(1,...rows.map(row=>row.orders));
  const x=(i:number)=>54+i*472/Math.max(1,rows.length-1);const y=(n:number,max:number)=>190-n/max*142;
  const valuePoints=rows.map((row,i)=>`${x(i)},${y(row.value,maxValue)}`).join(" ");
  const orderPoints=rows.map((row,i)=>`${x(i)},${y(row.orders,maxOrders)}`).join(" ");
  const ticks=[...new Set([0,Math.floor((rows.length-1)/3),Math.floor(2*(rows.length-1)/3),rows.length-1])];
  return <section className="po-card po-trend"><div className="po-card-heading"><h2>Orders & value trend</h2><div className="po-legend"><span><i style={{background:"#a4d40c"}}/>Order value</span><span><i style={{background:"#94a3b8"}}/>Orders</span></div></div>
    <div className="po-chart-totals"><div><span>Submitted order value</span><strong>{formatCurrency(report.submittedValue)}</strong></div><div><span>Orders in period</span><strong>{formatNumber(report.orders)}</strong></div></div>
    {report.orders ? <svg className="po-trend-svg" viewBox="0 0 580 230" role="img" aria-labelledby={`${id}-title ${id}-desc`}>
      <title id={`${id}-title`}>Daily orders and submitted order value</title><desc id={`${id}-desc`}>Order value uses the left rupee axis. Order count uses the right axis. A daily data table follows.</desc>
      <defs><linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#c6f432" stopOpacity=".4"/><stop offset="100%" stopColor="#c6f432" stopOpacity="0"/></linearGradient></defs>
      {[0,.25,.5,.75,1].map(t=><g key={t}><line x1="54" x2="526" y1={y(t,1)} y2={y(t,1)} stroke="#e8edf3" strokeDasharray="3 4"/><text x="45" y={y(t,1)+4} textAnchor="end">₹{compactAxis(maxValue*t)}</text><text x="536" y={y(t,1)+4}>{(maxOrders*t).toFixed(maxOrders<4?1:0)}</text></g>)}
      <polygon points={`54,190 ${valuePoints} 526,190`} fill={`url(#${id}-fill)`}/>
      <polyline points={orderPoints} fill="none" stroke="#94a3b8" strokeWidth="2"/>
      <polyline points={valuePoints} fill="none" stroke="#a4d40c" strokeWidth="2.5"/>
      {rows.filter(row=>row.orders>0).map(row=>{const i=rows.indexOf(row);return <circle key={row.day} cx={x(i)} cy={y(row.value,maxValue)} r="4" fill="#a4d40c" tabIndex={0} aria-label={`${row.day}: ${row.orders} orders, ${formatCurrency(row.value)}`}><title>{row.day}: {row.orders} orders · {formatCurrency(row.value)}</title></circle>;})}
      {ticks.map(i=><text key={i} x={x(i)} y="214" textAnchor="middle">{rows[i]?.day.slice(5)}</text>)}
      <text x="54" y="22">VALUE (₹)</text><text x="526" y="22" textAnchor="end">ORDER COUNT</text>
    </svg>:<div className="po-chart-empty">No orders in this period.<small>Choose another date range to view activity.</small></div>}
    <details className="po-data-details"><summary>View daily data · UTC dates</summary><div className="po-table-scroll"><table><thead><tr><th>Date</th><th>Orders</th><th>Order value</th></tr></thead><tbody>{rows.map(row=><tr key={row.day}><td>{row.day}</td><td>{row.orders}</td><td>{formatCurrency(row.value)}</td></tr>)}</tbody></table></div></details>
  </section>;
}
export function PlatformStatusChart({report}:{report:WorkspaceReport}){
  const statuses=report.statuses.filter(row=>row.orders>0);let position=0;
  const gradient=statuses.map(row=>{const start=position;position+=row.orders/Math.max(report.orders,1)*100;return `${colors[row.status]??"#64748b"} ${start}% ${position}%`;}).join(",");
  return <section className="po-card po-status"><div className="po-card-heading"><h2>Order status</h2><span className="po-muted">Selected period</span></div>
    <div className="po-status-body"><div className="po-donut" role="img" aria-label={`${report.orders} orders; status breakdown listed alongside`} style={{background:statuses.length?`conic-gradient(${gradient})`:"#e8edf3"}}><div><strong>{formatNumber(report.orders)}</strong><span>Orders</span></div></div>
      <ul className="po-status-list">{statuses.length?statuses.map(row=><li key={row.status}><i style={{background:colors[row.status]??"#64748b"}}/><span>{row.status.replaceAll("_"," ")}</span><strong>{formatNumber(row.orders)}</strong><small>{(row.orders/Math.max(report.orders,1)*100).toFixed(1)}%</small></li>):<li>No orders in this period.</li>}</ul>
    </div>
  </section>;
}
