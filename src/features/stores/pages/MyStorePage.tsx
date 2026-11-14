import type { ReactNode } from "react";
import { NavLink, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { routes } from "@/config/routes";
import { cn } from "@/lib/utils";
import { useCatalogStores } from "@/features/catalog/catalog.hooks";
import { useStoreWorkspace } from "../stores.hooks";
import type { StoreWorkspaceData } from "../stores.schemas";
import { StorePreview } from "../components/StorePreview";

function SelectedStore({ storeId, children }: {
  storeId: string; children: (store: StoreWorkspaceData) => ReactNode;
}) {
  const workspace = useStoreWorkspace(storeId);
  if (workspace.isPending) return <Spinner label="Loading store settings" />;
  if (workspace.isError) return (
    <div><p role="alert" className="text-sm text-danger">Store settings could not load.</p>
      <Button className="mt-3" variant="secondary" onClick={() => { void workspace.refetch(); }}>Try again</Button></div>
  );
  return <div key={workspace.data.id}>{children(workspace.data)}</div>;
}

export function StoreWorkspace({ title, children }: {
  title: string; children: (store: StoreWorkspaceData) => ReactNode;
}) {
  const stores = useCatalogStores();
  const [params, setParams] = useSearchParams();
  const requested = params.get("storeId");
  const selected = stores.data?.find((store) => store.id === requested) ?? stores.data?.[0];
  const query = selected ? `?storeId=${encodeURIComponent(selected.id)}` : "";
  const tabs = [
    ["Store preview", routes.manufacturer.store],
    ["Store settings", `${routes.manufacturer.store}/settings`],
    ["Banners", `${routes.manufacturer.store}/banners`],
    ["Categories", routes.manufacturer.categories],
    ["Brands", routes.manufacturer.brands],
  ];
  return (
    <div className="space-y-6">
      <PageHeader title={title} description="Manage your private wholesale store and branding." />
      {stores.isPending ? <Spinner label="Loading stores" /> : stores.isError ? (
        <div><p role="alert" className="text-sm text-danger">Stores could not load.</p>
          <Button className="mt-3" variant="secondary" onClick={() => { void stores.refetch(); }}>Try again</Button></div>
      ) : !selected ? <EmptyState title="No store available" description="Complete business onboarding first." /> : (
        <>
          <Select label="Store" value={selected.id} containerClassName="max-w-sm"
            onChange={(event) => setParams({ storeId: event.target.value })}>
            {stores.data.map((store) => <option key={store.id} value={store.id}>{store.name}</option>)}
          </Select>
          <nav aria-label="Store management" className="flex gap-2 overflow-x-auto border-b border-border pb-3">
            {tabs.map(([label, path]) => <NavLink key={path} to={`${path}${query}`} end
              className={({ isActive }) => cn("inline-flex min-h-10 shrink-0 items-center rounded-lg px-3 text-sm font-medium",
                isActive ? "bg-midnight text-white" : "text-muted hover:bg-soft")}>{label}</NavLink>)}
          </nav>
          <SelectedStore key={selected.id} storeId={selected.id}>{children}</SelectedStore>
        </>
      )}
    </div>
  );
}

export default function MyStorePage() {
  return <StoreWorkspace title="My store">{(store) => <StorePreview store={store} />}</StoreWorkspace>;
}
