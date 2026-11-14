import { Link } from "react-router-dom";
import { routeBuilders } from "@/config/routes";
import { formatCurrency } from "@/lib/formatters";
import type { WorkspaceReport } from "@/features/reports/reports.api";
export function RecentOrdersTable({orders}:{orders:WorkspaceReport['recent']}){return <div className="overflow-x-auto rounded-xl border border-border bg-surface"><table className="w-full text-left text-sm"><caption className="sr-only">Recent business orders</caption><thead className="bg-soft"><tr><th className="p-3">Order</th><th>Dealer</th><th>Status</th><th>Value</th></tr></thead><tbody>{orders.map(o=><tr key={o.id} className="border-t border-border"><td className="p-3"><Link className="underline" to={routeBuilders.manufacturerOrder(o.id)}>ORD-{o.order_number}</Link></td><td>{o.dealer_name}</td><td className="capitalize">{o.status}</td><td className="font-mono">{formatCurrency(o.grand_total)}</td></tr>)}</tbody></table></div>;}
