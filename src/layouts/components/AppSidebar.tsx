import {
  BarChart3, Boxes, Building2, ClipboardList, LayoutDashboard,
  Package, Store, Users, UsersRound, type LucideIcon,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { Logo } from "@/components/shared/Logo";
import { navigation } from "@/config/navigation";
import { routes } from "@/config/routes";
import { cn } from "@/lib/utils";
import { BusinessSwitcher } from "./BusinessSwitcher";
const icons: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard, store: Store, products: Package,
  inventory: Boxes, orders: ClipboardList, dealers: Users,
  "sales-team": UsersRound, reports: BarChart3, business: Building2,
};
const connectedRoutes = new Set<string>([
  routes.manufacturer.dashboard, routes.manufacturer.products,
  routes.manufacturer.store, routes.manufacturer.dealers,
  routes.manufacturer.salesTeam, routes.manufacturer.orders,
  routes.manufacturer.inventory, routes.manufacturer.reports, routes.manufacturer.business,
]);
export function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
  return <div className="flex min-h-full flex-col bg-midnight px-4 py-4 text-white">
    <Logo to={routes.manufacturer.dashboard} className="mb-5 px-2" />
    <BusinessSwitcher onSwitch={onNavigate} />
    <nav aria-label="Manufacturer navigation" className="mt-6 space-y-1">
      {navigation.business_admin.map((item) => {
        const Icon = icons[item.icon] ?? LayoutDashboard;
        if (!connectedRoutes.has(item.href)) return (
          <div key={item.href} aria-disabled="true" title="This section is not available yet."
            className="flex min-h-11 cursor-not-allowed items-center gap-3 rounded-lg px-3 text-sm text-slate-500">
            <Icon size={19} aria-hidden="true" /><span>{item.label}</span>
          </div>
        );
        return <NavLink key={item.href} to={item.href}
          end={item.href === routes.manufacturer.dashboard}
          onClick={onNavigate} className={({ isActive }) => cn(
            "app-transition flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium",
            isActive ? "bg-lime text-midnight" : "text-slate-200 hover:bg-midnight-raised",
          )}>
          <Icon size={19} aria-hidden="true" /><span>{item.label}</span>
        </NavLink>;
      })}
    </nav>
    <div className="mt-auto shrink-0 border-t border-white/10 pt-5">
      <NavLink to={routes.auth.acceptInvitation} onClick={onNavigate}
        className="inline-flex min-h-11 items-center text-xs text-slate-300 hover:text-white">
        Business invitations
      </NavLink>
    </div>
  </div>;
}
