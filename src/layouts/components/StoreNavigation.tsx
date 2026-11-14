import { NavLink } from "react-router-dom";
import { routeBuilders } from "@/config/routes";
import { cn } from "@/lib/utils";
export function StoreNavigation({ storeId }: { storeId: string }) {
  const links = [["Store home", routeBuilders.store(storeId)], ["All products", routeBuilders.storeProducts(storeId)], ["Cart", routeBuilders.cart(storeId)]];
  return <nav aria-label="Store navigation" className="flex flex-wrap gap-2 border-b border-border pb-3">
    {links.map(([label, path]) => <NavLink key={path} to={path} end
      className={({ isActive }) => cn("inline-flex min-h-10 items-center rounded-lg px-4 text-sm font-medium", isActive ? "bg-midnight text-white" : "bg-surface text-muted hover:bg-soft")}>{label}</NavLink>)}
  </nav>;
}
