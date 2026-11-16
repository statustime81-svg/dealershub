import { Link } from "react-router-dom";
import { Package, Users, UsersRound, Store, ArrowUpRight } from "lucide-react";
import { QueryState } from "@/components/shared/QueryState";
import { useBusiness } from "@/hooks/useBusiness";
import { routes } from "@/config/routes";
import { useBusinessDashboardCounts } from "../dashboard.hooks";
import { ReportWorkspace } from "@/features/reports/components/ReportWorkspace";
import "@/styles/manufacturer-dashboard.css";

export default function ManufacturerDashboardPage() {
  const { activeBusinessId } = useBusiness();
  const counts = useBusinessDashboardCounts();
  const metrics = counts.data ? [
    { label: "Active products", value: counts.data.products, Icon: Package, href: routes.manufacturer.products },
    { label: "Active dealers", value: counts.data.dealers, Icon: Users, href: routes.manufacturer.dealers },
    { label: "Active salespeople", value: counts.data.salespeople, Icon: UsersRound, href: routes.manufacturer.salesTeam },
    { label: "Stores", value: counts.data.stores, Icon: Store, href: routes.manufacturer.store },
  ] : [];
  const actions = [
    ["Add product", routes.manufacturer.addProduct],
    ["Manage dealers", routes.manufacturer.dealers],
    ["Sales team", routes.manufacturer.salesTeam],
    ["Review orders", routes.manufacturer.orders],
  ];
  return (
    <div className="md-dashboard">
      <header className="md-dashboard-heading">
        <h1>Dashboard</h1>
        <p>Overview of your business, orders and dealer network.</p>
      </header>
      <QueryState pending={counts.isPending} error={counts.isError} retry={counts.refetch}>
        {counts.data && <section className="md-metrics" aria-label="Business totals">
          {metrics.map(({ label, value, Icon, href }, index) => (
            <Link key={label} to={href} className="md-metric" style={{ animationDelay: `${index * 40}ms` }}>
              <span className="md-metric-icon"><Icon size={19} aria-hidden="true" /></span>
              <span className="md-metric-body"><span>{label}</span><strong>{value.toLocaleString("en-IN")}</strong></span>
              <ArrowUpRight size={15} className="md-metric-arrow" aria-hidden="true" />
            </Link>
          ))}
        </section>}
      </QueryState>
      <section className="md-actions" aria-label="Quick actions">
        {actions.map(([label, href]) => <Link key={href} to={href}>{label}<ArrowUpRight size={13} aria-hidden="true" /></Link>)}
      </section>
      {activeBusinessId && <div className="md-report"><ReportWorkspace key={activeBusinessId} businessId={activeBusinessId} compact /></div>}
    </div>
  );
}
