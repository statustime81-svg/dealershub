import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Check, ChevronLeft, ChevronRight, Package, ShieldCheck, ShoppingBag } from "lucide-react";
import { StoreMediaImage } from "@/features/stores/components/StorePreview";
import { PrivateImage } from "@/components/shared/PrivateImage";
import { routeBuilders } from "@/config/routes";
import { formatCurrency } from "@/lib/formatters";
import type { DealerStorefront, StoreProductCard } from "../storefront.schemas";
export function DealerStoreHero({ store, product }: { store: DealerStorefront; product?: StoreProductCard }) {
  const [selected, setSelected] = useState(0); const index = selected < store.banners.length ? selected : 0; const banner = store.banners[index];
  return <section className="ds-hero"><div className="ds-hero-pattern" aria-hidden="true"/>
    <div className="ds-hero-copy"><p className="ds-eyebrow"><span/> {store.businessName} · WHOLESALE</p><h1>{banner?.heading || <>Your next order.<br/><span>Your trusted supplier.</span></>}</h1><p className="ds-hero-description">{banner?.description || store.description || `Explore ${store.name}. Discover products, review wholesale pricing and prepare orders for your business.`}</p><div className="ds-hero-actions"><Link className="ds-button ds-button-dark" to={routeBuilders.storeProducts(store.id)}>Explore the catalog <ArrowUpRight size={17}/></Link><Link className="ds-hero-secondary" to={routeBuilders.cart(store.id)}>View my cart <ShoppingBag size={16}/></Link></div><div className="ds-hero-points"><span><ShieldCheck size={17}/> Authorized access</span><span><Package size={17}/> Wholesale pricing</span><span><Check size={17}/> Clear minimum quantities</span></div></div>
    <div className="ds-hero-visual"><div className="ds-orbit ds-orbit-one" aria-hidden="true"/><div className="ds-orbit ds-orbit-two" aria-hidden="true"/>
      {banner ? <div className="ds-banner-frame"><StoreMediaImage bucket="store-banners" path={banner.imagePath} alt={banner.heading || `${store.name} banner`} className="ds-banner-image"/></div> : product ? <div className="ds-featured-frame"><span className="ds-featured-label">FROM YOUR CATALOG</span><PrivateImage path={product.imagePath} alt={product.name} className="ds-featured-image"/><div className="ds-featured-caption"><div><p>{product.brandName || store.businessName}</p><strong>{product.name}</strong></div><b>{formatCurrency(product.variant.price)}</b></div></div> : <div className="ds-hero-empty-art" aria-hidden="true"><Package size={100} strokeWidth={1}/><span>{store.name}</span></div>}
      <div className="ds-hero-access"><span><ShieldCheck size={18}/></span><div><strong>Your private wholesale store</strong><small>{store.verified ? "Verified supplier" : "Authorized dealer access"}</small></div></div>
      {store.banners.length > 1 && <div className="ds-banner-controls" aria-label="Store banner controls"><button type="button" onClick={() => setSelected((index + store.banners.length - 1) % store.banners.length)} aria-label="Previous banner"><ChevronLeft size={17}/></button><span aria-live="polite">{index + 1} / {store.banners.length}</span><button type="button" onClick={() => setSelected((index + 1) % store.banners.length)} aria-label="Next banner"><ChevronRight size={17}/></button></div>}
    </div></section>;
}
