import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

import { PrivateImage } from "@/components/shared/PrivateImage";

import { routeBuilders } from "@/config/routes";

import {
  formatCurrency,
  formatNumber,
} from "@/lib/formatters";

import type { ProductListRow } from "../catalog.schemas";

interface ProductsTableProps {
  products: ProductListRow[];
  busyProductId: string | null;
  onToggleActive: (product: ProductListRow) => void;
}

export function ProductsTable({
  products,
  busyProductId,
  onToggleActive,
}: ProductsTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full min-w-[900px] text-left text-sm">
        <caption className="sr-only">
          Store products and wholesale details
        </caption>

        <thead className="bg-soft text-xs text-muted">
          <tr>
            {[
              "Product",
              "Category",
              "MOQ",
              "Wholesale price",
              "Stock",
              "Status",
              "Actions",
            ].map((heading) => (
              <th
                key={heading}
                scope="col"
                className="px-4 py-3"
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-border">
          {products.map((product) => {
            const variants = product.variants.filter(
              (item) => item.is_active,
            );

            const variant =
              variants.length === 1
                ? variants[0]
                : null;

            const label =
              variants.length > 1
                ? `${variants.length} variants`
                : "Not configured";

            const image = [...product.images].sort(
              (a, b) => a.sort_order - b.sort_order,
            )[0];

            const editUrl =
              `${routeBuilders.editProduct(product.id)}?storeId=${encodeURIComponent(product.store_id)}`;

            return (
              <tr
                key={product.id}
                className="hover:bg-soft/50"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <PrivateImage
                      path={image?.image_path}
                      alt={
                        image?.alt_text || product.name
                      }
                      className="size-12 shrink-0"
                    />

                    <div>
                      <Link
                        to={editUrl}
                        className="font-medium hover:underline"
                      >
                        {product.name}
                      </Link>

                      <p className="mt-1 text-xs text-muted">
                        {product.brand?.name ?? "No brand"}
                      </p>

                      {variant?.sku && (
                        <p className="mt-1 font-mono text-xs text-muted">
                          {variant.sku}
                        </p>
                      )}
                    </div>
                  </div>
                </td>

                <td className="px-4 py-3">
                  {product.category?.name ?? "—"}
                </td>

                <td className="px-4 py-3">
                  {variant
                    ? `${formatNumber(variant.moq)} ${product.unit}`
                    : label}
                </td>

                <td className="px-4 py-3 font-mono text-xs">
                  {variant
                    ? formatCurrency(
                        variant.wholesale_price,
                      )
                    : label}
                </td>

                <td className="px-4 py-3 font-mono text-xs">
                  {variant
                    ? variant.stock_quantity === null
                      ? "Not tracked"
                      : formatNumber(
                          variant.stock_quantity,
                        )
                    : "—"}
                </td>

                <td className="px-4 py-3">
                  <Badge
                    variant={
                      product.is_active
                        ? "success"
                        : "neutral"
                    }
                  >
                    {product.is_active
                      ? "Active"
                      : "Inactive"}
                  </Badge>
                </td>

                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link
                      to={editUrl}
                      className="inline-flex min-h-10 items-center rounded-lg border border-border px-3 text-xs font-medium"
                    >
                      Edit
                    </Link>

                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={busyProductId !== null}
                      isLoading={
                        busyProductId === product.id
                      }
                      loadingText="Saving…"
                      aria-label={
                        `${product.is_active ? "Deactivate" : "Activate"} ${product.name}`
                      }
                      onClick={() => {
                        onToggleActive(product);
                      }}
                    >
                      {product.is_active
                        ? "Deactivate"
                        : "Activate"}
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}