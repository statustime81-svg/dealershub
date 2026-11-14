export type StockAvailability =
  | "in_stock"
  | "low_stock"
  | "out_of_stock"
  | "enquire";

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface ProductCategory {
  id: string;
  parent_id: string | null;

  name: string;
  slug: string;

  image_path: string | null;
  description: string | null;

  is_active: boolean;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
}

export interface Product {
  id: string;
  store_id: string;

  category_id: string;
  brand_id: string | null;

  name: string;
  description: string | null;

  unit: string;
  packaging_details: string | null;

  is_active: boolean;

  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;

  image_path: string;
  alt_text: string | null;

  sort_order: number;
}

export interface ProductVariant {
  id: string;
  store_id: string;
  product_id: string;

  name: string;
  sku: string | null;

  attributes: Record<string, JsonValue>;

  wholesale_price: number;
  moq: number;
  quantity_step: number;

  pack_size: string | null;
  units_per_pack: number | null;

  stock_quantity: number | null;
  availability: StockAvailability;

  is_active: boolean;

  created_at: string;
  updated_at: string;
}

export interface ProductWithDetails extends Product {
  images: ProductImage[];
  variants: ProductVariant[];

  category: ProductCategory | null;
  brand: Brand | null;
}