import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

import {
  businessOnboardingSchema,
  type BusinessOnboardingValues,
} from "../businesses.schemas";

interface BusinessProfileFormProps {
  email: string;

  categories: {
    id: string;
    name: string;
  }[];

  disabled?: boolean;

  onSubmit: (
    values: BusinessOnboardingValues,
  ) => Promise<void>;
}

export function BusinessProfileForm({
  email,
  categories,
  disabled = false,
  onSubmit,
}: BusinessProfileFormProps) {
  const {
    register,
    handleSubmit,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<BusinessOnboardingValues>({
    resolver: zodResolver(businessOnboardingSchema),

    defaultValues: {
      businessType: "manufacturer",
      companyName: "",
      contactEmail: email,
      contactPhone: "",
      address: "",
      gstin: "",
      categoryId: "",
      storeName: "",
      storeSlug: "",
    },
  });

  const locked = disabled || isSubmitting;

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className="dh-business-form"
    >
      <fieldset disabled={locked} className="dh-onboarding-fields">
      <legend><span>01</span> Company details</legend>
      <div className="dh-onboarding-field-grid">
      <Select
        {...register("businessType")}
        label="Business type"
        disabled={locked}
        error={errors.businessType?.message}
      >
        <option value="manufacturer">
          Manufacturer
        </option>

        <option value="distributor">
          Distributor
        </option>
      </Select>

      <Input
        {...register("companyName")}
        label="Company name"
        autoComplete="organization"
        required
        disabled={locked}
        error={errors.companyName?.message}
      />

      <Select
        {...register("categoryId")}
        label="Business category"
        disabled={locked}
        error={errors.categoryId?.message}
        hint={
          categories.length === 0
            ? "No business categories have been configured yet."
            : undefined
        }
      >
        <option value="">
          Select a category
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

      </div>
      </fieldset>
      <fieldset disabled={locked} className="dh-onboarding-fields">
      <legend><span>02</span> Contact information</legend>
      <div className="dh-onboarding-field-grid">
      <Input
        {...register("contactEmail")}
        label="Business email"
        type="email"
        autoComplete="email"
        required
        disabled={locked}
        error={errors.contactEmail?.message}
      />

      <Input
        {...register("contactPhone")}
        label="Contact phone"
        type="tel"
        autoComplete="tel"
        disabled={locked}
        error={errors.contactPhone?.message}
      />

      </div>
      <div className="dh-onboarding-address">
      <Textarea
        {...register("address")}
        label="Business address"
        autoComplete="street-address"
        disabled={locked}
        error={errors.address?.message}
      />

      </div>
      <Input
        {...register("gstin")}
        label="GSTIN"
        hint="Optional where applicable."
        disabled={locked}
        error={errors.gstin?.message}
      />

      </fieldset>
      <fieldset disabled={locked} className="dh-onboarding-fields">
      <legend><span>03</span> Your private store</legend>
      <div className="dh-onboarding-field-grid">
      <Input
        {...register("storeName")}
        label="Store name"
        required
        disabled={locked}
        error={errors.storeName?.message}
      />

      <Input
        {...register("storeSlug")}
        label="Store URL name"
        placeholder="your-business-store"
        hint="Lowercase letters, numbers and single hyphens."
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        required
        disabled={locked}
        error={errors.storeSlug?.message}
      />

      </div>
      </fieldset>
      <p className="dh-onboarding-form-note">You can add products and customize your storefront after creating your business.</p>
      <Button
        type="submit"
        className="w-full"
        disabled={disabled}
        isLoading={isSubmitting}
        loadingText="Creating business…"
      >
        Create business and store
      </Button>
    </form>
  );
}