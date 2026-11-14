import { useParams, useSearchParams } from "react-router-dom";
import { Spinner } from "@/components/ui/Spinner";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useBusiness } from "@/hooks/useBusiness";
import { useAssignedDealerWorkspace } from "../salesperson.hooks";
import { SelectedDealerBanner } from "../components/SelectedDealerBanner";
import { SalespersonCatalog } from "../components/SalespersonCatalog";
import { SalespersonCartCheckout } from "../components/SalespersonCartCheckout";
export default function DealerWorkspacePage() {
  const { dealerId = "" } = useParams(); const { activeBusinessId } = useBusiness();
  const [params, setParams] = useSearchParams();
  const businessId = activeBusinessId ?? "";
  const workspace = useAssignedDealerWorkspace(businessId, dealerId);
  if (workspace.isPending) return <Spinner label="Loading dealer workspace" />;
  if (workspace.isError) return <p role="alert" className="text-sm text-danger">Dealer workspace could not load.</p>;
  const requestedStore = params.get("storeId");
  const store = workspace.data.stores.find((item) => item.id === requestedStore) ?? workspace.data.stores[0];
  if (!store) return null;
  const view = params.get("view") === "cart" ? "cart" : "catalog";
  function update(nextStore: string, nextView: string) { setParams({ businessId, storeId: nextStore, view: nextView }); }
  const scope = { businessId, dealerId, storeId: store.id };
  return <div className="space-y-4">
    <SelectedDealerBanner dealer={workspace.data} businessId={businessId} />
    <div className="flex flex-wrap items-end justify-between gap-3">
      <Select label="Authorized store" containerClassName="w-full sm:max-w-xs" value={store.id} onChange={(event) => update(event.target.value, "catalog")}>
        {workspace.data.stores.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
      </Select>
      <div className="flex gap-2"><Button size="sm" variant={view === "catalog" ? "primary" : "secondary"} onClick={() => update(store.id, "catalog")}>Catalog</Button>
        <Button size="sm" variant={view === "cart" ? "primary" : "secondary"} onClick={() => update(store.id, "cart")}>Dealer cart</Button></div>
    </div>
    {view === "catalog" ? <SalespersonCatalog key={`${businessId}:${dealerId}:${store.id}`} scope={scope} />
      : <SalespersonCartCheckout key={`${businessId}:${dealerId}:${store.id}`} scope={scope} />}
  </div>;
}
