import { Link, Navigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { routeBuilders, routes } from "@/config/routes";
import { useAuthorizedStores } from "../storefront.hooks";
export default function AuthorizedStoresPage() {
  const stores = useAuthorizedStores(); const [params] = useSearchParams(); const requested = params.get("storeId");
  if (stores.isPending) return <div className="ds-loading"><Spinner label="Opening your authorized store"/></div>;
  if (stores.isError) return <section className="ds-state"><h1>Your store could not load</h1><p role="alert">Check your connection or store authorization and try again.</p><Button variant="secondary" onClick={() => { void stores.refetch(); }}>Try again</Button></section>;
  if (!stores.data.length) return <section className="ds-state"><EmptyState title="Your wholesale workspace is almost ready" description="Accept your business invitation to access a store. Your supplier must publish the store and keep your access active." action={<Link className="ds-button ds-button-primary" to={routes.auth.acceptInvitation}>View invitations</Link>}/></section>;
  const selected = requested ? stores.data.find(store => store.id === requested) : stores.data[0];
  if (!selected) return <section className="ds-state"><h1>Store unavailable</h1><p role="alert">This store is not in your current authorized stores.</p><Link className="ds-button ds-button-primary" to={routes.dealer.stores}>Open my authorized store</Link></section>;
  return <Navigate to={routeBuilders.store(selected.id)} replace/>;
}
