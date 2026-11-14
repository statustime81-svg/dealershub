begin;

create table public.subscription_plans (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  slug text not null unique,
  description text,

  price_amount numeric(14, 2)
    check (price_amount >= 0),

  currency text not null default 'INR',

  billing_interval text
    check (
      billing_interval in (
        'month',
        'year',
        'custom'
      )
    ),

  max_products integer
    check (max_products >= 0),

  max_dealers integer
    check (max_dealers >= 0),

  max_salespeople integer
    check (max_salespeople >= 0),

  max_stores integer
    check (max_stores >= 0),

  max_storage_bytes bigint
    check (max_storage_bytes >= 0),

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint plan_name_valid
    check (length(trim(name)) > 0)
);

create table public.business_subscriptions (
  id uuid primary key default gen_random_uuid(),

  business_id uuid not null unique
    references public.businesses(id),

  plan_id uuid not null
    references public.subscription_plans(id),

  status text not null
    check (
      status in (
        'trialing',
        'active',
        'expired',
        'cancelled'
      )
    ),

  starts_at timestamptz not null,
  ends_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint subscription_dates_valid
    check (
      ends_at is null
      or ends_at > starts_at
    )
);

alter table public.subscription_plans enable row level security;
alter table public.business_subscriptions enable row level security;

commit;