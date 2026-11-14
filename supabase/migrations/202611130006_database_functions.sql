begin;

-- New authenticated users receive a profile.
-- No role is taken from editable user metadata.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Include users created before this migration.
insert into public.profiles (id, full_name)
select
  id,
  coalesce(raw_user_meta_data ->> 'full_name', '')
from auth.users
on conflict (id) do nothing;

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles',
    'businesses',
    'stores',
    'products',
    'product_variants',
    'dealer_profiles',
    'dealer_store_access',
    'carts',
    'orders',
    'subscription_plans',
    'business_subscriptions'
  ]
  loop
    execute format(
      'create trigger set_updated_at
       before update on public.%I
       for each row execute function public.set_updated_at()',
      table_name
    );
  end loop;
end;
$$;

create function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.platform_admins a
    where a.user_id = auth.uid()
  );
$$;

create function public.can_manage_business(
  target_business_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.business_memberships m
    join public.businesses b
      on b.id = m.business_id
    where m.business_id = target_business_id
      and m.user_id = auth.uid()
      and m.role = 'business_admin'
      and m.status = 'active'
      and b.status = 'active'
  );
$$;

create function public.can_view_business(
  target_business_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_platform_admin()
    or exists (
      select 1
      from public.business_memberships m
      join public.businesses b
        on b.id = m.business_id
      where m.business_id = target_business_id
        and m.user_id = auth.uid()
        and m.status = 'active'
        and b.status = 'active'
    )
    or exists (
      select 1
      from public.dealer_store_access a
      join public.stores s on s.id = a.store_id
      join public.businesses b on b.id = a.business_id
      where a.business_id = target_business_id
        and a.dealer_id = auth.uid()
        and a.status = 'active'
        and s.is_published
        and b.status = 'active'
    );
$$;

create function public.can_manage_store(
  target_store_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.stores s
    where s.id = target_store_id
      and public.can_manage_business(s.business_id)
  );
$$;

create function public.can_access_store(
  target_store_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.can_manage_store(target_store_id)
    or exists (
      select 1
      from public.stores s
      join public.businesses b on b.id = s.business_id
      where s.id = target_store_id
        and s.is_published
        and b.status = 'active'
        and (
          exists (
            select 1
            from public.dealer_store_access a
            where a.store_id = s.id
              and a.dealer_id = auth.uid()
              and a.status = 'active'
          )
          or exists (
            select 1
            from public.business_memberships m
            where m.business_id = s.business_id
              and m.user_id = auth.uid()
              and m.role = 'salesperson'
              and m.status = 'active'
          )
        )
    );
$$;

create function public.can_view_product(
  target_product_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.products p
    where p.id = target_product_id
      and (
        public.can_manage_store(p.store_id)
        or (
          p.is_active
          and public.can_access_store(p.store_id)
        )
      )
  );
$$;

create function public.can_manage_product(
  target_product_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.products p
    where p.id = target_product_id
      and public.can_manage_store(p.store_id)
  );
$$;

create function public.can_create_for_dealer(
  target_store_id uuid,
  target_dealer_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.dealer_store_access a
    join public.stores s on s.id = a.store_id
    join public.businesses b on b.id = a.business_id
    where a.store_id = target_store_id
      and a.dealer_id = target_dealer_id
      and a.status = 'active'
      and s.is_published
      and b.status = 'active'
      and (
        target_dealer_id = auth.uid()
        or exists (
          select 1
          from public.salesperson_dealer_assignments d
          join public.business_memberships m
            on m.business_id = d.business_id
            and m.user_id = d.salesperson_id
          where d.business_id = a.business_id
            and d.dealer_id = target_dealer_id
            and d.salesperson_id = auth.uid()
            and d.is_active
            and m.role = 'salesperson'
            and m.status = 'active'
        )
      )
  );
$$;

create function public.can_view_dealer(
  target_dealer_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select target_dealer_id = auth.uid()
    or exists (
      select 1
      from public.dealer_store_access a
      where a.dealer_id = target_dealer_id
        and (
          public.can_manage_business(a.business_id)
          or public.can_create_for_dealer(
            a.store_id,
            a.dealer_id
          )
        )
    );
$$;

create function public.can_view_order(
  target_order_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.orders o
    where o.id = target_order_id
      and (
        public.can_manage_business(o.business_id)
        or public.can_create_for_dealer(
          o.store_id,
          o.dealer_id
        )
      )
  );
$$;

create function public.can_manage_order(
  target_order_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.orders o
    where o.id = target_order_id
      and public.can_manage_business(o.business_id)
  );
$$;

create function public.can_manage_cart(
  target_cart_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.carts c
    where c.id = target_cart_id
      and c.created_by = auth.uid()
      and public.can_create_for_dealer(
        c.store_id,
        c.dealer_id
      )
  );
$$;

-- Permission helpers are callable only by authenticated
-- users and trusted backend operations.
do $$
declare
  signature text;
begin
  foreach signature in array array[
    'is_platform_admin()',
    'can_manage_business(uuid)',
    'can_view_business(uuid)',
    'can_manage_store(uuid)',
    'can_access_store(uuid)',
    'can_view_product(uuid)',
    'can_manage_product(uuid)',
    'can_create_for_dealer(uuid,uuid)',
    'can_view_dealer(uuid)',
    'can_view_order(uuid)',
    'can_manage_order(uuid)',
    'can_manage_cart(uuid)'
  ]
  loop
    execute
      'revoke all on function public.'
      || signature
      || ' from public, anon';

    execute
      'grant execute on function public.'
      || signature
      || ' to authenticated, service_role';
  end loop;
end;
$$;

commit;