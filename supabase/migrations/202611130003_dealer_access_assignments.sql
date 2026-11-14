begin;

create table public.dealer_profiles (
  user_id uuid primary key
    references public.profiles(id) on delete cascade,

  company_name text not null,
  contact_phone text,
  address text,
  gstin text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint dealer_company_name_valid
    check (length(trim(company_name)) > 0)
);

create table public.dealer_store_access (
  id uuid primary key default gen_random_uuid(),

  business_id uuid not null,
  store_id uuid not null,

  dealer_id uuid not null
    references public.dealer_profiles(user_id),

  status text not null default 'pending'
    check (
      status in (
        'pending',
        'active',
        'rejected',
        'inactive'
      )
    ),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  foreign key (business_id, store_id)
    references public.stores(business_id, id)
    on delete cascade,

  unique (store_id, dealer_id),

  unique (business_id, store_id, dealer_id)
);

create table public.salesperson_dealer_assignments (
  id uuid primary key default gen_random_uuid(),

  business_id uuid not null,

  salesperson_id uuid not null,

  dealer_id uuid not null
    references public.dealer_profiles(user_id),

  is_active boolean not null default true,

  created_at timestamptz not null default now(),

  foreign key (business_id, salesperson_id)
    references public.business_memberships(
      business_id,
      user_id
    )
    on delete cascade,

  unique (
    business_id,
    salesperson_id,
    dealer_id
  )
);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),

  business_id uuid not null
    references public.businesses(id) on delete cascade,

  store_id uuid,

  email text not null,

  target_role text not null
    check (target_role in ('dealer', 'salesperson')),

  invited_user_id uuid
    references public.profiles(id),

  invited_by uuid not null
    references public.profiles(id),

  status text not null default 'pending'
    check (
      status in (
        'pending',
        'accepted',
        'revoked',
        'expired'
      )
    ),

  expires_at timestamptz not null,

  created_at timestamptz not null default now(),

  foreign key (business_id, store_id)
    references public.stores(business_id, id),

  constraint invitation_role_store_valid
    check (
      (
        target_role = 'dealer'
        and store_id is not null
      )
      or
      (
        target_role = 'salesperson'
        and store_id is null
      )
    )
);

alter table public.dealer_profiles enable row level security;
alter table public.dealer_store_access enable row level security;
alter table public.salesperson_dealer_assignments enable row level security;
alter table public.invitations enable row level security;

commit;