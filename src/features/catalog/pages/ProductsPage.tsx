import { useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";

import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";

import { routes } from "@/config/routes";

import { useAuth } from "@/hooks/useAuth";
import { useBusiness } from "@/hooks/useBusiness";
import { useDebounce } from "@/hooks/useDebounce";

import { PRODUCT_PAGE_SIZE } from "../catalog.api";

import {
  useCatalogFilterOptions,
  useCatalogStores,
  useProductActivation,
  useProducts,
} from "../catalog.hooks";

import {
  ProductFilters,
  type CatalogFilters,
} from "../components/ProductFilters";

import { ProductsTable } from "../components/ProductsTable";

import type { ProductListRow } from "../catalog.schemas";

function StoreProducts({
  storeId,
}: {
  storeId: string;
}) {
  const [filters, setFilters] = useState<CatalogFilters>({
    search: "",
    categoryId: "",
    brandId: "",
    status: "all",
  });

  const debounced = useDebounce(filters);
  const filterKey = JSON.stringify(debounced);

  const [pagination, setPagination] = useState({
    key: "",
    page: 1,
  });

  const page =
    pagination.key === filterKey
      ? pagination.page
      : 1;

  const options = useCatalogFilterOptions();

  const products = useProducts({
    storeId,
    ...debounced,
    page,
  });

  const activation = useProductActivation();

  const pages = Math.max(
    1,
    Math.ceil(
      (products.data?.total ?? 0) /
        PRODUCT_PAGE_SIZE,
    ),
  );

  async function toggle(product: ProductListRow) {
    try {
      await activation.mutateAsync({
        storeId,
        productId: product.id,
        isActive: !product.is_active,
      });
    } catch {
      // Error displayed below.
    }
  }

  function go(next: number) {
    setPagination({
      key: filterKey,
      page: Math.max(1, Math.min(pages, next)),
    });
  }

  return (
    <div className="space-y-4">
      <ProductFilters
        value={filters}
        onChange={setFilters}
        categories={options.data?.categories ?? []}
        brands={options.data?.brands ?? []}
        optionsDisabled={
          options.isPending || options.isError
        }
      />

      {options.isError && (
        <div>
          <p className="text-sm text-danger" role="alert">
            Category and brand filters could not load.
          </p>

          <Button
            size="sm"
            variant="secondary"
            className="mt-2"
            onClick={() => {
              void options.refetch();
            }}
          >
            Retry filters
          </Button>
        </div>
      )}

      {activation.isError && (
        <p role="alert" className="text-sm text-danger">
          Product status could not be updated.
        </p>
      )}

      {activation.isSuccess && (
        <p role="status" className="text-sm text-success">
          Product status updated.
        </p>
      )}

      {products.isPending ? (
        <Spinner label="Loading products" />
      ) : products.isError ? (
        <div>
          <p role="alert" className="text-sm text-danger">
            Products could not load.
          </p>

          <Button
            className="mt-3"
            variant="secondary"
            onClick={() => {
              void products.refetch();
            }}
          >
            Try again
          </Button>
        </div>
      ) : (
        <>
          {products.data.items.length ? (
            <ProductsTable
              products={products.data.items}
              busyProductId={
                activation.isPending
                  ? activation.variables.productId
                  : null
              }
              onToggleActive={(product) => {
                void toggle(product);
              }}
            />
          ) : (
            <EmptyState
              title="No products found"
              description="Add products or adjust your filters."
            />
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p
              aria-live="polite"
              className="text-xs text-muted"
            >
              {products.data.total} products
              {" · "}Page {page} of {pages}
            </p>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                disabled={
                  page <= 1 || products.isFetching
                }
                onClick={() => go(page - 1)}
              >
                Previous
              </Button>

              <Button
                size="sm"
                variant="secondary"
                disabled={
                  page >= pages || products.isFetching
                }
                onClick={() => go(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function ProductsPage() {
  const { user } = useAuth();
  const { activeBusinessId } = useBusiness();

  const stores = useCatalogStores();

  const [selectedId, setSelectedId] = useState("");

  const store =
    stores.data?.find(
      (item) => item.id === selectedId,
    ) ??
    stores.data?.[0] ??
    null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Add and manage your product catalog."
        actions={
          store ? (
            <Link
              to={
                `${routes.manufacturer.addProduct}?storeId=${encodeURIComponent(store.id)}`
              }
              className="inline-flex min-h-11 items-center rounded-lg bg-lime px-4 text-sm font-semibold text-midnight hover:bg-lime-hover"
            >
              + Add product
            </Link>
          ) : undefined
        }
      />

      {stores.isPending ? (
        <Spinner label="Loading stores" />
      ) : stores.isError ? (
        <div>
          <p role="alert" className="text-sm text-danger">
            Stores could not load.
          </p>

          <Button
            className="mt-3"
            variant="secondary"
            onClick={() => {
              void stores.refetch();
            }}
          >
            Try again
          </Button>
        </div>
      ) : !store ? (
        <EmptyState
          title="No store available"
          description="Complete business setup first."
        />
      ) : (
        <>
          <Select
            label="Store"
            value={store.id}
            containerClassName="max-w-sm"
            onChange={(event) => {
              setSelectedId(event.target.value);
            }}
          >
            {stores.data.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>

          <StoreProducts
            key={`${user?.id}:${activeBusinessId}:${store.id}`}
            storeId={store.id}
          />
        </>
      )}
    </div>
  );
}