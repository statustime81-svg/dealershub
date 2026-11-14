begin;

create table public.stores (
  id uuid primary key default gen_random_uuid(),

  business_id uuid not null
    references public.businesses(id) on delete cascade,

  name text not null,
  slug text not null unique,
  description text,

  is_published boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (business_id, id),

  constraint store_name_valid
    check (length(trim(name)) > 0)
);

create table public.store_banners (
  id uuid primary key default gen_random_uuid(),

  store_id uuid not null
    references public.stores(id) on delete cascade,

  image_path text not null,
  heading text,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true
);

create table public.product_categories (
  id uuid primary key default gen_random_uuid(),

  parent_id uuid
    references public.product_categories(id),

  name text not null,
  slug text not null unique,
  image_path text,
  description text,
  is_active boolean not null default true,

  constraint category_name_valid
    check (length(trim(name)) > 0),

  constraint category_not_own_parent
    check (parent_id is distinct from id)
);

create table public.brands (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  slug text not null unique,
  is_active boolean not null default true,

  constraint brand_name_valid
    check (length(trim(name)) > 0)
);

create table public.store_categories (
  store_id uuid not null
    references public.stores(id) on delete cascade,

  category_id uuid not null
    references public.product_categories(id),

  primary key (store_id, category_id)
);

create table public.store_brands (
  store_id uuid not null
    references public.stores(id) on delete cascade,

  brand_id uuid not null
    references public.brands(id),

  primary key (store_id, brand_id)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),

  store_id uuid not null
    references public.stores(id) on delete cascade,

  category_id uuid not null,
  brand_id uuid,

  name text not null,
  description text,
  unit text not null,
  packaging_details text,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (store_id, id),

  foreign key (store_id, category_id)
    references public.store_categories(
      store_id,
      category_id
    ),

  foreign key (store_id, brand_id)
    references public.store_brands(
      store_id,
      brand_id
    ),

  constraint product_name_valid
    check (length(trim(name)) > 0),

  constraint product_unit_valid
    check (length(trim(unit)) > 0)
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),

  product_id uuid not null
    references public.products(id) on delete cascade,

  image_path text not null,
  alt_text text,
  sort_order integer not null default 0
);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),

  store_id uuid not null,
  product_id uuid not null,

  name text not null default 'Default',
  sku text,
  attributes jsonb not null default '{}'::jsonb,

  wholesale_price numeric(14, 2) not null
    check (wholesale_price >= 0),

  moq integer not null
    check (moq > 0),

  quantity_step integer not null default 1
    check (quantity_step > 0),

  pack_size text,
  units_per_pack integer
    check (units_per_pack > 0),

  stock_quantity integer
    check (stock_quantity >= 0),

  availability text not null default 'in_stock'
    check (
      availability in (
        'in_stock',
        'low_stock',
        'out_of_stock',
        'enquire'
      )
    ),

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  foreign key (store_id, product_id)
    references public.products(store_id, id)
    on delete cascade,

  unique (store_id, sku),

  unique (store_id, id),

  constraint variant_attributes_object
    check (jsonb_typeof(attributes) = 'object')
);

alter table public.stores enable row level security;
alter table public.store_banners enable row level security;
alter table public.product_categories enable row level security;
alter table public.brands enable row level security;
alter table public.store_categories enable row level security;
alter table public.store_brands enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;

commit;