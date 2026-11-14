import {
  useFieldArray,
  useFormContext,
} from "react-hook-form";

import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";

import { ProductPricingFields } from "./ProductPricingFields";

import {
  createDefaultVariant,
  type CatalogEditorValues,
} from "../catalog-editor.schemas";

export function ProductVariantsField() {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<CatalogEditorValues>();

  const {
    fields,
    append,
    remove,
  } = useFieldArray({
    control,
    name: "variants",
  });

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">
          Pricing and variants
        </h2>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            append(createDefaultVariant());
          }}
        >
          Add variant
        </Button>
      </div>

      {fields.map((field, index) => (
        <div
          key={field.id}
          className="space-y-4 rounded-xl border border-border bg-surface p-4 sm:p-5"
        >
          <input
            type="hidden"
            {...register(
              `variants.${index}.variantId`,
            )}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              {...register(
                `variants.${index}.name`,
              )}
              label="Variant name"
              placeholder="Default, Lemon, 1 Ltr…"
              required
              error={
                errors.variants?.[index]?.name?.message
              }
            />

            <Input
              {...register(
                `variants.${index}.sku`,
              )}
              label="SKU"
              error={
                errors.variants?.[index]?.sku?.message
              }
            />
          </div>

          <ProductPricingFields index={index} />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Checkbox
              {...register(
                `variants.${index}.isActive`,
              )}
              label="Variant active"
            />

            {fields.length > 1 && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => remove(index)}
              >
                Remove from form
              </Button>
            )}
          </div>
        </div>
      ))}

      <p className="text-xs leading-5 text-muted">
        Existing variants removed from this form are
        deactivated on save. Historical order records
        are preserved.
      </p>

      {errors.variants?.root?.message && (
        <p className="text-sm text-danger">
          {errors.variants.root.message}
        </p>
      )}
    </section>
  );
}