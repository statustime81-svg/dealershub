begin;

create index memberships_user_status_idx
on public.business_memberships (
  user_id,
  status
);

create index businesses_owner_idx
on public.businesses (owner_id);

create index businesses_category_idx
on public.businesses (category_id);

create index stores_business_idx
on public.stores (business_id);

create index banners_store_sort_idx
on public.store_banners (
  store_id,
  sort_order
);

create index categories_parent_idx
on public.product_categories (parent_id);

create index products_store_active_idx
on public.products (
  store_id,
  is_active
);

create index products_store_category_idx
on public.products (
  store_id,
  category_id
);

create index products_brand_idx
on public.products (brand_id);

create index images_product_sort_idx
on public.product_images (
  product_id,
  sort_order
);

create index variants_product_idx
on public.product_variants (product_id);

create index dealer_access_dealer_status_idx
on public.dealer_store_access (
  dealer_id,
  status
);

create index dealer_access_business_status_idx
on public.dealer_store_access (
  business_id,
  status
);

create index assignments_salesperson_active_idx
on public.salesperson_dealer_assignments (
  salesperson_id,
  is_active
);

create index assignments_dealer_idx
on public.salesperson_dealer_assignments (dealer_id);

create index invitations_business_status_idx
on public.invitations (
  business_id,
  status
);

create index carts_creator_idx
on public.carts (created_by);

create index cart_items_variant_idx
on public.cart_items (variant_id);

create index orders_business_created_idx
on public.orders (
  business_id,
  created_at desc
);

create index orders_dealer_created_idx
on public.orders (
  dealer_id,
  created_at desc
);

create index orders_salesperson_created_idx
on public.orders (
  salesperson_id,
  created_at desc
)
where salesperson_id is not null;

create index orders_store_status_idx
on public.orders (
  store_id,
  status
);

create index order_items_order_idx
on public.order_items (order_id);

create index order_items_variant_idx
on public.order_items (variant_id);

create index order_history_order_created_idx
on public.order_status_history (
  order_id,
  created_at
);

create index order_documents_order_idx
on public.order_documents (order_id);

create index subscriptions_plan_idx
on public.business_subscriptions (plan_id);

alter table public.stores
add constraint store_slug_valid
check (
  slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
);

alter table public.product_categories
add constraint product_category_slug_valid
check (
  slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
);

alter table public.brands
add constraint brand_slug_valid
check (
  slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
);

alter table public.business_categories
add constraint business_category_slug_valid
check (
  slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
);

alter table public.subscription_plans
add constraint plan_slug_valid
check (
  slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
);

alter table public.invitations
add constraint invitation_email_valid
check (
  email = lower(trim(email))
  and length(email) > 3
);

commit;