begin;

create table public.profiles (
  id uuid primary key
    references auth.users(id) on delete cascade,

  full_name text not null default '',
  phone text,
  avatar_path text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.platform_admins (
  user_id uuid primary key
    references public.profiles(id) on delete cascade,

  created_at timestamptz not null default now()
);

create table public.business_categories (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  slug text not null unique,
  is_active boolean not null default true,

  created_at timestamptz not null default now(),

  constraint business_category_name_valid
    check (length(trim(name)) > 0)
);

create table public.businesses (
  id uuid primary key default gen_random_uuid(),

  owner_id uuid not null
    references public.profiles(id),

  business_type text not null
    check (
      business_type in ('manufacturer', 'distributor')
    ),

  category_id uuid
    references public.business_categories(id),

  company_name text not null,
  logo_path text,

  contact_email text not null,
  contact_phone text,
  address text,
  gstin text,

  status text not null default 'active'
    check (status in ('active', 'suspended')),

  verification_status text not null default 'unverified'
    check (
      verification_status in (
        'unverified',
        'verified'
      )
    ),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint business_name_valid
    check (length(trim(company_name)) > 0)
);

create table public.business_memberships (
  id uuid primary key default gen_random_uuid(),

  business_id uuid not null
    references public.businesses(id) on delete cascade,

  user_id uuid not null
    references public.profiles(id) on delete cascade,

  role text not null
    check (role in ('business_admin', 'salesperson')),

  status text not null default 'active'
    check (status in ('active', 'inactive')),

  created_at timestamptz not null default now(),

  unique (business_id, user_id),

  unique (business_id, id)
);

alter table public.profiles enable row level security;
alter table public.platform_admins enable row level security;
alter table public.business_categories enable row level security;
alter table public.businesses enable row level security;
alter table public.business_memberships enable row level security;

commit;