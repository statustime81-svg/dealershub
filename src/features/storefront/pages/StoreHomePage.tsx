import { StoreMediaImage } from "@/features/stores/components/StorePreview";
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Boxes, ClipboardList, Package, ShieldCheck, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { routeBuilders, routes } from "@/config/routes";
import { useDealerStore, useDealerProducts } from "../storefront.hooks";
import type { DealerStorefront, ProductSort } from "../storefront.schemas";
import { DealerStoreHero } from "../components/DealerStoreHero";
import { DealerHomeProductTile } from "../components/DealerHomeProductTile";

function DealerShopHome({ store }: { store: DealerStorefront }) {
  const root = useRef<HTMLDivElement>(null); const [category, setCategory] = useState(""); const [sort, setSort] = useState<ProductSort>("newest");
  const overview = useDealerProducts({ storeId: store.id, page: 1, search: "", categoryId: "", brandId: "", sort: "newest" });
  const products = useDealerProducts({ storeId: store.id, page: 1, search: "", categoryId: category, brandId: "", sort });
  const allLink = category ? routeBuilders.storeCategory(store.id, category) : routeBuilders.storeProducts(store.id);
  useEffect(() => {
    const element = root.current; if (!element || !("IntersectionObserver" in window)) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (preference.matches) return;
    element.classList.add("ds-motion");
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add("ds-visible"); observer.unobserve(entry.target); }
    }), { threshold: .08 });
    element.querySelectorAll<HTMLElement>("[data-ds-reveal]").forEach(item => observer.observe(item));
    const stop = () => { if (preference.matches) { element.classList.remove("ds-motion"); observer.disconnect(); } };
    preference.addEventListener("change", stop);
    return () => { observer.disconnect(); preference.removeEventListener("change", stop); element.classList.remove("ds-motion"); };
  }, [products.data?.items.length, category, sort]);
  return <div className="ds-home" ref={root}>
    <DealerStoreHero key={store.id} store={store} product={overview.data?.items[0]}/>

    {store.categories.length > 0 && <section className="py-5" aria-label="Shop by category"><div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-lg font-semibold tracking-tight">Shop by Category</h2><Link className="inline-flex items-center gap-2 text-xs font-medium" to={routeBuilders.storeCategories(store.id)}>View all categories <ArrowRight size={14}/></Link></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{store.categories.slice(0,6).map(item => <Link to={routeBuilders.storeCategory(store.id,item.id)} key={item.id} className="group flex min-h-20 items-center gap-3 rounded-xl border border-border bg-white px-3 py-3 transition-colors hover:border-lime-hover focus-visible:outline-2 focus-visible:outline-info"><span className="flex h-12 w-12 shrink-0 items-center justify-center">{item.imagePath ? <StoreMediaImage bucket="store-banners" path={item.imagePath} alt={item.name} className="h-full w-full object-contain"/> : <Boxes size={32} strokeWidth={1.3} className="text-lime-hover"/>}</span><strong className="min-w-0 flex-1 text-xs font-semibold">{item.name}</strong><ArrowRight size={14} className="shrink-0"/></Link>)}</div></section>}
    <section className="pt-5" data-ds-reveal aria-label="Store products">
      <div className="mb-4 flex items-start justify-between gap-4"><div><h2 className="text-xl font-semibold tracking-tight">Ready for your next order</h2><p className="mt-1 text-sm leading-6 text-muted">Choose the products and quantities your business needs.</p></div><Link to={allLink} className="inline-flex shrink-0 items-center gap-2 py-2 text-xs font-medium">View all <ArrowRight size={14}/></Link></div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap gap-2" aria-label="Filter products by category">{[{id:"", name:"All products"}, ...store.categories].map(item => <button key={item.id} type="button" aria-pressed={category === item.id} onClick={() => setCategory(item.id)} className={`rounded-full px-4 py-2 text-xs font-medium transition-colors motion-reduce:transition-none ${category === item.id ? "bg-midnight text-white" : "bg-white text-muted hover:bg-soft"}`}>{item.name}</button>)}</div><label className="flex items-center gap-2 text-xs text-muted">Sort by<select value={sort} onChange={event => { const next = event.target.value; if(next === "newest" || next === "price_low" || next === "price_high") setSort(next); }} className="rounded-lg border border-border bg-white px-3 py-2 text-xs text-foreground"><option value="newest">Newest</option><option value="price_low">Price: low to high</option><option value="price_high">Price: high to low</option></select></label></div>
      {products.isPending ? <div className="py-10"><Spinner label="Loading store products"/></div> : products.isError ? <div className="rounded-xl bg-white p-6"><p role="alert" className="mb-3 text-sm">Products could not load. Please try again.</p><Button variant="secondary" onClick={() => { void products.refetch(); }}>Try again</Button></div> : <>
        <p className="mb-3 text-xs text-muted" aria-live="polite">Showing {products.data.items.length} of {products.data.total} products</p>
        {products.data.items.length ? <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{products.data.items.map(product => <DealerHomeProductTile key={product.id} product={product}/>)}</div> : <EmptyState title="No products in this selection" description="Try another category or check back after your supplier updates the catalog."/>}
        {products.data.total > products.data.items.length && <div className="mt-5 flex justify-center"><Link to={allLink} className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-medium">Browse full collection <ArrowRight size={16}/></Link></div>}
      </>}
    </section>
    <section aria-label="Store benefits" className="mt-7 grid gap-4 rounded-2xl bg-[#f0f5e8] p-5 sm:grid-cols-3" data-ds-reveal>{[{title:"Private store access",text:"For your authorized business",icon:ShieldCheck},{title:"Wholesale catalog",text:"Variants, packs and minimum quantities",icon:Boxes},{title:"Your order workspace",text:"Catalog, cart and order history",icon:ClipboardList}].map(({title,text,icon:Icon}) => <div key={title} className="flex items-center gap-3"><Icon size={22} className="shrink-0 text-[#789255]"/><div><strong className="text-xs font-semibold">{title}</strong><p className="mt-1 text-xs leading-5 text-muted">{text}</p></div></div>)}</section>
    <section className="mt-6 grid gap-4 md:grid-cols-2" data-ds-reveal>{[{title:"A clear view. A better way to buy.",text:"Build your cart with the products and quantities your business needs.",to:routeBuilders.cart(store.id),action:"Open my cart",icon:ShoppingBag,dark:true},{title:"Your orders. One place to follow them.",text:"Review your permitted order history across your suppliers.",to:routes.dealer.orders,action:"View my orders",icon:ClipboardList,dark:false}].map(({title,text,to,action,icon:Icon,dark}) => <article key={title} className={`relative overflow-hidden rounded-2xl p-6 transition-transform duration-300 hover:-translate-y-1 motion-reduce:transform-none motion-reduce:transition-none ${dark ? "bg-midnight text-white" : "bg-[#eaf2de] text-midnight"}`}><Icon size={92} strokeWidth={1} className="pointer-events-none absolute -right-2 bottom-3 -rotate-12 opacity-10"/><div className="relative max-w-sm"><h2 className="text-xl font-semibold leading-7 tracking-tight">{title}</h2><p className={`mt-2 text-sm leading-6 ${dark ? "text-slate-300" : "text-muted"}`}>{text}</p><Link to={to} className={`mt-4 inline-flex items-center gap-3 rounded-lg px-4 py-2.5 text-xs font-semibold ${dark ? "bg-lime text-midnight" : "bg-midnight text-white"}`}>{action}<ArrowUpRight size={15}/></Link></div></article>)}</section>
    <section className="pb-4 pt-7" data-ds-reveal><h2 className="mb-4 text-lg font-semibold tracking-tight">From discovery to your cart</h2><div className="grid gap-4 md:grid-cols-3">{[{title:"Find your products",text:"Browse your supplier's categories and catalog.",icon:Package},{title:"Choose your quantity",text:"Check variants, pack sizes and minimum quantities.",icon:Boxes},{title:"Review your cart",text:"Review your selected products and order details.",icon:ShoppingBag}].map(({title,text,icon:Icon},index) => <div key={title} className="flex items-start gap-3 rounded-2xl bg-white p-5 transition-shadow duration-300 hover:shadow-md motion-reduce:transition-none"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-soft text-[#789255]"><Icon size={20}/></span><div><p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted">Step {index+1}</p><h3 className="text-sm font-semibold">{title}</h3><p className="mt-1 text-xs leading-5 text-muted">{text}</p></div></div>)}</div></section>
  </div>;
}
export default function StoreHomePage() {
  const { storeId = "" } = useParams(); const store = useDealerStore(storeId);
  if (!store.data) return null;
  return <DealerShopHome key={storeId} store={store.data}/>;
}
