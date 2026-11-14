import { BusinessCategoryManager } from "../components/BusinessCategoryManager";
import { StoreCategoryImageField } from "@/features/stores/components/StoreCategoryImageField";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { SearchInput } from "@/components/shared/SearchInput";
import { useAuth } from "@/hooks/useAuth";
import { StoreWorkspace } from "@/features/stores/pages/MyStorePage";
import { useStoreTaxonomy } from "@/features/stores/stores.hooks";
import { setStoreTaxonomy } from "@/features/stores/stores.api";
import type { StoreTaxonomyKind, StoreWorkspaceData } from "@/features/stores/stores.schemas";

export function StoreTaxonomyManager({ store, kind }: {
  store: StoreWorkspaceData; kind: StoreTaxonomyKind;
}) {
  const { user } = useAuth();
  const cache = useQueryClient();
  const taxonomy = useStoreTaxonomy(store.id, kind);
  const [search, setSearch] = useState("");
  const mutation = useMutation({
    mutationFn: (input: { itemId: string; enabled: boolean }) =>
      setStoreTaxonomy({ storeId: store.id, kind, ...input }),
    onSuccess: async () => {
      await cache.invalidateQueries({ queryKey: ["user", user?.id, "business", store.business_id] });
    },
  });
  const rows = taxonomy.data?.items.filter((item) =>
    item.name.toLowerCase().includes(search.trim().toLowerCase())) ?? [];
  return <section className="space-y-4">
    <p className="text-sm leading-6 text-muted">Select existing {kind} for this store. Global names are maintained by the platform administrator.</p>
    <SearchInput label={`Search ${kind}`} placeholder={`Search ${kind}…`} value={search}
      onChange={(event) => setSearch(event.target.value)} />
    {mutation.isError && <p role="alert" className="text-sm text-danger">
      Selection could not be changed. A category or brand used by a product cannot be removed; update those products first.
    </p>}
    {mutation.isSuccess && <p role="status" className="text-sm text-success">Store selection saved.</p>}
    {taxonomy.isPending ? <Spinner label={`Loading ${kind}`} /> : taxonomy.isError ? (
      <div><p role="alert" className="text-sm text-danger">Selections could not load.</p>
        <Button className="mt-3" variant="secondary" onClick={() => { void taxonomy.refetch(); }}>Try again</Button></div>
    ) : !rows.length ? <EmptyState title={`No ${kind} found`} description="Try another search. If the list is empty, ask the platform administrator to configure the taxonomy." /> : (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{rows.map((item) => (
        <div key={item.id} className="rounded-lg border border-border bg-surface px-4 py-2">
          <Checkbox label={item.name} checked={taxonomy.data.assignedIds.includes(item.id)}
            disabled={mutation.isPending || taxonomy.isFetching}
            onChange={(event) => mutation.mutate({ itemId: item.id, enabled: event.target.checked })} />
          {kind === "categories" && taxonomy.data.assignedIds.includes(item.id) &&
            <StoreCategoryImageField storeId={store.id} categoryId={item.id} name={item.name}
              disabled={mutation.isPending || taxonomy.isFetching} />}
        </div>
      ))}</div>
    )}
  </section>;
}
export default function CategoriesPage() {
  return <StoreWorkspace title="Store categories">{(store) =>
    <div key={store.id} className="space-y-6">
      <BusinessCategoryManager businessId={store.business_id} storeId={store.id}/>
      <StoreTaxonomyManager store={store} kind="categories" />
    </div>}
  </StoreWorkspace>;
}
