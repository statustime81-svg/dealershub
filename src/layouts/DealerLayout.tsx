import "@/styles/dealer-storefront.css";
import { useId, useState } from "react";
import { Link, NavLink, Outlet, useMatch, useNavigate } from "react-router-dom";
import { LogOut,Menu,ShoppingCart,X,Package } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "@/features/auth/auth.api";
import { useAuthorizedStores } from "@/features/storefront/storefront.hooks";
import { useCart } from "@/features/cart/cart.hooks";
import { routeBuilders,routes } from "@/config/routes";

export default function DealerLayout(){
  const {user}=useAuth();const navigate=useNavigate();const menuId=useId();const switchId=useId();
  const stores=useAuthorizedStores();const match=useMatch("/store/:storeId/*");
  const current=stores.data?.find(store=>store.id===match?.params.storeId);const cart=useCart(current?.id??"");
  const [open,setOpen]=useState(false);const[busy,setBusy]=useState(false);const[error,setError]=useState("");
  const home=current?routeBuilders.store(current.id):routes.dealer.stores;
  const close=()=>setOpen(false);
  async function logout(){setBusy(true);setError("");try{await signOut();navigate(routes.auth.login,{replace:true});}catch{setError("Unable to sign out. Please try again.");}finally{setBusy(false);}}
  const navigation=[{name:"Store",to:home,end:true},{name:"My orders",to:routes.dealer.orders},{name:"Profile",to:routes.dealer.profile}];
  return <div className="ds-shell flex min-h-dvh flex-col bg-canvas font-sans text-foreground">
    <a href="#dealer-content" className="fixed -top-20 left-4 z-[100] rounded-lg bg-lime p-3 text-midnight focus:top-3">Skip to content</a>
    <header className="sticky top-0 z-40 border-b border-white/10 bg-midnight text-white shadow-sm">
      <div className="mx-auto flex min-h-12 max-w-[1440px] flex-wrap items-center gap-4 px-4 py-2 sm:px-6 lg:gap-7">
        <Link to={home} onClick={close} className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight" aria-label="DealersHub store home"><Package size={23} className="text-lime" aria-hidden="true"/>DealersHub</Link>
        <nav aria-label="Dealer navigation" className="hidden items-center gap-1 md:flex">{navigation.map(item=><NavLink key={item.name} to={item.to} end={item.end} onClick={close} className={({isActive})=>`inline-flex min-h-7 items-center rounded-full px-3 text-xs font-medium transition-colors ${isActive?"bg-lime text-midnight":"text-slate-200 hover:bg-white/10"}`}>{item.name}</NavLink>)}</nav>
        <div className="ml-auto flex items-center gap-3">
          {current&&<Link to={routeBuilders.cart(current.id)} className="relative inline-flex size-9 items-center justify-center rounded-full hover:bg-white/10" aria-label={`Cart${cart.data?`, ${cart.data.items.length} product lines`:""}`}><ShoppingCart size={19}/>{Boolean(cart.data?.items.length)&&<span className="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-lime px-1 text-[10px] font-semibold text-midnight">{cart.data?.items.length}</span>}</Link>}
          <Link to={routes.dealer.profile} className="flex items-center gap-2" title={user?.email}><span className="grid size-8 place-items-center rounded-full bg-white text-xs font-semibold text-midnight">{(user?.email?.[0]??"D").toUpperCase()}</span><span className="hidden lg:block"><strong className="block max-w-36 truncate text-xs font-medium">{user?.email}</strong><small className="text-[10px] text-slate-400">Dealer account</small></span></Link>
          <button type="button" aria-label="Sign out" disabled={busy} onClick={()=>{void logout();}} className="grid size-9 place-items-center rounded-full text-slate-300 hover:bg-white/10 disabled:opacity-50"><LogOut size={17}/></button>
          <button type="button" onClick={()=>setOpen(!open)} aria-label={open?"Close menu":"Open menu"} aria-expanded={open} aria-controls={menuId} className="grid size-9 place-items-center rounded-lg md:hidden">{open?<X size={20}/>:<Menu size={20}/>}</button>
        </div>
      </div>
      {open&&<nav id={menuId} aria-label="Mobile dealer navigation" className="mx-auto flex max-w-[1440px] flex-wrap gap-2 border-t border-white/10 p-3 md:hidden">{navigation.map(item=><NavLink key={item.name} to={item.to} end={item.end} onClick={close} className={({isActive})=>`rounded-full px-4 py-2 text-xs ${isActive?"bg-lime text-midnight":"text-slate-200"}`}>{item.name}</NavLink>)}</nav>}
    </header>
    {((stores.data?.length??0)>1)&&<div className="border-b border-border bg-surface"><div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
      {(stores.data?.length??0)>1&&<div className="flex min-w-0 items-center gap-2"><label htmlFor={switchId} className="text-xs text-muted">Store</label><select id={switchId} value={current?.id??""} onChange={event=>{const next=stores.data?.find(item=>item.id===event.target.value);if(next){navigate(routeBuilders.store(next.id));close();}}} className="min-h-9 max-w-64 rounded-lg border border-border bg-surface px-2 text-xs"><option value="" disabled>Select authorized store</option>{stores.data?.map(store=><option key={store.id} value={store.id}>{store.businessName} · {store.name}</option>)}</select></div>}

    </div></div>}
    {error&&<p role="alert" className="mx-auto w-full max-w-[1440px] px-4 py-3 text-sm text-danger">{error}</p>}
    <main id="dealer-content" className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-5 sm:px-6"><Outlet/></main>
    <footer className="mt-8 border-t border-border bg-surface"><div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-4 py-5 text-xs sm:px-6"><div><strong className="font-semibold">{current?.businessName??"DealersHub"}</strong><p className="mt-1 text-[11px] text-muted">Private wholesale commerce · Powered by DealersHub</p></div><div className="flex gap-5"><Link to={home}>Store</Link><Link to={routes.dealer.orders}>My orders</Link></div></div></footer>
  </div>;
}
