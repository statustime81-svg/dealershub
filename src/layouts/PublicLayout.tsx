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
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
            return;
        event.preventDefault();
        closeMenu();
        setPendingScroll(target);
        navigate(target === "top" ? routes.public.home : `${routes.public.home}#${target}`);
    };
    useEffect(() => {
        if (!pendingScroll || location.pathname !== routes.public.home)
            return;
        const frame = requestAnimationFrame(() => {
            const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
            if (pendingScroll === "top")
                window.scrollTo({ top: 0, left: 0, behavior });
            else
                document.getElementById(pendingScroll)?.scrollIntoView({ behavior, block: "start" });
            setPendingScroll(null);
        });
        return () => cancelAnimationFrame(frame);
    }, [location.pathname, location.hash, pendingScroll]);
    return (<div className="dh-public">
      <a className="dh-skip" href="#landing-content">Skip to content</a>
      <header className="dh-header">
        <div className="dh-container dh-header-inner">
          <Link className="dh-brand" to={routes.public.home} onClick={goTo("top")} aria-label="DealersHub home">
            <svg viewBox="0 0 42 32" fill="none" aria-hidden="true">
    <path d="M9 5h28l-5 10H4L9 5Z" fill="currentColor"/>
    <path d="M6 18h28l-5 10H1l5-10Z" fill="currentColor"/>
    <path d="M16 12h11l-6 11H10l6-11Z" fill="#0B1220"/>
    </svg>
            <span>DealersHub<span className="dh-trademark">™</span>
    </span>
          </Link>
          <nav className="dh-desktop-nav" aria-label="Main navigation">
            <a href="/#platform" onClick={goTo("platform")}>Platform</a>
    <a href="/#storefront" onClick={goTo("storefront")}>Storefront</a>
    <a href="/#how-it-works" onClick={goTo("how-it-works")}>How it works</a>
          </nav>
          <div className="dh-header-actions">
            <Link className="dh-signin" to={routes.auth.login}>Sign in <ArrowUpRight size={15}/>
    </Link>
            <Link className="dh-button dh-button-lime dh-header-cta" to={routes.auth.login}>Account login <ArrowRight size={16}/>
    </Link>
            <button type="button" className="dh-menu-button" aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} aria-controls="dh-mobile-nav" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={21}/> : <Menu size={21}/>}</button>
          </div>
        </div>
        {menuOpen && <nav className="dh-mobile-nav dh-container" id="dh-mobile-nav" aria-label="Mobile navigation">
          <a href="/#platform" onClick={goTo("platform")}>Platform</a>
        <a href="/#storefront" onClick={goTo("storefront")}>Storefront</a>
        <a href="/#how-it-works" onClick={goTo("how-it-works")}>How it works</a>
          <Link to={routes.auth.login} onClick={closeMenu}>Account login <ArrowUpRight size={16}/>
        </Link>
          <Link to={routes.auth.login} onClick={closeMenu}>
        <ShieldCheck size={16}/> Super Admin login</Link>
        </nav>}
      </header>
      <main id="landing-content">
    <Outlet />
    </main>
      <footer className="dh-footer dh-footer-editorial">
        <svg className="dh-footer-waves" viewBox="0 0 600 260" fill="none" aria-hidden="true">
          {Array.from({ length: 10 }, (_, index) => (<path key={index} d={`M${-30 + index * 22} -35 C${210 + index * 15} -10, ${180 + index * 17} 230, 630 ${110 + index * 10}`}/>))}
        </svg>
        <div className="dh-container">
          <div className="dh-footer-top">
            <div className="dh-footer-identity">
              <Link className="dh-brand" to={routes.public.home} onClick={goTo("top")} aria-label="DealersHub home">
                <span className="dh-brand-mark" aria-hidden="true">
    <ArrowUpRight size={29} strokeWidth={1.8}/>
    </span>
                DealersHub
              </Link>
              <p>The next chapter of your<br />wholesale business starts here.</p>
            </div>
            <nav className="dh-footer-links" aria-label="Explore DealersHub">
              <p>Explore</p>
              <a href="/#platform" onClick={goTo("platform")}>The platform <ArrowUpRight size={19}/>
    </a>
              <a href="/#storefront" onClick={goTo("storefront")}>Wholesale stores <ArrowUpRight size={19}/>
    </a>
              <a href="/#how-it-works" onClick={goTo("how-it-works")}>Getting started <ArrowUpRight size={19}/>
    </a>
            </nav>
            <nav className="dh-footer-links" aria-label="Your workspace">
              <p>Your workspace</p>
              <Link to={routes.auth.login}>Account login <ArrowUpRight size={19}/>
    </Link>
              <Link to={routes.auth.login}>Dealer &amp; team login <ArrowUpRight size={19}/>
    </Link>
              <Link to={routes.auth.login} className="dh-admin-link">
    <ShieldCheck size={22}/> Super Admin login <ArrowUpRight size={19}/>
    </Link>

            </nav>
          </div>
          <div className="dh-footer-brand-row">
            <div className="dh-footer-wordmark" aria-hidden="true">DealersHub</div>
            <div className="dh-nexova-credit">
                
                <a className="dh-nexova-link" href="https://www.nexovax.in/" target="_blank" rel="noopener noreferrer" aria-label="Visit NexovaX website (opens in a new tab)">
                  <span className="dh-footer-credit-logo">
                    <img src="/images/nexova-logo.png" alt="NexovaX" width={108} height={108} loading="lazy" decoding="async"/>
                  </span>
                  <span className="dh-nexova-signature">
    <span className="dh-nexova-caption">Developed by</span>
<strong>NexovaX</strong>
    <small>Built Beyond Limits.</small>
    </span>
                  <ArrowUpRight className="dh-nexova-arrow" size={17} aria-hidden="true"/>
                </a>
              </div>
          </div>
          <div className="dh-footer-bottom">
            <span>© {new Date().getFullYear()} DealersHub. All rights reserved.</span>
            <span className="dh-footer-promise">Built for business. Designed for people.</span>
            <a className="dh-footer-back" href={routes.public.home} onClick={goTo("top")}>Back to top <ArrowUpRight size={18}/>
    </a>
          </div>

        </div>
      </footer>
    </div>);
}
