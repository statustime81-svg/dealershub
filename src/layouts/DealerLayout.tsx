import { useId, useState } from "react";
import { Link, NavLink, Outlet, useMatch, useNavigate } from "react-router-dom";
import { ArrowRight, ChevronDown, LogOut, Menu, Package, Search, ShieldCheck, ShoppingCart, Store, UserRound, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "@/features/auth/auth.api";
import { useAuthorizedStores } from "@/features/storefront/storefront.hooks";
import { useCart } from "@/features/cart/cart.hooks";
import { StoreMediaImage } from "@/features/stores/components/StorePreview";
import { routeBuilders, routes } from "@/config/routes";
import "@/styles/dealer-storefront.css";

export default function DealerLayout() {
  const { user } = useAuth(); const navigate = useNavigate(); const menuId = useId(); const selectId = useId();
  const stores = useAuthorizedStores(); const match = useMatch("/store/:storeId/*");
  const current = stores.data?.find(store => store.id === match?.params.storeId);
  const cart = useCart(current?.id ?? "");
  const [menuOpen, setMenuOpen] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const home = current ? routeBuilders.store(current.id) : routes.dealer.stores;
  const first = (user?.email?.[0] ?? "D").toUpperCase();
  async function logout() {
    setBusy(true); setError("");
    try { await signOut(); navigate(routes.auth.login, { replace: true }); }
    catch { setError("Unable to sign out. Please try again."); }
    finally { setBusy(false); }
  }
  const close = () => setMenuOpen(false);
  return <div className="ds-shell">
    <a className="ds-skip" href="#dealer-content">Skip to content</a>
    <div className="ds-topline"><div className="ds-container"><span><ShieldCheck size={13}/> Your authorized wholesale workspace</span><Link to={routes.auth.acceptInvitation}>Business invitations <ArrowRight size={12}/></Link></div></div>
    <header className="ds-header">
      <div className="ds-container ds-header-main">
        <Link to={home} className="ds-brand" onClick={close} aria-label={current ? `${current.name} home` : "Dealer storefront home"}>
          {current?.logoPath ? <StoreMediaImage bucket="business-logos" path={current.logoPath} alt="" className="ds-brand-image"/> : <span className="ds-brand-fallback"><Store size={24}/></span>}
          <span><strong>{current?.businessName ?? "DealersHub"}</strong><small>{current?.name ?? "Your wholesale workspace"}</small></span>
        </Link>
        {current && <form className="ds-header-search" role="search" onSubmit={event => {
          event.preventDefault(); const form = new FormData(event.currentTarget); const search = String(form.get("search") ?? "").trim().slice(0, 200);
          navigate(`${routeBuilders.storeProducts(current.id)}${search ? `?search=${encodeURIComponent(search)}` : ""}`); close();
        }}><Search size={18} aria-hidden="true"/><input name="search" type="search" maxLength={200} placeholder="Search this store's products…" aria-label={`Search products in ${current.name}`}/><button type="submit" aria-label="Search products"><ArrowRight size={17}/></button></form>}
        <div className="ds-account-actions">
          {current && <Link className="ds-cart-link" to={routeBuilders.cart(current.id)} aria-label={`Cart for ${current.name}${cart.data ? `, ${cart.data.items.length} product lines` : ""}`}><ShoppingCart size={21}/><span>Cart</span>{cart.data && cart.data.items.length > 0 && <b>{cart.data.items.length}</b>}</Link>}
          <Link className="ds-profile-link" to={routes.dealer.profile} title={user?.email}><span>{first}</span><UserRound size={17}/></Link>
          <button className="ds-menu-toggle" type="button" aria-expanded={menuOpen} aria-controls={menuId} aria-label={menuOpen ? "Close menu" : "Open menu"} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={21}/> : <Menu size={21}/>}</button>
        </div>
      </div>
      <div className="ds-container ds-nav-row">
        <nav id={menuId} className={`ds-main-nav ${menuOpen ? "ds-nav-open" : ""}`} aria-label="Dealer navigation">
          <NavLink to={home} end onClick={close}>Store home</NavLink>
          {current && <NavLink to={routeBuilders.storeProducts(current.id)} onClick={close}>All products</NavLink>}
          <NavLink to={routes.dealer.orders} onClick={close}><Package size={15}/> My orders</NavLink>
          <NavLink to={routes.dealer.profile} onClick={close}>Profile</NavLink>
          <button className="ds-signout" type="button" disabled={busy} onClick={() => { void logout(); }}><LogOut size={15}/>{busy ? "Signing out…" : "Sign out"}</button>
        </nav>
        {(stores.data?.length ?? 0) > 1 ? <div className="ds-store-switch"><label htmlFor={selectId}>Switch store</label><select id={selectId} value={current?.id ?? ""} onChange={event => {
          const selected = stores.data?.find(store => store.id === event.target.value); if (selected) { navigate(routeBuilders.store(selected.id)); close(); }
        }}><option value="" disabled>Select authorized store</option>{stores.data?.map(store => <option key={store.id} value={store.id}>{store.businessName} · {store.name}</option>)}</select><ChevronDown size={13} aria-hidden="true"/></div> : <span className="ds-private-label"><span/>{current?.verified ? "Verified supplier · private access" : "Private dealer access"}</span>}
      </div>
    </header>
    {error && <p role="alert" className="ds-container ds-error">{error}</p>}
    <main className="ds-container ds-main" id="dealer-content"><Outlet/></main>
    <footer className="ds-footer"><div className="ds-container"><div><strong>{current?.businessName ?? "DealersHub"}</strong><p>{current ? "Your authorized wholesale store." : "Private wholesale commerce for your business."}</p></div><div className="ds-footer-links"><Link to={home}>Store home</Link><Link to={routes.dealer.orders}>My orders</Link><Link to={routes.auth.acceptInvitation}>Invitations</Link></div><span className="ds-powered">Powered by <b>DealersHub</b></span></div></footer>
  </div>;
}
