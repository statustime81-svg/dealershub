import { useFormContext } from "react-hook-form";

import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

import type {
  CatalogEditorValues,
} from "../catalog-editor.schemas";

interface ProductPricingFieldsProps {
  index: number;
}

const optionalNumber = (value: string) =>
  value === "" ? null : Number(value);

export function ProductPricingFields({
  index,
}: ProductPricingFieldsProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<CatalogEditorValues>();

  const error = errors.variants?.[index];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Input
        {...register(
          `variants.${index}.wholesalePrice`,
          { valueAsNumber: true },
        )}
        label="Wholesale price (₹)"
        type="number"
        min="0"
        step="0.01"
        required
        error={error?.wholesalePrice?.message}
      />

      <Input
        {...register(
          `variants.${index}.moq`,
          { valueAsNumber: true },
        )}
        label="Minimum order quantity"
        type="number"
        min="1"
        step="1"
        required
        error={error?.moq?.message}
      />

      <Input
        {...register(
          `variants.${index}.quantityStep`,
          { valueAsNumber: true },
        )}
        label="Quantity increment"
        type="number"
        min="1"
        step="1"
        hint="Allowed quantity starts at MOQ and increases by this value."
        required
        error={error?.quantityStep?.message}
      />

      <Input
        {...register(
          `variants.${index}.stockQuantity`,
          { setValueAs: optionalNumber },
        )}
        label="Stock quantity"
        type="number"
        min="0"
        step="1"
        hint="Leave blank when exact stock is not tracked."
        error={error?.stockQuantity?.message}
      />

      <Input
        {...register(
          `variants.${index}.packSize`,
        )}
        label="Pack size"
        placeholder="For example: 5 Ltr"
        error={error?.packSize?.message}
      />

      <Input
        {...register(
          `variants.${index}.unitsPerPack`,
          { setValueAs: optionalNumber },
        )}
        label="Units per pack"
        type="number"
        min="1"
        step="1"
        error={error?.unitsPerPack?.message}
      />

      <Select
        {...register(
          `variants.${index}.availability`,
        )}
        label="Availability"
        error={error?.availability?.message}
      >
        <option value="in_stock">In stock</option>
        <option value="low_stock">Low stock</option>
        <option value="out_of_stock">
          Out of stock
        </option>
        <option value="enquire">Enquire</option>
      </Select>
    </div>
  );
}