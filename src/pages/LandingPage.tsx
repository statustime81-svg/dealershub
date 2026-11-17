import { useEffect, useRef, useState, type PointerEvent } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, ArrowUpRight, Check, ChevronDown, Package, Users, Store,
  ShieldCheck, Layers3, ShoppingBag, ClipboardList, CircleCheck, MousePointer2,
} from "lucide-react";
import { routes } from "@/config/routes";

import DashboardPreview from "@/components/landing/DashboardPreview";
import StorefrontPreview from "@/components/landing/StorefrontPreview";
const features = [
  { icon: Package, number: "01", title: "A catalog that means business.", text: "Product photos, variants, wholesale pricing and minimum quantities. Your products, presented your way.", chips: ["Products & variants", "Wholesale prices", "MOQ"] },
  { icon: Users, number: "02", title: "Your network. Connected.", text: "Authorize dealers, assign your salespeople and bring the people behind your business into one workspace.", chips: ["Dealer access", "Sales assignments", "Team accounts"] },
  { icon: ClipboardList, number: "03", title: "Keep every order in view.", text: "Bring dealer and sales-team orders together. Review incoming requests and follow the order journey in one place.", chips: ["Order history", "Status tracking", "Business reports"] },
];
const roles = [
  { label: "Manufacturer", title: "Build your own wholesale world.", text: "Open your store, organize your catalog and manage your dealer relationships.", icon: Store },
  { label: "Distributor", title: "Make your network work together.", text: "Give your authorized dealers a dedicated place to discover your products and prepare orders.", icon: Layers3 },
  { label: "Dealer", title: "Your suppliers. One account.", text: "Access the wholesale stores that authorize your business, with separate catalogs and order histories.", icon: ShoppingBag },
  { label: "Salesperson", title: "Closer to every dealer.", text: "Work with your assigned dealers and prepare orders on their behalf, with the right purchaser recorded.", icon: Users },
];
const questions = [
  { question: "Who is DealersHub built for?", answer: "Manufacturers and distributors who sell wholesale, along with their authorized dealers and salespeople. Each business has its own store and workspace." },
  { question: "Can anyone browse my wholesale store?", answer: "Wholesale stores are private. Your business controls which dealer accounts can access its catalog. A public landing page does not make your private products or prices public." },
  { question: "Can one dealer work with multiple businesses?", answer: "Yes. A dealer can use one account across multiple manufacturers. Each business must independently grant access to its stores." },
  { question: "How do I sign in as a Super Admin?", answer: "Use the Super Admin login link in the footer. Sign in with an account that has already been granted the platform administrator role. The login link itself does not grant administrative access." },
];

function useLandingMotion() {
  const root = useRef<HTMLDivElement>(null);
  const [motion, setMotion] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setMotion(!media.matches && "IntersectionObserver" in window);
    update(); media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (!motion || !root.current) return;
    const elements = root.current.querySelectorAll<HTMLElement>("[data-reveal]");
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add("dh-is-visible"); observer.unobserve(entry.target); }
    }), { threshold: 0.04, rootMargin: "0px 0px -20px 0px" });
    elements.forEach(element => observer.observe(element));
    return () => observer.disconnect();
  }, [motion]);
  return { root, motion };
}

function HeroScene({ motion }: { motion: boolean }) {
  const tilt = useRef<HTMLDivElement>(null);
  const frame = useRef<number | null>(null);
  useEffect(() => () => { if (frame.current !== null) cancelAnimationFrame(frame.current); }, []);
  function move(event: PointerEvent<HTMLDivElement>) {
    if (!motion || event.pointerType !== "mouse") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - .5;
    const y = (event.clientY - bounds.top) / bounds.height - .5;
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      tilt.current?.style.setProperty("--dh-rx", `${-y * 6}deg`);
      tilt.current?.style.setProperty("--dh-ry", `${x * 8}deg`);
    });
  }
  function reset() {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    tilt.current?.style.setProperty("--dh-rx", "0deg");
    tilt.current?.style.setProperty("--dh-ry", "0deg");
  }
  return <div className="dh-scene" onPointerMove={move} onPointerLeave={reset}>
    <div className="dh-scene-grid" aria-hidden="true"/>
    <div className="dh-scene-orbit dh-orbit-one" aria-hidden="true"/><div className="dh-scene-orbit dh-orbit-two" aria-hidden="true"/>
    <div className="dh-scene-label"><span/> YOUR BUSINESS, IN SYNC</div>
    <div className="dh-tilt" ref={tilt}>
      <div className="dh-window-shadow" aria-hidden="true"/>
      <div className="dh-preview-window">
        <div className="dh-window-bar"><div className="dh-window-dots"><i/><i/><i/></div><span>DealersHub / Business workspace</span><ShieldCheck size={13}/></div>
        <DashboardPreview/>
        <div className="dh-window-foot"><span className="dh-preview-tag">INTERFACE PREVIEW</span><span>Illustrative data</span></div>
      </div>
      <div className="dh-float-card dh-float-access"><span className="dh-float-icon"><ShieldCheck size={20}/></span><div><strong>Private by design</strong><span>Only your authorized network.</span></div><span className="dh-mini-check"><Check size={12}/></span></div>
      <div className="dh-float-card dh-float-order"><div className="dh-order-top"><span className="dh-float-icon dh-icon-light"><Package size={19}/></span><span>ORDER WORKFLOW</span><span className="dh-online-dot"/></div><strong>From catalog<br/>to connected commerce.</strong><div className="dh-order-nodes"><i><ShoppingBag size={13}/></i><span/><i><ClipboardList size={13}/></i><span/><i><Check size={13}/></i></div></div>
      <div className="dh-cursor-chip" aria-hidden="true"><MousePointer2 size={17}/> Your sales team</div>
    </div>
    <div className="dh-scene-caption"><span>01 / THE BUSINESS WORKSPACE</span><span>Move to explore <ArrowUpRight size={12}/></span></div>
  </div>;
}

export default function LandingPage() {
  const { root, motion } = useLandingMotion();
  const [activeRole, setActiveRole] = useState(0);
  const role = roles[activeRole]; const RoleIcon = role.icon;
  useEffect(() => {
    const title = document.title;
    document.title = "DealersHub | Your wholesale business, connected";
    return () => { document.title = title; };
  }, []);
  return <div className="dh-landing" ref={root} data-motion={motion ? "on" : "off"}>
    <section className="dh-hero dh-container">
      <div className="dh-hero-copy">
        <p className="dh-eyebrow"><span className="dh-pulse-dot"/> THE PRIVATE WHOLESALE PLATFORM</p>
        <h1><span className="dh-heading-line"><span>Your business.</span></span><span className="dh-heading-line"><span>Your network.</span></span><span className="dh-heading-line dh-heading-line-last"><span className="dh-hero-highlight">All connected.<svg viewBox="0 0 580 18" preserveAspectRatio="none" aria-hidden="true"><path d="M4 12Q285-1 576 8" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round"/></svg></span></span></h1>
        <p className="dh-hero-description">A better home for your wholesale business. Bring your store, products, dealers and sales team together in one beautifully organized workspace.</p>
        <div className="dh-hero-buttons"><Link className="dh-button dh-button-dark" to={routes.auth.login}>Open your workspace <ArrowUpRight size={18}/></Link><a className="dh-text-link" href="#platform">Explore the platform <span><ArrowRight size={17}/></span></a></div>
        <div className="dh-hero-assurances"><span><Check size={14}/> Your own private store</span><span><Check size={14}/> Access you control</span></div>
      </div>
      <div className="dh-hero-scene-reveal dh-hero-image-enter"><HeroScene motion={motion}/></div>
    </section>
    <div className="dh-platform-strip"><div className="dh-container dh-strip-inner"><span className="dh-strip-label">PURPOSE-BUILT FOR</span>{["MANUFACTURERS", "DISTRIBUTORS", "DEALERS", "SALES TEAMS"].map((item, i) => <span className="dh-strip-item" key={item}><i aria-hidden="true">{["✳", "↗", "◈", "⊞"][i]}</i>{item}</span>)}</div></div>

    <section className="dh-section dh-container" id="platform">
      <div className="dh-section-heading" data-reveal><div><p className="dh-eyebrow">ONE CONNECTED PLATFORM</p><h2>Less scattered.<br/><span>More in control.</span></h2></div><p>From the first product in your catalog to the next dealer in your network. Give your business room to move.</p></div>
      <div className="dh-feature-grid">{features.map(({ icon: Icon, number, title, text, chips }) => <article className="dh-feature" data-reveal key={number}><div className="dh-feature-top"><span className="dh-feature-icon"><Icon size={24}/></span><span className="dh-index">/{number}</span></div><h3>{title}</h3><p>{text}</p><div className="dh-feature-chips">{chips.map(chip => <span key={chip}>{chip}</span>)}</div></article>)}</div>
    </section>

    <section className="dh-commerce-section" id="storefront"><div className="dh-container dh-commerce-grid">
      <div className="dh-commerce-visual" data-reveal><div className="dh-browser-line"><span><Store size={14}/> YOUR BRANDED WHOLESALE STORE</span><span className="dh-preview-tag">DESIGN PREVIEW</span></div><div className="dh-commerce-image"><StorefrontPreview/></div><div className="dh-commerce-note"><CircleCheck size={16}/><span>Illustrative storefront and product data.</span></div></div>
      <div className="dh-commerce-copy" data-reveal><p className="dh-eyebrow">YOUR BRAND. YOUR STORE.</p><h2>Wholesale.<br/>With a retail<br/><span>level of care.</span></h2><p>Give your dealers a clear, familiar way to discover your products. Keep the wholesale details that matter, from variants and packaging to pricing and MOQ.</p><ul>{["A branded catalog for your business", "Product photos, categories and variants", "Private access for authorized dealers"].map(text => <li key={text}><span><Check size={13}/></span>{text}</li>)}</ul><Link className="dh-text-link" to={routes.auth.login}>Open your store <span><ArrowUpRight size={17}/></span></Link></div>
    </div></section>

    <section className="dh-section dh-container dh-roles-section" id="workspaces"><div className="dh-section-heading" data-reveal><div><p className="dh-eyebrow">EVERY ROLE. THE RIGHT WORKSPACE.</p><h2>Built around the<br/><span>people behind it.</span></h2></div><p>Different responsibilities. One connected business. Everyone sees the workspace and access meant for them.</p></div>
      <div className="dh-role-layout" data-reveal><div className="dh-role-tabs" role="tablist" aria-label="Business roles" aria-orientation="vertical">{roles.map((item, index) => <button key={item.label} type="button" id={`dh-role-${index}`} role="tab" aria-selected={activeRole === index} aria-controls="dh-role-panel" tabIndex={activeRole === index ? 0 : -1} onClick={() => setActiveRole(index)} onKeyDown={event => {
        let next = index;
        if (event.key === "ArrowDown" || event.key === "ArrowRight") next = (index + 1) % roles.length;
        else if (event.key === "ArrowUp" || event.key === "ArrowLeft") next = (index + roles.length - 1) % roles.length;
        else if (event.key === "Home") next = 0; else if (event.key === "End") next = roles.length - 1; else return;
        event.preventDefault(); setActiveRole(next); document.getElementById(`dh-role-${next}`)?.focus();
      }}><span className="dh-index">0{index + 1}</span>{item.label}<ArrowUpRight size={19}/></button>)}</div>
      <div className="dh-role-panel" id="dh-role-panel" role="tabpanel" aria-labelledby={`dh-role-${activeRole}`} tabIndex={0}><div className="dh-role-art" aria-hidden="true"><div className="dh-role-ring"/><div className="dh-role-tile"><RoleIcon size={48} strokeWidth={1.3}/></div><span className="dh-role-node dh-node-one"><Package size={20}/></span><span className="dh-role-node dh-node-two"><Users size={20}/></span></div><div key={role.label} className="dh-role-content"><span className="dh-preview-tag">{role.label.toUpperCase()} WORKSPACE</span><h3>{role.title}</h3><p>{role.text}</p><Link className="dh-text-link" to={activeRole < 2 ? routes.auth.login : routes.auth.login}>{activeRole < 2 ? "Sign in to your workspace" : "Sign in to your workspace"}<span><ArrowRight size={16}/></span></Link></div></div></div>
    </section>

    <section className="dh-workflow-section" id="how-it-works"><div className="dh-container"><div className="dh-section-heading" data-reveal><div><p className="dh-eyebrow">A CLEAR WAY FORWARD</p><h2>From your business<br/><span>to your next order.</span></h2></div><p>Set up your foundation. Bring in your network. Keep the day-to-day connected.</p></div><div className="dh-steps">{[
      { title: "Make it yours.", text: "Sign in to your workspace and create your branded wholesale store.", icon: Store },
      { title: "Build your catalog.", text: "Add products, photos, prices, variants and minimum quantities.", icon: Package },
      { title: "Connect your people.", text: "Authorize dealers and assign your sales team to their accounts.", icon: Users },
      { title: "Bring orders together.", text: "Give your network one place to prepare orders and follow their progress.", icon: ClipboardList },
    ].map(({ title, text, icon: Icon }, index) => <article className="dh-step" data-reveal key={title}><div className="dh-step-top"><span>0{index + 1}</span><Icon size={23}/></div><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>

    <section className="dh-section dh-container dh-faq"><div data-reveal><p className="dh-eyebrow">A LITTLE MORE CLARITY</p><h2>Good questions.<br/><span>Clear answers.</span></h2><p className="dh-faq-intro">Everything starts with understanding how your business and network fit together.</p></div><div className="dh-faq-list" data-reveal>{questions.map(item => <details key={item.question}><summary>{item.question}<ChevronDown size={17}/></summary><p>{item.answer}</p></details>)}</div></section>

    <section className="dh-container dh-final-wrap"><div className="dh-final-cta" data-reveal><div className="dh-cta-art" aria-hidden="true"><span/><span/><span/></div><div className="dh-final-content"><p className="dh-eyebrow">YOUR NEXT CHAPTER</p><h2>Big things start<br/>with a connected business.</h2><div className="dh-final-actions"><Link className="dh-button dh-button-lime" to={routes.auth.login}>Sign in to your workspace <ArrowUpRight size={18}/></Link><Link className="dh-final-signin" to={routes.auth.login}>Already with us? Sign in <ArrowRight size={15}/></Link></div></div><div className="dh-cta-symbol" aria-hidden="true">↗</div></div></section>
  </div>;
}
