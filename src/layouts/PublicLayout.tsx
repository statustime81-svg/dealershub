import { useEffect, useState, type MouseEvent } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ArrowUpRight, ArrowRight, Menu, X, ShieldCheck } from "lucide-react";
import { routes } from "@/config/routes";
import "@/styles/landing.css";

export default function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [pendingScroll, setPendingScroll] = useState<string | null>(null);
  const goTo = (target: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    closeMenu();
    setPendingScroll(target);
    navigate(target === "top" ? routes.public.home : `${routes.public.home}#${target}`);
  };
  useEffect(() => {
    if (!pendingScroll || location.pathname !== routes.public.home) return;
    const frame = requestAnimationFrame(() => {
      const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
      if (pendingScroll === "top") window.scrollTo({ top: 0, left: 0, behavior });
      else document.getElementById(pendingScroll)?.scrollIntoView({ behavior, block: "start" });
      setPendingScroll(null);
    });
    return () => cancelAnimationFrame(frame);
  }, [location.pathname, location.hash, pendingScroll]);
  return (
    <div className="dh-public">
      <a className="dh-skip" href="#landing-content">Skip to content</a>
      <header className="dh-header">
        <div className="dh-container dh-header-inner">
          <Link className="dh-brand" to={routes.public.home} onClick={goTo("top")} aria-label="DealersHub home">
            <svg viewBox="0 0 42 32" fill="none" aria-hidden="true"><path d="M9 5h28l-5 10H4L9 5Z" fill="currentColor"/><path d="M6 18h28l-5 10H1l5-10Z" fill="currentColor"/><path d="M16 12h11l-6 11H10l6-11Z" fill="#0B1220"/></svg>
            <span>DealersHub<span className="dh-trademark">™</span></span>
          </Link>
          <nav className="dh-desktop-nav" aria-label="Main navigation">
            <a href="/#platform" onClick={goTo("platform")}>Platform</a><a href="/#storefront" onClick={goTo("storefront")}>Storefront</a><a href="/#how-it-works" onClick={goTo("how-it-works")}>How it works</a>
          </nav>
          <div className="dh-header-actions">
            <Link className="dh-signin" to={routes.auth.login}>Sign in <ArrowUpRight size={15}/></Link>
            <Link className="dh-button dh-button-lime dh-header-cta" to={routes.auth.login}>Account login <ArrowRight size={16}/></Link>
            <button className="dh-menu-button" aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} aria-controls="dh-mobile-nav" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={21}/> : <Menu size={21}/>}</button>
          </div>
        </div>
        {menuOpen && <nav className="dh-mobile-nav dh-container" id="dh-mobile-nav" aria-label="Mobile navigation">
          <a href="/#platform" onClick={goTo("platform")}>Platform</a><a href="/#storefront" onClick={goTo("storefront")}>Storefront</a><a href="/#how-it-works" onClick={goTo("how-it-works")}>How it works</a>
          <Link to={routes.auth.login} onClick={closeMenu}>Account login <ArrowUpRight size={16}/></Link>
          <Link to={routes.auth.login} onClick={closeMenu}><ShieldCheck size={16}/> Super Admin login</Link>
        </nav>}
      </header>
      <main id="landing-content"><Outlet/></main>
      <footer className="dh-footer">
        <div className="dh-container">
          <div className="dh-footer-top">
            <div><Link className="dh-brand" to={routes.public.home} onClick={goTo("top")}><span className="dh-brand-mark" aria-hidden="true">↗</span>DealersHub</Link><p>The next chapter of your<br/>wholesale business starts here.</p></div>
            <div className="dh-footer-links"><p>Explore</p><a href="/#platform" onClick={goTo("platform")}>The platform</a><a href="/#storefront" onClick={goTo("storefront")}>Wholesale stores</a><a href="/#how-it-works" onClick={goTo("how-it-works")}>Getting started</a></div>
            <div className="dh-footer-links"><p>Your workspace</p><Link to={routes.auth.login}>Account login</Link><Link to={routes.auth.login}>Dealer & team login</Link><Link to={routes.auth.login} className="dh-admin-link"><ShieldCheck size={14}/> Super Admin login <ArrowUpRight size={13}/></Link></div>
          </div>
          <div className="dh-footer-bottom"><span>© {new Date().getFullYear()} DealersHub. All rights reserved.</span><span>Built for business. Designed for people.</span><a href={routes.public.home} onClick={goTo("top")}>Back to top ↑</a></div>
        </div>
      </footer>
    </div>
  );
}
