begin;

-- Start with explicit grants. RLS additionally controls rows.
revoke all on table
  public.profiles,
  public.platform_admins,
  public.business_categories,
  public.businesses,
  public.business_memberships,
  public.stores,
  public.store_banners,
  public.product_categories,
  public.brands,
  public.store_categories,
  public.store_brands,
  public.products,
  public.product_images,
  public.product_variants,
  public.dealer_profiles,
  public.dealer_store_access,
  public.salesperson_dealer_assignments,
  public.invitations,
  public.carts,
  public.cart_items,
  public.orders,
  public.order_items,
  public.order_status_history,
  public.order_documents,
  public.subscription_plans,
  public.business_subscriptions
from anon, authenticated;

grant select on table
  public.profiles,
  public.platform_admins,
  public.business_categories,
  public.businesses,
  public.business_memberships,
  public.stores,
  public.store_banners,
  public.product_categories,
  public.brands,
  public.store_categories,
  public.store_brands,
  public.products,
  public.product_images,
  public.product_variants,
  public.dealer_profiles,
  public.dealer_store_access,
  public.salesperson_dealer_assignments,
  public.invitations,
  public.carts,
  public.cart_items,
  public.orders,
  public.order_items,
  public.order_status_history,
  public.order_documents,
  public.subscription_plans,
  public.business_subscriptions
to authenticated;

grant update (full_name, phone, avatar_path)
on public.profiles to authenticated;

grant update (
  company_name,
  logo_path,
  contact_email,
  contact_phone,
  address,
  gstin,
  category_id
)
on public.businesses to authenticated;

grant update (
  company_name,
  contact_phone,
  address,
  gstin
)
on public.dealer_profiles to authenticated;

grant insert, update, delete on table
  public.stores,
  public.store_banners,
  public.store_categories,
  public.store_brands,
  public.products,
  public.product_images,
  public.product_variants,
  public.carts,
  public.cart_items
to authenticated;

grant insert, update, delete on table
  public.business_categories,
  public.product_categories,
  public.brands,
  public.subscription_plans,
  public.business_subscriptions
to authenticated;

create policy profiles_read
on public.profiles for select to authenticated
using (
  id = auth.uid()
  or public.is_platform_admin()
  or public.can_view_dealer(id)
  or exists (
    select 1
    from public.business_memberships m
    where m.user_id = profiles.id
      and public.can_manage_business(m.business_id)
  )
);

create policy profiles_update
on public.profiles for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy platform_admin_self
on public.platform_admins for select to authenticated
using (user_id = auth.uid());

create policy businesses_read
on public.businesses for select to authenticated
using (public.can_view_business(id));

create policy businesses_update
on public.businesses for update to authenticated
using (public.can_manage_business(id))
with check (public.can_manage_business(id));

create policy memberships_read
on public.business_memberships for select to authenticated
using (
  user_id = auth.uid()
  or public.can_manage_business(business_id)
  or public.is_platform_admin()
);

create policy stores_read
on public.stores for select to authenticated
using (public.can_access_store(id));

create policy stores_insert
on public.stores for insert to authenticated
with check (public.can_manage_business(business_id));

create policy stores_update
on public.stores for update to authenticated
using (public.can_manage_business(business_id))
with check (public.can_manage_business(business_id));

-- No store DELETE policy. Deletion is not an MVP action.

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'store_banners',
    'store_categories',
    'store_brands'
  ]
  loop
    execute format(
      'create policy store_resource_read
       on public.%I for select to authenticated
       using (public.can_access_store(store_id))',
      table_name
    );

    execute format(
      'create policy store_resource_manage
       on public.%I for all to authenticated
       using (public.can_manage_store(store_id))
       with check (public.can_manage_store(store_id))',
      table_name
    );
  end loop;
end;
$$;

create policy products_read
on public.products for select to authenticated
using (
  public.can_manage_store(store_id)
  or (
    is_active
    and public.can_access_store(store_id)
  )
);

create policy products_insert
on public.products for insert to authenticated
with check (public.can_manage_store(store_id));

create policy products_update
on public.products for update to authenticated
using (public.can_manage_store(store_id))
with check (public.can_manage_store(store_id));

-- Products are deactivated, not deleted.

create policy product_images_read
on public.product_images for select to authenticated
using (public.can_view_product(product_id));

create policy product_images_manage
on public.product_images for all to authenticated
using (public.can_manage_product(product_id))
with check (public.can_manage_product(product_id));

create policy variants_read
on public.product_variants for select to authenticated
using (
  public.can_manage_store(store_id)
  or (
    is_active
    and public.can_view_product(product_id)
  )
);

create policy variants_insert
on public.product_variants for insert to authenticated
with check (public.can_manage_store(store_id));

create policy variants_update
on public.product_variants for update to authenticated
using (public.can_manage_store(store_id))
with check (public.can_manage_store(store_id));

-- Variants referenced by orders must remain available historically.

create policy dealers_read
on public.dealer_profiles for select to authenticated
using (
  public.can_view_dealer(user_id)
  or public.is_platform_admin()
);

create policy dealers_self_update
on public.dealer_profiles for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy dealer_access_read
on public.dealer_store_access for select to authenticated
using (
  dealer_id = auth.uid()
  or public.can_manage_business(business_id)
  or public.can_create_for_dealer(store_id, dealer_id)
);

create policy assignments_read
on public.salesperson_dealer_assignments
for select to authenticated
using (
  public.can_manage_business(business_id)
  or (
    salesperson_id = auth.uid()
    and is_active
    and exists (
      select 1
      from public.business_memberships m
      join public.businesses b
        on b.id = m.business_id
      where m.business_id =
        salesperson_dealer_assignments.business_id
        and m.user_id = auth.uid()
        and m.role = 'salesperson'
        and m.status = 'active'
        and b.status = 'active'
    )
  )
);

create policy invitations_read
on public.invitations for select to authenticated
using (public.can_manage_business(business_id));

create policy carts_read
on public.carts for select to authenticated
using (
  created_by = auth.uid()
  and public.can_create_for_dealer(store_id, dealer_id)
);

create policy carts_insert
on public.carts for insert to authenticated
with check (
  created_by = auth.uid()
  and public.can_create_for_dealer(store_id, dealer_id)
);

create policy carts_update
on public.carts for update to authenticated
using (
  created_by = auth.uid()
  and public.can_create_for_dealer(store_id, dealer_id)
)
with check (
  created_by = auth.uid()
  and public.can_create_for_dealer(store_id, dealer_id)
);

create policy carts_delete
on public.carts for delete to authenticated
using (
  created_by = auth.uid()
  and public.can_create_for_dealer(store_id, dealer_id)
);

create policy cart_items_manage
on public.cart_items for all to authenticated
using (public.can_manage_cart(cart_id))
with check (
  public.can_manage_cart(cart_id)
  and exists (
    select 1
    from public.product_variants v
    where v.id = cart_items.variant_id
      and v.store_id = cart_items.store_id
      and v.is_active
      and public.can_view_product(v.product_id)
  )
);

create policy orders_read
on public.orders for select to authenticated
using (public.can_view_order(id));

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'order_items',
    'order_status_history',
    'order_documents'
  ]
  loop
    execute format(
      'create policy order_resource_read
       on public.%I for select to authenticated
       using (public.can_view_order(order_id))',
      table_name
    );
  end loop;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'business_categories',
    'product_categories',
    'brands'
  ]
  loop
    execute format(
      'create policy taxonomy_read
       on public.%I for select to authenticated
       using (is_active or public.is_platform_admin())',
      table_name
    );

    execute format(
      'create policy taxonomy_admin
       on public.%I for all to authenticated
       using (public.is_platform_admin())
       with check (public.is_platform_admin())',
      table_name
    );
  end loop;
end;
$$;

create policy subscription_plans_read
on public.subscription_plans for select to authenticated
using (
  public.is_platform_admin()
  or exists (
    select 1
    from public.business_subscriptions s
    where s.plan_id = subscription_plans.id
      and public.can_manage_business(s.business_id)
  )
);

create policy subscription_plans_admin
on public.subscription_plans for all to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

create policy subscriptions_read
on public.business_subscriptions for select to authenticated
using (
  public.is_platform_admin()
  or public.can_manage_business(business_id)
);

create policy subscriptions_admin
on public.business_subscriptions for all to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

commit;