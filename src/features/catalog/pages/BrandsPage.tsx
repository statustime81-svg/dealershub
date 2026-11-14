import { StoreWorkspace } from "@/features/stores/pages/MyStorePage";
import { StoreTaxonomyManager } from "./CategoriesPage";
export default function BrandsPage() {
  return <StoreWorkspace title="Store brands">{(store) =>
    <StoreTaxonomyManager key={`${store.id}:brands`} store={store} kind="brands" />}
  </StoreWorkspace>;
}
