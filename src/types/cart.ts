import type {
  Product,
  ProductVariant,
} from "./catalog";

export interface Cart {
  id: string;

  business_id: string;
  store_id: string;
  dealer_id: string;

  created_by: string;

  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;

  cart_id: string;
  store_id: string;
  variant_id: string;

  quantity: number;
}

export interface CartItemDetails extends CartItem {
  product: Product;
  variant: ProductVariant;

  image_path: string | null;
}

export interface CartDetails {
  cart: Cart;
  items: CartItemDetails[];
}

export interface AddCartItemInput {
  cartId: string;
  storeId: string;
  variantId: string;
  quantity: number;
}

export interface SubmitOrderInput {
  cartId: string;

  idempotencyKey: string;
}