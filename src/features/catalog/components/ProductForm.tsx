import {
  FormProvider,
  useForm,
} from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { Link } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

import { routes } from "@/config/routes";

import { ProductVariantsField } from "./ProductVariantsField";

import {
  catalogEditorSchema,
  type CatalogEditorValues,
} from "../catalog-editor.schemas";

interface Option {
  id: string;
  name: string;
}

interface ProductFormProps {
  initialValues: CatalogEditorValues;

  categories: Option[];
  brands: Option[];

  onSave: (
    values: CatalogEditorValues,
  ) => Promise<void>;

  error: string | null;
}

export function ProductForm({
  initialValues,
  categories,
  brands,
  onSave,
  error,
}: ProductFormProps) {
  const form = useForm<CatalogEditorValues>({
    resolver: zodResolver(catalogEditorSchema),
    defaultValues: initialValues,
  });

  const {
    register,
    handleSubmit,
    formState: {
      errors,
      isSubmitting,
    },
  } = form;

  return (
    <FormProvider {...form}>
      <form
        noValidate
        onSubmit={handleSubmit(onSave)}
        className="space-y-6"
      >
        <fieldset
          disabled={isSubmitting}
          className="min-w-0 space-y-6"
        >
          <section className="space-y-4 rounded-xl border border-border bg-surface p-4 sm:p-5">
            <h2 className="text-lg font-semibold">
              Product details
            </h2>

            <Input
              {...register("name")}
              label="Product name"
              required
              error={errors.name?.message}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                {...register("categoryId")}
                label="Category"
                required
                error={errors.categoryId?.message}
              >
                <option value="">
                  Select category
                </option>

                {categories.map((category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </option>
                ))}
              </Select>

              <Select
                {...register("brandId")}
                label="Brand"
                error={errors.brandId?.message}
              >
                <option value="">No brand</option>

                {brands.map((brand) => (
                  <option
                    key={brand.id}
                    value={brand.id}
                  >
                    {brand.name}
                  </option>
                ))}
              </Select>
            </div>

            <Input
              {...register("unit")}
              label="Selling unit"
              placeholder="Pcs, cases, packs…"
              required
              error={errors.unit?.message}
            />

            <Textarea
              {...register("description")}
              label="Description"
              error={errors.description?.message}
            />

            <Textarea
              {...register("packagingDetails")}
              label="Packaging details"
              error={
                errors.packagingDetails?.message
              }
            />

            <Checkbox
              {...register("isActive")}
              label="Product active"
            />
          </section>

          <ProductVariantsField />
        </fieldset>

        {error && (
          <p
            role="alert"
            className="text-sm text-danger"
          >
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            isLoading={isSubmitting}
            loadingText="Saving product…"
            disabled={categories.length === 0}
          >
            Save product
          </Button>

          {!isSubmitting && (
            <Link
              to={routes.manufacturer.products}
              className="inline-flex min-h-11 items-center rounded-lg border border-border bg-surface px-4 text-sm font-medium"
            >
              Cancel
            </Link>
          )}
        </div>

        {categories.length === 0 && (
          <p className="text-sm text-amber-800">
            An active product category must be
            configured before a product can be saved.
          </p>
        )}
      </form>
    </FormProvider>
  );
}