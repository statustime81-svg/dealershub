import { Select } from "@/components/ui/Select";
import { SearchInput } from "@/components/shared/SearchInput";

import type {
  ProductStatusFilter,
} from "../catalog.api";

export interface CatalogFilters {
  search: string;
  categoryId: string;
  brandId: string;
  status: ProductStatusFilter;
}

interface Option {
  id: string;
  name: string;
}

interface ProductFiltersProps {
  value: CatalogFilters;

  categories: Option[];
  brands: Option[];

  optionsDisabled?: boolean;

  onChange: (value: CatalogFilters) => void;
}

export function ProductFilters({
  value,
  categories,
  brands,
  optionsDisabled,
  onChange,
}: ProductFiltersProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1fr]">
      <SearchInput
        label="Search products"
        placeholder="Search products…"
        maxLength={200}
        value={value.search}
        onChange={(event) => {
          onChange({
            ...value,
            search: event.target.value,
          });
        }}
      />

      <Select
        aria-label="Filter by category"
        value={value.categoryId}
        disabled={optionsDisabled}
        onChange={(event) => {
          onChange({
            ...value,
            categoryId: event.target.value,
          });
        }}
      >
        <option value="">All categories</option>

        {categories.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </Select>

      <Select
        aria-label="Filter by brand"
        value={value.brandId}
        disabled={optionsDisabled}
        onChange={(event) => {
          onChange({
            ...value,
            brandId: event.target.value,
          });
        }}
      >
        <option value="">All brands</option>

        {brands.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </Select>

      <Select
        aria-label="Filter by status"
        value={value.status}
        onChange={(event) => {
          const status = event.target.value;

          if (
            status === "all" ||
            status === "active" ||
            status === "inactive"
          ) {
            onChange({
              ...value,
              status,
            });
          }
        }}
      >
        <option value="all">All statuses</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </Select>
    </div>
  );
}