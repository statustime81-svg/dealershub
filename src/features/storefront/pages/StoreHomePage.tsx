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
import { DealerProductTile } from "../components/DealerProductTile";

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
    <section className="ds-trust-strip" aria-label="Store benefits"><div><ShieldCheck size={22}/><span><strong>Private store access</strong><small>For your authorized business</small></span></div><div><Boxes size={22}/><span><strong>Wholesale catalog</strong><small>Variants, packs and minimum quantities</small></span></div><div><ClipboardList size={22}/><span><strong>Your order workspace</strong><small>Catalog, cart and order history</small></span></div></section>
    {store.categories.length > 0 && <section className="ds-section" data-ds-reveal><div className="ds-section-title"><div><p className="ds-eyebrow">FIND WHAT YOUR BUSINESS NEEDS</p><h2>Shop by category</h2></div><Link to={routeBuilders.storeCategories(store.id)}>Explore all categories <ArrowRight size={16}/></Link></div><div className="ds-category-grid">{store.categories.map((item, index) => <Link to={routeBuilders.storeCategory(store.id, item.id)} key={item.id} className="ds-category-tile"><span className={`ds-category-art ds-category-color-${index % 3}`}>{item.imagePath ? <StoreMediaImage bucket="store-banners" path={item.imagePath} alt={item.name} className="h-full w-full object-contain"/> : <Boxes size={30} strokeWidth={1.35}/>}</span><div><strong>{item.name}</strong><small>{item.description || "Explore the collection"}</small></div><ArrowUpRight size={16}/></Link>)}</div></section>}
    <section className="ds-section ds-catalog-section" data-ds-reveal><div className="ds-section-title"><div><p className="ds-eyebrow">YOUR AUTHORIZED CATALOG</p><h2>Ready for your next order</h2><p className="ds-section-description">Explore current products and choose the right variant and quantity for your business.</p></div><Link to={allLink}>View all <ArrowRight size={16}/></Link></div>
      <div className="ds-catalog-toolbar"><div className="ds-category-chips" aria-label="Filter homepage products by category"><button type="button" aria-pressed={!category} onClick={() => setCategory("")}>All products</button>{store.categories.map(item => <button type="button" key={item.id} aria-pressed={category === item.id} onClick={() => setCategory(item.id)}>{item.name}</button>)}</div><label className="ds-sort-label">Sort by<select value={sort} onChange={event => { const next = event.target.value; if (next === "newest" || next === "price_low" || next === "price_high") setSort(next); }}><option value="newest">Newest</option><option value="price_low">Price: low to high</option><option value="price_high">Price: high to low</option></select></label></div>
      {products.isPending ? <div className="ds-loading"><Spinner label="Loading store products"/></div> : products.isError ? <div className="ds-state"><p role="alert">Products could not load. Check your connection or current store access.</p><Button variant="secondary" onClick={() => { void products.refetch(); }}>Try again</Button></div> : <>
        <p className="ds-product-count" aria-live="polite">Showing {products.data.items.length} of {products.data.total} products</p>
        {products.data.items.length ? <div className="ds-product-grid">{products.data.items.map(product => <DealerProductTile key={product.id} product={product}/>)}</div> : <EmptyState title="No products in this selection" description="Try another category or check back after your supplier updates the catalog."/>}
        {products.data.total > products.data.items.length && <div className="ds-more-products"><Link className="ds-button ds-button-outline" to={allLink}>Browse the full collection <ArrowRight size={16}/></Link></div>}
      </>}
    </section>
    <section className="ds-workspace-banners" data-ds-reveal><article className="ds-promo ds-promo-dark"><span className="ds-promo-decoration" aria-hidden="true"><ShoppingBag size={110} strokeWidth={.7}/></span><p className="ds-eyebrow">YOUR BUYING WORKSPACE</p><h2>A clear view.<br/>A better way to buy.</h2><p>Build your cart with the products and quantities your business needs.</p><Link className="ds-button ds-button-primary" to={routeBuilders.cart(store.id)}>Open my cart <ArrowUpRight size={16}/></Link></article><article className="ds-promo ds-promo-light"><span className="ds-promo-decoration" aria-hidden="true"><ClipboardList size={110} strokeWidth={.7}/></span><p className="ds-eyebrow">STAY ORGANIZED</p><h2>Your orders.<br/>One place to follow them.</h2><p>Review your permitted order history across the suppliers that serve you.</p><Link className="ds-button ds-button-dark" to={routes.dealer.orders}>View my orders <ArrowUpRight size={16}/></Link></article></section>
    <section className="ds-order-guide ds-section" data-ds-reveal><div className="ds-section-title"><div><p className="ds-eyebrow">BUILT FOR WHOLESALE</p><h2>From discovery to your cart</h2></div></div><div className="ds-guide-grid">{[{title:"Find your products",text:"Browse this supplier's categories and product catalog.",icon:Package},{title:"Choose your quantity",text:"Check the variant, pack size and minimum order quantity.",icon:Boxes},{title:"Review your cart",text:"Keep products together and review the available order details.",icon:ShoppingBag}].map(({title,text,icon:Icon},index) => <div key={title}><span className="ds-guide-icon"><Icon size={22}/></span><div><small>0{index + 1}</small><h3>{title}</h3><p>{text}</p></div></div>)}</div></section>
  </div>;
}
export default function StoreHomePage() {
  const { storeId = "" } = useParams(); const store = useDealerStore(storeId);
  if (!store.data) return null;
  return <DealerShopHome key={storeId} store={store.data}/>;
}
