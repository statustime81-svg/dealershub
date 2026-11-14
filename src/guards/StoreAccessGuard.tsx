import { Link, Outlet, useParams } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { routes } from "@/config/routes";
import { useDealerStore } from "@/features/storefront/storefront.hooks";
function StorePermissionCheck({ storeId }: { storeId: string }) {
  const store = useDealerStore(storeId);
  if (store.isPending) return <div className="flex min-h-[50vh] items-center justify-center"><Spinner label="Checking store access" /></div>;
  if (store.isError) return <section className="mx-auto max-w-lg space-y-4 p-6">
    <h1 className="text-2xl font-bold">Store unavailable</h1>
    <p role="alert" className="text-sm leading-6 text-muted">This store may be unpublished, your access may have changed, or the connection failed.</p>
    <div className="flex flex-wrap gap-3">
      <Button variant="secondary" onClick={() => { void store.refetch(); }}>Try again</Button>
      <Link to={routes.dealer.stores} className="inline-flex min-h-11 items-center rounded-lg bg-lime px-4 text-sm font-semibold">Your authorized stores</Link>
    </div>
  </section>;
  return <Outlet />;
}
export function StoreAccessGuard() {
  const { storeId } = useParams();
  const id = z.string().uuid().safeParse(storeId);
  if (!id.success) return <section className="p-6"><h1 className="text-xl font-semibold">Invalid store link</h1>
    <Link to={routes.dealer.stores} className="mt-4 inline-flex min-h-11 items-center text-info">Back to stores</Link></section>;
  return <StorePermissionCheck key={id.data} storeId={id.data} />;
}
