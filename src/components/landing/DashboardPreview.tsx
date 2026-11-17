import { useLayoutEffect, useId, useRef, useState } from "react";
import { ArrowRight, ArrowUp, Bell, CalendarDays, ChartNoAxesColumnIncreasing, ChevronDown, ClipboardList, Coins, CreditCard, House, Layers, Leaf, MoreHorizontal, Package, Plus, Puzzle, Search, ShoppingCart, Store, Tag, Upload, UserRound, UsersRound } from "lucide-react";
import { dashboardClass as cx } from "./dashboardStyles";

const navigation = [
  { label: "Dashboard", icon: House }, { label: "Products", icon: Package },
  { label: "Inventory", icon: Layers }, { label: "Orders", icon: ShoppingCart },
  { label: "Dealers", icon: UsersRound }, { label: "Sales Team", icon: UserRound },
  { label: "Pricing & Offers", icon: Tag }, { label: "Reports", icon: ChartNoAxesColumnIncreasing },
  { label: "Store Settings", icon: Store }, { label: "Integrations", icon: Puzzle },
  { label: "Team & Access", icon: UsersRound }, { label: "Billing", icon: CreditCard },
];
const metrics = [
  { label: "Total Orders", value: "1,248", growth: "+18.4%", icon: ClipboardList },
  { label: "Order Value", value: "₹46,72,000", growth: "+24.6%", icon: Coins },
  { label: "Active Dealers", value: "326", growth: "+12.8%", icon: UsersRound },
  { label: "Total Products", value: "1,842", growth: "+6.1%", icon: Package },
];
const statuses = [
  ["Confirmed", "628", "50.3%", "#aff200"], ["Processing", "202", "16.2%", "#0b1220"],
  ["Dispatched", "184", "14.7%", "#828998"], ["Delivered", "198", "15.9%", "#cfd4dd"],
  ["Cancelled", "36", "2.9%", "#e7ebf1"],
];
const orders = [
  ["ORD-12847", "Gupta Traders", "DT-044", "Shubham Kumar", "12 items", "₹1,84,000", "Confirmed", "Nov 14, 2026, 11:24 AM"],
  ["ORD-12846", "Sharma Distributors", "DT-089", "Aman Kumar", "8 items", "₹96,500", "Processing", "Nov 14, 2026, 10:17 AM"],
  ["ORD-12845", "Raj Enterprises", "DT-072", "Ravi Prasad", "15 items", "₹2,18,000", "Dispatched", "Nov 13, 2026, 08:52 PM"],
  ["ORD-12844", "Singh & Sons", "DT-031", "Shubham Kumar", "6 items", "₹72,000", "Delivered", "Nov 13, 2026, 04:36 PM"],
  ["ORD-12843", "Verma Traders", "DT-066", "Aman Kumar", "10 items", "₹1,26,000", "Confirmed", "Nov 13, 2026, 01:11 PM"],
];
function TrendChart() {
  const gradient = useId().replace(/:/g, "");
  return <svg className={cx("dp-trend")}  viewBox="0 0 490 205" aria-hidden="true">
    <defs><linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#b9f52f" stopOpacity=".5"/><stop offset="1" stopColor="#b9f52f" stopOpacity="0"/></linearGradient></defs>
    {[15,55,95,135,175].map((y,i)=><g key={y}><line x1="40" x2="485" y1={y} y2={y} stroke="#e4e8ef" strokeDasharray="3 3"/><text x="29" y={y+5} textAnchor="end">{["20L","15L","10L","5L","0"][i]}</text></g>)}
    <path d="M42 164 L80 141 L105 143 L132 140 L154 120 L198 141 L228 124 L254 112 L281 122 L320 91 L363 112 L393 103 L417 80 L443 93 L485 50 L485 175 L42 175Z" fill={`url(#${gradient})`}/>
    <path className={cx("dp-chart-line")}  d="M42 164 L80 141 L105 143 L132 140 L154 120 L198 141 L228 124 L254 112 L281 122 L320 91 L363 112 L393 103 L417 80 L443 93 L485 50" fill="none" stroke="#a5e900" strokeWidth="2.2" strokeLinejoin="round"/>
    <path d="M42 174 L80 167 L105 168 L132 168 L154 159 L198 169 L228 161 L254 156 L281 160 L320 145 L363 154 L393 150 L417 138 L443 145 L485 121" fill="none" stroke="#c9cfd9" strokeWidth="2"/>
    {["Oct 15","Oct 18","Oct 21","Oct 24","Oct 27","Oct 30","Nov 02","Nov 05","Nov 08","Nov 11","Nov 14"].map((d,i)=><text key={d} x={45+i*43.5} y="199" textAnchor="middle" className={cx("dp-date")} >{d}</text>)}
  </svg>;
}
/** Decorative, code-rendered reference dashboard. It does not query private business data. */
export default function DashboardPreview() {
  const wrapper = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const element = wrapper.current;
    if (!element) return;

    // Measure the untransformed layout width, not the projected 3D bounds.
    const update = (width: number) => {
      if (width > 0) setScale(width / 1672);
    };
    update(element.clientWidth);
    const observer = new ResizeObserver(([entry]) => {
      if (entry) update(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return <div className={cx("dp-viewport")}  ref={wrapper} role="img" aria-label="Illustrative DealersHub dashboard: order totals, sales chart, order status, recent orders and sales team. Demo data.">
    <div className={cx("dp-canvas")}  style={{ zoom: scale, transform: "none", WebkitTextSizeAdjust: "100%", textSizeAdjust: "100%" }} aria-hidden="true">
      <aside className={cx("dp-sidebar")} >
        <div className={cx("dp-logo")} ><svg width="46" height="32" viewBox="0 0 42 32"><path d="M9 5h28l-5 10H4L9 5ZM6 18h28l-5 10H1l5-10Z" fill="#b9f000"/></svg><strong>DealersHub<sup>™</sup></strong></div>
        <div className={cx("dp-workspace")} ><Leaf size={25}/><div><b>Yodha Clean FMCG</b><small>Manufacturer</small></div><ChevronDown size={18}/></div>
        <div className={cx("dp-navigation")} >{navigation.map(({label,icon:Icon},i)=><div key={label} className={cx(`${i===0?"dp-selected":""} ${i===9?"dp-separated":""}`)}><Icon size={25}/><span>{label}</span>{label==="Orders"&&<em>12</em>}</div>)}</div>
      </aside>
      <div className={cx("dp-main")} >
        <div className={cx("dp-heading")} ><div><h2>Dashboard</h2><p>Overview of your business, orders and dealer network.</p></div><div className={cx("dp-search")} ><Search size={21}/>Search products, orders, dealers...<span>⌘ K</span></div><div className={cx("dp-bell")} ><Bell size={27}/><i/></div><div className={cx("dp-avatar")} >MA</div><div className={cx("dp-account")} ><b>Md Abuzar</b><span>Admin</span></div><ChevronDown size={20}/></div>
        <div className={cx("dp-toolbar")} ><div className={cx("dp-tabs")} >{["Overview","Orders","Products","Dealers","Sales Team"].map(t=><span key={t}>{t}</span>)}</div><div className={cx("dp-period")} ><CalendarDays size={20}/>Last 30 Days<ChevronDown size={16}/></div></div>
        <div className={cx("dp-metrics")} >{metrics.map(({label,value,growth,icon:Icon})=><div className={cx("dp-card dp-metric")}  key={label}><Icon size={27}/><div><span>{label}</span><strong>{value}</strong><p><ArrowUp size={15}/><b>{growth}</b><small>vs last 30 days</small></p></div><div className={cx("dp-spark")} >{[9,15,24,22,27,32,41].map((h,i)=><i key={i} style={{height:h,opacity:.25+i*.1}}/>)}</div></div>)}</div>
        <div className={cx("dp-middle")} >
          <section className={cx("dp-card dp-sales")} ><div className={cx("dp-card-title")} ><h3>Sales &amp; Order Trend</h3><div><i/>Order Value <i/>Orders</div></div><div className={cx("dp-sales-body")} ><div className={cx("dp-sales-totals")} ><span>Order Value</span><strong>₹46,72,000</strong><b>↑ +24.6%</b><span>Total Orders</span><strong>1,248</strong><b>↑ +18.4%</b></div><TrendChart/></div></section>
          <section className={cx("dp-card dp-status")} ><h3>Order Status</h3><div className={cx("dp-status-body")} ><div className={cx("dp-donut")} ><div><strong>1,248</strong><span>Orders</span></div></div><div className={cx("dp-legend")} >{statuses.map(([label,count,percent,color])=><div key={label}><i style={{background:color}}/><span>{label}</span><b>{count}</b><small>{percent}</small></div>)}</div></div></section>
          <section className={cx("dp-card dp-actions")} ><h3>Quick Actions</h3>{[{text:"Add Product",icon:Plus},{text:"Create Dealer",icon:UserRound},{text:"Add Salesperson",icon:UsersRound},{text:"Create Offer",icon:Tag},{text:"Bulk Upload",icon:Upload}].map(({text,icon:Icon})=><div key={text}><Icon size={19}/>{text}</div>)}</section>
        </div>
        <div className={cx("dp-bottom")} ><section className={cx("dp-card dp-orders")} ><div className={cx("dp-card-title")} ><h3>Recent Orders</h3><span>View All Orders <ArrowRight size={17}/></span></div><table><thead><tr>{["Order ID","Dealer","Salesperson","Items","Order Value","Status","Ordered On", ""].map((h,i)=><th key={i}>{h}</th>)}</tr></thead><tbody>{orders.map(o=><tr key={o[0]}><td><b>{o[0]}</b></td><td>{o[1]} <span>({o[2]})</span></td><td>{o[3]}</td><td>{o[4]}</td><td><b>{o[5]}</b></td><td><span className={cx(`dp-badge dp-${o[6].toLowerCase()}`)}>{o[6]}</span></td><td>{o[7]}</td><td><MoreHorizontal size={18}/></td></tr>)}</tbody></table></section>
          <section className={cx("dp-card dp-people")} ><h3>Top Salespeople <span>(30 Days)</span></h3>{[["SK","Shubham Kumar","156 orders • ₹8,42,000","+28%"],["AK","Aman Kumar","142 orders • ₹7,96,000","+22%"],["RP","Ravi Prasad","128 orders • ₹6,18,000","+18%"]].map(([initial,name,detail,growth])=><div className={cx("dp-person")}  key={initial}><div>{initial}</div><p><b>{name}</b><span>{detail}</span></p><em>↑ {growth}</em></div>)}<div className={cx("dp-team-link")} >View Sales Team <ArrowRight size={18}/></div></section>
        </div>
      </div>
    </div>
  </div>;
}
