import { useParams } from "react-router-dom";
import { z } from "zod";

import { EmptyState } from "@/components/shared/EmptyState";

import { ProductEditorPage } from "./ProductEditorPage";

export default function EditProductPage() {
  const { productId } = useParams();

  const result = z
    .string()
    .uuid()
    .safeParse(productId);

  if (!result.success) {
    return (
      <EmptyState
        title="Invalid product"
        description="Open a product from the product list."
      />
    );
  }

  return (
    <ProductEditorPage
      productId={result.data}
    />
  );
}