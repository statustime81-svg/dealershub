import { Link } from "react-router-dom";
import { Building2,Users,ShoppingCart,UserRoundCheck,ArrowUpRight,BadgeCheck,ShieldAlert,PackageCheck,type LucideIcon } from "lucide-react";
import { routes } from "@/config/routes";
import { formatNumber } from "@/lib/formatters";
import type { PlatformOverview } from "../super-admin.schemas";
export function PlatformMetrics({overview}:{overview:PlatformOverview}){
  const primary:{label:string;value:number;icon:LucideIcon;href:string}[]=[
    {label:"Registered businesses",value:overview.businesses,icon:Building2,href:routes.admin.businesses},
    {label:"Registered users",value:overview.users,icon:Users,href:routes.admin.users},
    {label:"Dealer identities",value:overview.dealers,icon:PackageCheck,href:`${routes.admin.users}?role=dealer`},
    {label:"Total orders",value:overview.orders,icon:ShoppingCart,href:routes.admin.reports},
  ];
  const secondary=[
    {label:"Active salespeople",value:overview.activeSalespeople,Icon:UserRoundCheck,href:`${routes.admin.users}?role=salesperson`},
    {label:"Verified businesses",value:overview.verifiedBusinesses,Icon:BadgeCheck,href:`${routes.admin.businesses}?verification=verified`},
    {label:"Active businesses",value:overview.activeBusinesses,Icon:Building2,href:`${routes.admin.businesses}?status=active`},
    {label:"Suspended businesses",value:overview.suspendedBusinesses,Icon:ShieldAlert,href:`${routes.admin.businesses}?status=suspended`},
  ];
  return <section aria-label="Platform totals" className="po-metrics-section">
    <div className="po-section-label">PLATFORM TOTALS <span>Current account counts · all-time orders</span></div>
    <div className="po-metrics">{primary.map(({label,value,icon:Icon,href})=><Link key={label} to={href} className="po-metric"><span className="po-metric-icon"><Icon size={20}/></span><span className="po-metric-content"><span>{label}</span><strong>{formatNumber(value)}</strong><small>View details <ArrowUpRight size={12}/></small></span><ArrowUpRight className="po-metric-arrow" size={15}/></Link>)}</div>
    <div className="po-secondary">{secondary.map(({label,value,Icon,href})=><Link to={href} key={label}><Icon size={16}/><span>{label}</span><strong>{formatNumber(value)}</strong><ArrowUpRight size={13}/></Link>)}</div>
  </section>;
}
