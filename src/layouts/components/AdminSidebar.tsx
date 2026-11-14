import { NavLink } from "react-router-dom";
import { Building2,LayoutDashboard,Users,Tags,CreditCard,BarChart3,type LucideIcon } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { routes } from "@/config/routes";
import { cn } from "@/lib/utils";
const links:{label:string;href:string;icon:LucideIcon;ready:boolean}[]=[
  {label:"Platform overview",href:routes.admin.dashboard,icon:LayoutDashboard,ready:true},
  {label:"Businesses",href:routes.admin.businesses,icon:Building2,ready:true},
  {label:"Users",href:routes.admin.users,icon:Users,ready:true},
  {label:"Brands",href:routes.admin.brands,icon:Tags,ready:true},
  {label:"Categories",href:routes.admin.categories,icon:Tags,ready:true},
  {label:"Plans",href:routes.admin.plans,icon:CreditCard,ready:true},
  {label:"Subscriptions",href:routes.admin.subscriptions,icon:CreditCard,ready:true},
  {label:"Reports",href:routes.admin.reports,icon:BarChart3,ready:true},
];
export function AdminSidebar({onNavigate}:{onNavigate?:()=>void}){
  return <div className="flex h-full flex-col bg-midnight p-4 text-white">
    <Logo to={routes.admin.dashboard} className="mb-3"/>
    <p className="mb-6 rounded-lg border border-white/10 bg-midnight-raised px-3 py-3 text-xs text-slate-300">Super Admin · Platform workspace</p>
    <nav aria-label="Platform navigation" className="space-y-1">{links.map(({label,href,icon:Icon,ready})=>ready?
      <NavLink key={href} to={href} end={href===routes.admin.dashboard} onClick={onNavigate}
        className={({isActive})=>cn("flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium",isActive?"bg-lime text-midnight":"text-slate-200 hover:bg-midnight-raised")}>
        <Icon size={19} aria-hidden="true"/>{label}
      </NavLink>:<div key={href} aria-disabled="true" title="This section is not connected yet." className="flex min-h-11 cursor-not-allowed items-center gap-3 rounded-lg px-3 text-sm text-slate-500"><Icon size={19} aria-hidden="true"/>{label}</div>)}</nav>
  </div>;
}
