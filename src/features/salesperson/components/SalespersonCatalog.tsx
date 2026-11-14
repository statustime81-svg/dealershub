import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import { QuantityStepper } from "@/components/commerce/QuantityStepper";
import { EmptyState } from "@/components/shared/EmptyState";
import { PrivateImage } from "@/components/shared/PrivateImage";
import { SearchInput } from "@/components/shared/SearchInput";
import { useDebounce } from "@/hooks/useDebounce";
import { useCartMutation } from "@/features/cart/cart.hooks";
import type { DealerProduct, ProductSort } from "@/features/storefront/storefront.schemas";
import { formatCurrency } from "@/lib/formatters";
import { useAssignedStore, useAssignedProducts, useAssignedProduct } from "../salesperson.hooks";
import type { SalespersonShoppingScope } from "../salesperson.schemas";
function BuyVariant({ scope, variant, unit }: { scope: SalespersonShoppingScope; variant: DealerProduct["variants"][number]; unit: string }) {
  const [quantity, setQuantity] = useState(String(variant.moq));
  const number = Number(quantity); const cart = useCartMutation(scope.storeId, scope.dealerId);
  const valid = Number.isSafeInteger(number) && number >= variant.moq && number <= 2147483647 && (number - variant.moq) % variant.quantityStep === 0;
  const available = (variant.availability === "in_stock" || variant.availability === "low_stock") &&
    (variant.stockQuantity === null || number <= variant.stockQuantity);
  return <div className="space-y-4">
    <div className="grid grid-cols-2 gap-3 rounded-lg bg-soft p-4">
      <div><p className="text-xs text-muted">Wholesale price</p><p className="mt-1 font-mono font-semibold">{formatCurrency(variant.price)}</p></div>
      <div><p className="text-xs text-muted">MOQ</p><p className="mt-1 text-sm font-medium">{variant.moq} {unit}</p></div>
    </div>
    {variant.packSize && <p className="text-sm text-muted">Pack size: {variant.packSize}</p>}
    <p className="text-xs text-muted">Availability: {variant.availability.replaceAll("_", " ")}</p>
    <QuantityStepper value={quantity} onChange={setQuantity} min={variant.moq} step={variant.quantityStep}
      max={variant.stockQuantity ?? 2147483647} disabled={cart.isPending} label={`Quantity (${unit})`}
      error={!valid ? "Check MOQ and quantity increment." : !available ? "This quantity is not currently orderable." : undefined} />
    <Button className="w-full" disabled={!valid || !available} isLoading={cart.isPending} loadingText="Adding…"
      onClick={() => cart.mutate({ storeId: scope.storeId, variantId: variant.id, quantity: number, mode: "add" })}>Add to selected dealer cart</Button>
    {cart.isSuccess && <p role="status" className="text-sm text-success">Added to this dealer's cart.</p>}
    {cart.isError && <p role="alert" className="text-sm text-danger">Could not add the item. Check stock, combined cart quantity and current assignment.</p>}
  </div>;
}
function ProductOrderPanel({ scope, product }: { scope: SalespersonShoppingScope; product: DealerProduct }) {
  const [selected, setSelected] = useState("");
  const variant = product.variants.find((item) => item.id === selected) ?? product.variants[0];
  return <div className="grid gap-5 md:grid-cols-2">
    <section><PrivateImage path={product.images[0]?.imagePath} alt={product.images[0]?.altText || product.name} className="h-56 w-full sm:h-64" />
      <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted">{product.description}</p>
      {product.packagingDetails && <p className="mt-3 whitespace-pre-line text-xs leading-5 text-muted">{product.packagingDetails}</p>}</section>
    <section className="space-y-4"><p className="text-xs text-muted">{product.brandName || product.categoryName}</p><h3 className="text-xl font-bold">{product.name}</h3>
      {variant ? <><Select label="Variant" value={variant.id} onChange={(event) => setSelected(event.target.value)}>
        {product.variants.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
      </Select><BuyVariant key={variant.id} scope={scope} variant={variant} unit={product.unit} /></> : <p className="text-sm text-muted">No active variants available.</p>}
    </section>
  </div>;
}
function ProductDialog({ scope, productId, onClose }: { scope: SalespersonShoppingScope; productId: string; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const product = useAssignedProduct(scope, productId);
  useEffect(() => { if (dialogRef.current && !dialogRef.current.open) dialogRef.current.showModal(); }, []);
  return <dialog ref={dialogRef} aria-label="Product details for selected dealer" onClose={onClose}
    className="m-auto max-h-[90dvh] w-[780px] max-w-[95vw] overflow-y-auto rounded-xl border border-border bg-surface p-5 text-foreground backdrop:bg-black/40">
    <div className="mb-5 flex justify-end"><Button autoFocus variant="secondary" onClick={() => dialogRef.current?.close()}>Close</Button></div>
    {product.isPending ? <Spinner label="Loading product" /> : product.isError ? <div><p role="alert" className="text-sm text-danger">Product could not load or assignment access changed.</p>
      <Button variant="secondary" className="mt-3" onClick={() => { void product.refetch(); }}>Try again</Button></div>
      : <ProductOrderPanel scope={scope} product={product.data} />}
  </dialog>;
}
export function SalespersonCatalog({ scope }: { scope: SalespersonShoppingScope }) {
  const store = useAssignedStore(scope);
  const [filters, setFilters] = useState<{ search: string; categoryId: string; brandId: string; sort: ProductSort }>({ search: "", categoryId: "", brandId: "", sort: "newest" });
  const debounced = useDebounce(filters); const key = JSON.stringify(debounced);
  const [pagination, setPagination] = useState({ key: "", page: 1 }); const page = pagination.key === key ? pagination.page : 1;
  const products = useAssignedProducts(scope, { ...debounced, page }); const [selectedProduct, setSelectedProduct] = useState("");
  const pages = Math.max(1, Math.ceil((products.data?.total ?? 0) / (products.data?.pageSize ?? 12)));
  function go(next: number) { setPagination({ key, page: Math.max(1, Math.min(pages, next)) }); }
  if (store.isPending) return <Spinner label="Loading authorized store" />;
  if (store.isError) return <div><p role="alert" className="text-sm text-danger">Selected dealer/store access is unavailable.</p>
    <Button className="mt-3" variant="secondary" onClick={() => { void store.refetch(); }}>Try again</Button></div>;
  return <section className="space-y-5">
    <h2 className="text-base font-semibold tracking-tight">{store.data.name} catalog</h2>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <SearchInput label="Search employer catalog" placeholder="Search products…" maxLength={200} value={filters.search}
        onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} />
      <Select aria-label="Category" value={filters.categoryId} onChange={(event) => setFilters((current) => ({ ...current, categoryId: event.target.value }))}>
        <option value="">All categories</option>{store.data.categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
      </Select>
      <Select aria-label="Brand" value={filters.brandId} onChange={(event) => setFilters((current) => ({ ...current, brandId: event.target.value }))}>
        <option value="">All brands</option>{store.data.brands.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
      </Select>
      <Select aria-label="Sort products" value={filters.sort} onChange={(event) => {
        const sort = event.target.value; if (sort === "newest" || sort === "price_low" || sort === "price_high") setFilters((current) => ({ ...current, sort }));
      }}><option value="newest">Newest first</option><option value="price_low">Price: low to high</option><option value="price_high">Price: high to low</option></Select>
    </div>
    {products.isPending ? <Spinner label="Loading dealer catalog" /> : products.isError ? <div><p role="alert" className="text-sm text-danger">Products could not load.</p>
      <Button className="mt-3" variant="secondary" onClick={() => { void products.refetch(); }}>Try again</Button></div> : <>
      {products.data.items.length ? <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {products.data.items.map((product) => <article key={product.id} className="flex min-w-0 flex-col rounded-xl border border-border bg-surface p-3 shadow-sm transition-colors hover:border-lime-hover">
          <PrivateImage path={product.imagePath} alt={product.name} className="h-32 w-full p-2 sm:h-36" />
          <h3 className="mt-3 line-clamp-2 text-sm font-semibold leading-5 tracking-tight">{product.name}</h3><p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">{product.variant.name}</p>
          <p className="mt-3 font-mono font-semibold">{formatCurrency(product.variant.price)}</p>
          <p className="mt-1 text-xs">MOQ: {product.variant.moq} {product.unit}</p>
          {product.variant.packSize && <p className="mt-1 text-xs text-muted">Pack size: {product.variant.packSize}</p>}
          <Button size="sm" className="mt-3 w-full" onClick={() => setSelectedProduct(product.id)}>Select quantity</Button>
        </article>)}
      </div> : <EmptyState title="No products found" description="Adjust category, brand or search filters." />}
      <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-muted">{products.data.total} products · Page {page} of {pages}</p>
        <div className="flex gap-2"><Button size="sm" variant="secondary" disabled={page <= 1 || products.isFetching} onClick={() => go(page - 1)}>Previous</Button>
          <Button size="sm" variant="secondary" disabled={page >= pages || products.isFetching} onClick={() => go(page + 1)}>Next</Button></div></div>
    </>}
    {selectedProduct && <ProductDialog key={selectedProduct} scope={scope} productId={selectedProduct} onClose={() => setSelectedProduct("")} />}
  </section>;
}
