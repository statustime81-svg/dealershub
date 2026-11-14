import { Link, Outlet, useParams } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { useDealerStore } from "@/features/storefront/storefront.hooks";
import { routes } from "@/config/routes";
export default function StorefrontLayout() {
  const { storeId = "" } = useParams(); const store = useDealerStore(storeId);
  if (!store.data || store.isError) return null;
  return <div className="ds-store-content"><div className="ds-context-line"><span><ShieldCheck size={13}/> Authorized access · {store.data.businessName}</span><Link to={routes.auth.acceptInvitation}>Manage invitations</Link></div><Outlet/></div>;
}
