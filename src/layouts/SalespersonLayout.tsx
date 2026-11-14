import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/shared/Logo";
import { BusinessSwitcher } from "./components/BusinessSwitcher";
import { routes } from "@/config/routes";
import { useAuth } from "@/hooks/useAuth";
import { useBusiness } from "@/hooks/useBusiness";
import { signOut } from "@/features/auth/auth.api";
export default function SalespersonLayout() {
  const { user } = useAuth(); const { activeBusinessId, activeMembership } = useBusiness();
  const navigate = useNavigate(); const [busy, setBusy] = useState(false); const [error, setError] = useState(false);
  const query = `?businessId=${encodeURIComponent(activeBusinessId ?? "")}`;
  const links = [["Assigned dealers", routes.salesperson.dealers], ["Order history", routes.salesperson.orders]];
  const navigation = <nav aria-label="Salesperson navigation" className="flex flex-wrap gap-2 lg:flex-col">
    {links.map(([label, href]) => <NavLink key={href} to={`${href}${query}`} className={({ isActive }) =>
      `inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium ${isActive ? "bg-lime text-midnight" : "text-slate-200 hover:bg-midnight-raised"}`}>{label}</NavLink>)}
  </nav>;
  return <div className="min-h-dvh bg-canvas">
    <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col gap-6 bg-midnight p-4 text-white lg:flex">
      <Logo to={`${routes.salesperson.dealers}${query}`} /><BusinessSwitcher />{navigation}
      <Link to={routes.auth.acceptInvitation} className="mt-auto inline-flex min-h-11 items-center text-xs text-slate-300">Business invitations</Link>
    </aside>
    <div className="lg:pl-64">
      <header className="sticky top-0 z-40 border-b border-border bg-surface px-4 py-3 shadow-sm sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-sm font-semibold">{activeMembership?.business.company_name}</p><p className="mt-1 text-xs text-muted">Salesperson workspace</p></div>
          <div className="flex items-center gap-3"><span className="hidden max-w-48 truncate text-xs text-muted sm:block">{user?.email}</span>
            <Button size="sm" variant="secondary" isLoading={busy} loadingText="Signing out…" onClick={() => {
              setBusy(true); setError(false); void signOut().then(() => navigate(routes.auth.login, { replace: true }))
                .catch(() => setError(true)).finally(() => setBusy(false));
            }}>Sign out</Button></div>
        </div>
        {error && <p role="alert" className="mt-3 text-xs text-danger">Sign-out failed. Try again.</p>}
      </header>
      <div className="space-y-4 bg-midnight p-4 text-white lg:hidden"><BusinessSwitcher />{navigation}</div>
      <main className="p-4 sm:p-6"><Outlet /></main>
    </div>
  </div>;
}
