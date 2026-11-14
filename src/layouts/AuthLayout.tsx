import "@/styles/auth-workspace.css";
import { ArrowUpRight, ShieldCheck, Store, Users } from "lucide-react";
import { Package } from "lucide-react";

import {
  Link,
  Outlet,
  useMatch,
} from "react-router-dom";

import { routes } from "@/config/routes";

export default function AuthLayout() {
  const onboarding = Boolean(useMatch("/onboarding"));
  if (onboarding) return <div className="dh-onboarding">
    <header className="dh-onboarding-header">
      <div className="dh-onboarding-nav">
        <Link to={routes.public.home} className="dh-onboarding-logo" aria-label="DealersHub home">
          <span><Package size={23} aria-hidden="true" /></span>DealersHub
        </Link>
        <Link to={routes.auth.acceptInvitation} className="dh-onboarding-nav-link">Business invitations <ArrowUpRight size={16}/></Link>
      </div>
    </header>
    <main className="dh-onboarding-main">
      <aside className="dh-onboarding-intro">
        <span className="dh-onboarding-eyebrow">YOUR WHOLESALE WORKSPACE</span>
        <h1>Your business.<br/>{" "}Your network.<br/>{" "}<span>One place.</span></h1>
        <p>Set up your company and create a private wholesale store for your authorized dealer network.</p>
        <div className="dh-onboarding-benefits">
          {[{Icon:Store,title:"Your own private store",text:"Bring products, pricing and MOQ together."},
            {Icon:Users,title:"A connected dealer network",text:"Manage dealer access and your sales team."},
            {Icon:ShieldCheck,title:"Access you control",text:"Decide who can shop from your store."}].map(({Icon,title,text}) =>
            <div key={title}><span><Icon size={20} aria-hidden="true"/></span><div><h2>{title}</h2><p>{text}</p></div></div>)}
        </div>
        <div className="dh-onboarding-note"><ShieldCheck size={17}/><span>Your store starts unpublished. Finish setting it up before sharing it with dealers.</span></div>
      </aside>
      <div className="dh-onboarding-panel"><Outlet/></div>
    </main>
    <footer className="dh-onboarding-footer">DealersHub · Private wholesale commerce</footer>
  </div>;
  return (
    <div className="min-h-dvh bg-canvas">
     <header className="dh-auth-header border-b border-white/10 bg-midnight">
       <div className="mx-auto flex min-h-17 max-w-6xl items-center px-5 sm:px-8">
          <Link
            to={routes.public.home}
            className="inline-flex items-center gap-3 text-white"
            aria-label="DealersHub home"
          >
            <span className="flex size-9 items-center justify-center rounded-lg bg-lime text-midnight">
              <Package
                size={21}
                aria-hidden="true"
              />
            </span>

            <span className="text-xl font-bold tracking-tight">
              DealersHub
            </span>
          </Link>
        </div>
      </header>

      <main className="mx-auto grid min-h-[calc(100dvh-68px)] max-w-6xl items-center gap-12 px-5 py-10 sm:px-8 lg:grid-cols-2 lg:gap-20">
        <section className="hidden lg:block">
          <p className="text-sm font-semibold text-muted">
            B2B wholesale commerce
          </p>

          <h1 className="mt-4 max-w-lg text-4xl font-bold leading-tight tracking-tight">
            Your business.
            <br />
            Your dealer network.
            <br />
            One connected workspace.
          </h1>

          <p className="mt-5 max-w-md text-sm leading-7 text-muted">
            Manage private wholesale stores, authorized
            dealers, sales teams and orders through
            DealersHub.
          </p>

          <div className="mt-8 border-l-4 border-lime pl-4">
            <p className="text-sm font-medium">
              Built for manufacturers and distributors.
            </p>

            <p className="mt-1 text-sm text-muted">
              Clear workflows for every role.
            </p>
          </div>
        </section>

        <div className="mx-auto w-full max-w-md rounded-xl border border-border bg-surface p-6 sm:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}