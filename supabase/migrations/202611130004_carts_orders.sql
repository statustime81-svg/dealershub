begin;

create table public.carts (
  id uuid primary key default gen_random_uuid(),

  business_id uuid not null,
  store_id uuid not null,

  dealer_id uuid not null,

  created_by uuid not null
    references public.profiles(id),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  foreign key (
    business_id,
    store_id,
    dealer_id
  )
    references public.dealer_store_access(
      business_id,
      store_id,
      dealer_id
    ),

  unique (store_id, dealer_id, created_by),

  unique (id, store_id)
);

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),

  cart_id uuid not null,
  store_id uuid not null,
  variant_id uuid not null,

  quantity integer not null
    check (quantity > 0),

  foreign key (cart_id, store_id)
    references public.carts(id, store_id)
    on delete cascade,

  foreign key (store_id, variant_id)
    references public.product_variants(store_id, id),

  unique (cart_id, variant_id)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),

  order_number bigint generated always as identity unique,

  business_id uuid not null,
  store_id uuid not null,
  dealer_id uuid not null,

  created_by uuid not null
    references public.profiles(id),

  salesperson_id uuid,

  idempotency_key uuid not null,

  status text not null default 'pending'
    check (
      status in (
        'pending',
        'confirmed',
        'rejected',
        'processing',
        'dispatched',
        'delivered',
        'cancelled'
      )
    ),

  subtotal numeric(14, 2) not null
    check (subtotal >= 0),

  discount_total numeric(14, 2) not null default 0
    check (discount_total >= 0),

  tax_total numeric(14, 2) not null default 0
    check (tax_total >= 0),

  delivery_total numeric(14, 2) not null default 0
    check (delivery_total >= 0),

  grand_total numeric(14, 2) not null
    check (grand_total >= 0),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  foreign key (
    business_id,
    store_id,
    dealer_id
  )
    references public.dealer_store_access(
      business_id,
      store_id,
      dealer_id
    ),

  foreign key (business_id, salesperson_id)
    references public.business_memberships(
      business_id,
      user_id
    ),

  unique (created_by, idempotency_key),

  unique (id, store_id),

  constraint order_totals_valid
    check (
      grand_total =
        subtotal
        - discount_total
        + tax_total
        + delivery_total
    ),

  constraint order_discount_valid
    check (discount_total <= subtotal),

  constraint order_creator_valid
    check (
      (
        salesperson_id is null
        and created_by = dealer_id
      )
      or
      (
        salesperson_id is not null
        and created_by = salesperson_id
      )
    )
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),

  order_id uuid not null,
  store_id uuid not null,
  variant_id uuid not null,

  product_name text not null,
  variant_name text not null,
  sku text,
  unit text not null,
  pack_size text,

  unit_price numeric(14, 2) not null
    check (unit_price >= 0),

  quantity integer not null
    check (quantity > 0),

  moq_snapshot integer not null
    check (moq_snapshot > 0),

  quantity_step_snapshot integer not null
    check (quantity_step_snapshot > 0),

  line_total numeric(14, 2) not null
    check (line_total >= 0),

  foreign key (order_id, store_id)
    references public.orders(id, store_id),

  foreign key (store_id, variant_id)
    references public.product_variants(store_id, id),

  constraint order_item_total_valid
    check (line_total = unit_price * quantity),

  constraint order_item_quantity_valid
    check (
      quantity >= moq_snapshot
      and
      (quantity - moq_snapshot)
        % quantity_step_snapshot = 0
    )
);

create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),

  order_id uuid not null
    references public.orders(id),

  previous_status text
    check (
      previous_status in (
        'pending',
        'confirmed',
        'rejected',
        'processing',
        'dispatched',
        'delivered',
        'cancelled'
      )
    ),

  new_status text not null
    check (
      new_status in (
        'pending',
        'confirmed',
        'rejected',
        'processing',
        'dispatched',
        'delivered',
        'cancelled'
      )
    ),

  changed_by uuid not null
    references public.profiles(id),

  note text,
  created_at timestamptz not null default now()
);

create table public.order_documents (
  id uuid primary key default gen_random_uuid(),

  order_id uuid not null
    references public.orders(id),

  document_type text not null
    check (document_type = 'invoice'),

  file_path text not null,
  file_name text not null,

  uploaded_by uuid not null
    references public.profiles(id),

  created_at timestamptz not null default now()
);

alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;
alter table public.order_documents enable row level security;

commit;