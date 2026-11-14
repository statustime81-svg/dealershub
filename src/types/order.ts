export type OrderStatus =
  | "pending"
  | "confirmed"
  | "rejected"
  | "processing"
  | "dispatched"
  | "delivered"
  | "cancelled";

export interface Order {
  id: string;
  order_number: number;

  business_id: string;
  store_id: string;
  dealer_id: string;

  created_by: string;
  salesperson_id: string | null;

  idempotency_key: string;

  status: OrderStatus;

  subtotal: number;
  discount_total: number;
  tax_total: number;
  delivery_total: number;
  grand_total: number;

  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;

  order_id: string;
  store_id: string;
  variant_id: string;

  product_name: string;
  variant_name: string;
  sku: string | null;

  unit: string;
  pack_size: string | null;

  unit_price: number;
  quantity: number;

  moq_snapshot: number;
  quantity_step_snapshot: number;

  line_total: number;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;

  previous_status: OrderStatus | null;
  new_status: OrderStatus;

  changed_by: string;
  note: string | null;

  created_at: string;
}

export interface OrderDocument {
  id: string;
  order_id: string;

  document_type: "invoice";

  file_path: string;
  file_name: string;

  uploaded_by: string;
  created_at: string;
}

export interface OrderDetails {
  order: Order;
  items: OrderItem[];
  history: OrderStatusHistory[];
  documents: OrderDocument[];
}