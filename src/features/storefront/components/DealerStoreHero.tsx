import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight,ChevronLeft,ChevronRight,Package } from "lucide-react";
import { StoreMediaImage } from "@/features/stores/components/StorePreview";
import { PrivateImage } from "@/components/shared/PrivateImage";
import { routeBuilders } from "@/config/routes";
import type { DealerStorefront,StoreProductCard } from "../storefront.schemas";
export function DealerStoreHero({store,product}:{store:DealerStorefront;product?:StoreProductCard}){
  const[selected,setSelected]=useState(0);const index=selected<store.banners.length?selected:0;const banner=store.banners[index];
  return <section className="relative isolate overflow-hidden rounded-lg border border-lime/15 bg-gradient-to-r from-[#eff7de] via-[#f1f7e9] to-[#e6efd9]">
    <div className="grid min-h-56 items-center gap-3 px-8 py-6 sm:px-12 md:grid-cols-[.9fr_1.1fr] md:gap-6 md:py-5">
      <div className="z-10 max-w-lg py-2"><p className="text-[10px] font-semibold uppercase tracking-[.12em] text-[#65774b]">{store.name}</p><h2 className="mt-3 text-3xl font-semibold leading-[1.08] tracking-[-.04em] sm:text-[34px]">{banner?.heading||"Wholesale essentials for your business"}</h2><p className="mt-3 line-clamp-3 max-w-md text-xs leading-6 text-[#526342]">{banner?.description||store.description||"Explore your supplier’s products, wholesale prices and minimum order quantities."}</p><Link to={routeBuilders.storeProducts(store.id)} className="mt-4 inline-flex min-h-10 items-center gap-5 rounded-lg bg-lime px-4 text-xs font-semibold text-midnight transition-transform hover:-translate-y-0.5 motion-reduce:transform-none">Explore products<ArrowRight size={16}/></Link></div>
      <div className="relative mx-auto w-full max-w-xl">{banner?<StoreMediaImage bucket="store-banners" path={banner.imagePath} alt={banner.heading||`${store.name} banner`} className="h-44 w-full bg-transparent object-contain sm:h-52 md:h-56"/>:product?<PrivateImage path={product.imagePath} alt={product.name} className="h-44 w-full bg-transparent p-3 sm:h-52 md:h-56"/>:<div className="grid h-36 place-items-center text-lime-hover md:h-60"><Package size={100} strokeWidth={1}/></div>}</div>
    </div>
    {store.banners.length>1&&<><button type="button" aria-label="Previous banner" onClick={()=>setSelected((index+store.banners.length-1)%store.banners.length)} className="absolute left-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-midnight shadow-sm"><ChevronLeft size={17}/></button><button type="button" aria-label="Next banner" onClick={()=>setSelected((index+1)%store.banners.length)} className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-midnight shadow-sm"><ChevronRight size={17}/></button><div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5" aria-label="Select banner">{store.banners.map((item,i)=><button key={item.id} type="button" aria-label={`Banner ${i+1}`} aria-pressed={index===i} onClick={()=>setSelected(i)} className={`h-1.5 rounded-full ${index===i?"w-5 bg-midnight":"w-1.5 bg-midnight/20"}`}/>)}</div></>}
  </section>;
}
