import { useState } from "react";

import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";

import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";

import {
  routeBuilders,
} from "@/config/routes";

import { useBusiness } from "@/hooks/useBusiness";

import { useCatalogStores } from "../catalog.hooks";

import {
  useEditorOptions,
  useEditorProduct,
  useSaveEditorProduct,
} from "../catalog-editor.hooks";

import {
  createDefaultProduct,
  type CatalogEditorValues,
} from "../catalog-editor.schemas";

import { ProductForm } from "../components/ProductForm";
import { ProductImagesField } from "../components/ProductImagesField";

function StoreProductEditor({
  storeId,
  productId,
}: {
  storeId: string;
  productId?: string;
}) {
  const navigate = useNavigate();

  const { activeBusinessId } = useBusiness();

  const options = useEditorOptions();
  const existing = useEditorProduct(storeId, productId);
  const save = useSaveEditorProduct();

  const [newProductId] = useState(
    () => crypto.randomUUID(),
  );

  const [defaults] = useState(createDefaultProduct);

  const [error, setError] =
    useState<string | null>(null);

  if (
    options.isPending ||
    (Boolean(productId) && existing.isPending)
  ) {
    return <Spinner label="Loading product editor" />;
  }

  if (
    options.isError ||
    (Boolean(productId) && existing.isError)
  ) {
    return (
      <div>
        <p role="alert" className="text-sm text-danger">
          Product or category data could not load.
          Check the selected store.
        </p>

        <Button
          className="mt-4"
          variant="secondary"
          onClick={() => {
            void options.refetch();

            if (productId) {
              void existing.refetch();
            }
          }}
        >
          Try again
        </Button>
      </div>
    );
  }

  const initialValues =
    productId ? existing.data : defaults;

  if (!initialValues || !options.data) {
    return null;
  }

  async function handleSave(
    values: CatalogEditorValues,
  ) {
    if (!activeBusinessId) {
      return;
    }

    setError(null);

    try {
      const result = await save.mutateAsync({
        businessId: activeBusinessId,
        storeId,
        productId: productId ?? newProductId,
        create: !productId,
        values,
      });

      if (!productId) {
        navigate(
          `${routeBuilders.editProduct(result.productId)}?storeId=${encodeURIComponent(storeId)}`,
          { replace: true },
        );
      }
    } catch {
      setError(
        "Save failed. Check category, brand and SKU uniqueness. After a timeout, check the product list before creating again.",
      );
    }
  }

  return (
    <div className="space-y-6">
      {save.isSuccess && (
        <p role="status" className="text-sm text-success">
          Product saved.
        </p>
      )}

      <ProductForm
        initialValues={initialValues}
        categories={options.data.categories}
        brands={options.data.brands}
        onSave={handleSave}
        error={error}
      />

      {productId ? (
        <ProductImagesField
          productId={productId}
          storeId={storeId}
        />
      ) : (
        <p className="text-sm text-muted">
          Save the product first, then upload its images.
        </p>
      )}
    </div>
  );
}

export function ProductEditorPage({
  productId,
}: {
  productId?: string;
}) {
  const stores = useCatalogStores();
  const { activeBusinessId } = useBusiness();

  const [params, setParams] = useSearchParams();

  const selectedId = params.get("storeId");

  const store =
    stores.data?.find(
      (item) => item.id === selectedId,
    ) ??
    stores.data?.[0] ??
    null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={productId ? "Edit product" : "Add new product"}
        description="Manage product details, pricing, variants and images."
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
            containerClassName="max-w-sm"
            value={store.id}
            onChange={(event) => {
              setParams({
                storeId: event.target.value,
              });
            }}
          >
            {stores.data.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>

          <StoreProductEditor
            key={`${activeBusinessId}:${store.id}:${productId ?? "new"}`}
            storeId={store.id}
            productId={productId}
          />
        </>
      )}
    </div>
  );
}