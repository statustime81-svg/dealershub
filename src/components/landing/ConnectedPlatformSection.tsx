import { useId } from "react";
import { ClipboardList, Package, Users } from "lucide-react";

type VisualKind = "catalog" | "network" | "orders";

const features = [
  { kind: "catalog" as const, icon: Package, number: "01", title: <>A catalog that<br />means business.</>, description: "Product variants, wholesale prices, and minimum order quantities (MOQ) in one place.", chips: ["Product variants", "Wholesale prices", "MOQ"] },
  { kind: "network" as const, icon: Users, number: "02", title: <>Your network.<br />Connected.</>, description: "Authorize dealers, assign your salespeople and bring the people behind your business into one workspace.", chips: ["Dealer access", "Sales assignments", "Team accounts"] },
  { kind: "orders" as const, icon: ClipboardList, number: "03", title: <>Keep every<br />order in view.</>, description: "Bring dealer and sales-team orders together. Review order history, status tracking, and business reports in one place.", chips: ["Order history", "Status tracking", "Business reports"] },
];

function Person({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <ellipse cy="8" rx="27" ry="16" fill="#c2cdb4" />
    <path d="M-27 0v8a27 16 0 0 0 54 0V0" fill="#ced8bf" />
    <ellipse rx="27" ry="16" fill="#f0f4e9" stroke="#e3e9d9" />
    <ellipse cy="-5" rx="7" ry="5.5" fill="#718c54" />
    <path d="M-12 8c0-11 24-11 24 0Z" fill="#637d49" />
    <ellipse cy="-7" rx="4" ry="2" fill="#9bad83" opacity=".5" />
  </g>;
}

function FeatureVisual({ kind }: { kind: VisualKind }) {
  const id = useId().replace(/:/g, "");
  return <svg className={`dh-connected-art dh-connected-art-${kind}`} viewBox="0 0 400 240" fill="none" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id={`${id}-top`} x1="100" y1="30" x2="255" y2="125" gradientUnits="userSpaceOnUse"><stop stopColor="#edff8a" /><stop offset=".55" stopColor="#d7fc39" /><stop offset="1" stopColor="#b8e923" /></linearGradient>
      <linearGradient id={`${id}-left`} x1="117" y1="83" x2="189" y2="216" gradientUnits="userSpaceOnUse"><stop stopColor="#d1f632" /><stop offset="1" stopColor="#9ec51c" /></linearGradient>
      <linearGradient id={`${id}-right`} x1="195" y1="133" x2="285" y2="192" gradientUnits="userSpaceOnUse"><stop stopColor="#b9e421" /><stop offset="1" stopColor="#99c51b" /></linearGradient>
      <linearGradient id={`${id}-paper`} x1="140" y1="70" x2="260" y2="210" gradientUnits="userSpaceOnUse"><stop stopColor="#fffffa" /><stop offset="1" stopColor="#e7eddf" /></linearGradient>
      <radialGradient id={`${id}-shadow`}><stop stopColor="#78915a" stopOpacity=".36" /><stop offset="1" stopColor="#78915a" stopOpacity="0" /></radialGradient>
    </defs>
    <ellipse cx="200" cy="210" rx="150" ry="25" fill={`url(#${id}-shadow)`} />
    {kind === "catalog" && <g className="dh-connected-float">
      <path d="M116 66 187 28q10-6 20 0l76 39q11 6 0 13l-77 40q-10 5-20 0l-70-38q-14-8 0-16Z" fill={`url(#${id}-top)`} stroke="#e0ff75" strokeWidth="2" />
      <path d="M108 77q0-6 9-1l70 38q10 5 10 17v79q0 9-11 4l-65-36q-13-7-13-21Z" fill={`url(#${id}-left)`} />
      <path d="m204 120 74-39q13-8 13 6v72q0 14-12 21l-67 35q-11 6-11-7v-74q0-10 3-14Z" fill={`url(#${id}-right)`} />
      <path d="m119 70 72 38q8 4 13 1l75-39M198 124v78" stroke="#edff91" strokeWidth="3" strokeLinecap="round" opacity=".58" />
    </g>}
    {kind === "network" && <g className="dh-connected-float">
      <ellipse cx="200" cy="134" rx="127" ry="73" stroke="#d4ef8c" strokeWidth="4" />
      <ellipse cx="200" cy="131" rx="127" ry="73" stroke="#d2fa4b" strokeWidth="2" />
      <Person x={200} y={134} scale={2.05} />
      <Person x={118} y={72} /><Person x={278} y={86} /><Person x={85} y={163} /><Person x={282} y={191} />
    </g>}
    {kind === "orders" && <g className="dh-connected-float" transform="translate(20 0)">
      <g transform="translate(64 52) rotate(-11)"><rect x="3" y="5" width="238" height="115" rx="17" fill="#c4cfb9" /><rect width="238" height="115" rx="17" fill="#e3e9dc" stroke="#f5f8ef" strokeWidth="3" /></g>
      <g transform="translate(82 75) rotate(-11)"><rect x="3" y="5" width="238" height="115" rx="17" fill="#c3ceb7" /><rect width="238" height="115" rx="17" fill="#edf1e7" stroke="#fafff6" strokeWidth="3" /></g>
      <g transform="translate(100 99) rotate(-11)"><rect x="2" y="5" width="238" height="112" rx="17" fill="#b9c6aa" /><rect width="238" height="112" rx="17" fill={`url(#${id}-paper)`} stroke="#fafff5" strokeWidth="3" />
        <path d="M24 41h9l7 27h28l7-20H36M44 79h.1M65 79h.1" stroke="#587047" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M99 42h77M99 57h53" stroke="#b8c5ac" strokeWidth="7" strokeLinecap="round" />
        <circle cx="204" cy="52" r="15" fill="#d6f74e" /><path d="m197 52 5 5 9-12" stroke="#526a2b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </g>}
  </svg>;
}

export default function ConnectedPlatformSection() {
  return <section id="platform" className="dh-connected-section">
    <div className="dh-container">
      <div className="dh-connected-heading" data-reveal>
        <div><p className="dh-connected-eyebrow">ONE CONNECTED PLATFORM</p><h2>Less scattered.<br /><span>More in control.</span></h2></div>
        <p className="dh-connected-intro">From the first product in your catalog to the next dealer in your network. Give your business room to move.</p>
      </div>
      <div className="dh-connected-panel" data-reveal>
        <div className="dh-connected-line" aria-hidden="true" />
        <div className="grid grid-cols-1 md:grid-cols-3">
          {features.map(({ kind, icon: Icon, number, title, description, chips }) => <article key={kind} className="dh-connected-feature">
            <div className="dh-connected-node"><Icon size={29} strokeWidth={1.7} aria-hidden="true" /></div>
            <div className="dh-connected-content">
              <span className="dh-connected-number">/{number}</span>
              <FeatureVisual kind={kind} />
              <h3>{title}</h3>
              <p className="dh-connected-description">{description}</p>
              <ul className="dh-connected-chips" aria-label="Included features">{chips.map(chip => <li key={chip}>{chip}</li>)}</ul>
            </div>
          </article>)}
        </div>
      </div>
    </div>
  </section>;
}
