begin;

create function public.save_catalog_product(
  p_actor_id uuid,
  p_business_id uuid,
  p_store_id uuid,
  p_product_id uuid,
  p_create boolean,
  p_product jsonb,
  p_variants jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_variant jsonb;
  v_variant_id uuid;
  v_variant_ids uuid[] := array[]::uuid[];
  v_category_id uuid;
  v_brand_id uuid;
begin
  perform 1
  from public.businesses
  where id = p_business_id
    and status = 'active'
  for update;

  if not found then
    raise exception 'Business is unavailable';
  end if;

  if not exists (
    select 1
    from public.business_memberships
    where business_id = p_business_id
      and user_id = p_actor_id
      and role = 'business_admin'
      and status = 'active'
  ) then
    raise exception 'Business administrator access is required';
  end if;

  if not exists (
    select 1
    from public.stores
    where id = p_store_id
      and business_id = p_business_id
  ) then
    raise exception 'Store is unavailable';
  end if;

  if jsonb_typeof(p_product) is distinct from 'object'
    or jsonb_typeof(p_variants) is distinct from 'array'
  then
    raise exception 'Invalid product payload';
  end if;

  if jsonb_array_length(p_variants) = 0 then
    raise exception 'At least one variant is required';
  end if;

  v_category_id := (p_product ->> 'categoryId')::uuid;
  v_brand_id := nullif(p_product ->> 'brandId', '')::uuid;

  if not exists (
    select 1
    from public.product_categories
    where id = v_category_id
      and is_active
  ) then
    raise exception 'Category is unavailable';
  end if;

  if v_brand_id is not null
    and not exists (
      select 1
      from public.brands
      where id = v_brand_id
        and is_active
    )
  then
    raise exception 'Brand is unavailable';
  end if;

  -- Selecting canonical taxonomy enables it for this store.
  insert into public.store_categories (
    store_id,
    category_id
  )
  values (p_store_id, v_category_id)
  on conflict do nothing;

  if v_brand_id is not null then
    insert into public.store_brands (
      store_id,
      brand_id
    )
    values (p_store_id, v_brand_id)
    on conflict do nothing;
  end if;

  if p_create then
    insert into public.products (
      id,
      store_id,
      category_id,
      brand_id,
      name,
      description,
      unit,
      packaging_details,
      is_active
    )
    values (
      p_product_id,
      p_store_id,
      v_category_id,
      v_brand_id,
      trim(p_product ->> 'name'),
      nullif(trim(p_product ->> 'description'), ''),
      trim(p_product ->> 'unit'),
      nullif(trim(p_product ->> 'packagingDetails'), ''),
      (p_product ->> 'isActive')::boolean
    );
  else
    perform 1
    from public.products
    where id = p_product_id
      and store_id = p_store_id
    for update;

    if not found then
      raise exception 'Product not found';
    end if;

    update public.products
    set
      category_id = v_category_id,
      brand_id = v_brand_id,
      name = trim(p_product ->> 'name'),
      description =
        nullif(trim(p_product ->> 'description'), ''),
      unit = trim(p_product ->> 'unit'),
      packaging_details =
        nullif(trim(p_product ->> 'packagingDetails'), ''),
      is_active = (p_product ->> 'isActive')::boolean
    where id = p_product_id
      and store_id = p_store_id;
  end if;

  for v_variant in
    select value
    from jsonb_array_elements(p_variants)
  loop
    v_variant_id := (v_variant ->> 'id')::uuid;

    if v_variant_id = any(v_variant_ids) then
      raise exception 'Duplicate variant ID';
    end if;

    v_variant_ids :=
      array_append(v_variant_ids, v_variant_id);

    if exists (
      select 1
      from public.product_variants
      where id = v_variant_id
        and (
          product_id <> p_product_id
          or store_id <> p_store_id
        )
    ) then
      raise exception 'Variant belongs to another product';
    end if;

    insert into public.product_variants (
      id,
      store_id,
      product_id,
      name,
      sku,
      wholesale_price,
      moq,
      quantity_step,
      pack_size,
      units_per_pack,
      stock_quantity,
      availability,
      is_active
    )
    values (
      v_variant_id,
      p_store_id,
      p_product_id,
      trim(v_variant ->> 'name'),
      nullif(trim(v_variant ->> 'sku'), ''),
      (v_variant ->> 'wholesalePrice')::numeric,
      (v_variant ->> 'moq')::integer,
      (v_variant ->> 'quantityStep')::integer,
      nullif(trim(v_variant ->> 'packSize'), ''),
      (v_variant ->> 'unitsPerPack')::integer,
      (v_variant ->> 'stockQuantity')::integer,
      v_variant ->> 'availability',
      (v_variant ->> 'isActive')::boolean
    )
    on conflict (id)
    do update set
      name = excluded.name,
      sku = excluded.sku,
      wholesale_price = excluded.wholesale_price,
      moq = excluded.moq,
      quantity_step = excluded.quantity_step,
      pack_size = excluded.pack_size,
      units_per_pack = excluded.units_per_pack,
      stock_quantity = excluded.stock_quantity,
      availability = excluded.availability,
      is_active = excluded.is_active;
  end loop;

  -- Preserve omitted variants for historical order references.
  update public.product_variants
  set is_active = false
  where product_id = p_product_id
    and store_id = p_store_id
    and not (id = any(v_variant_ids));

  return p_product_id;
end;
$$;

revoke all on function public.save_catalog_product(
  uuid, uuid, uuid, uuid, boolean, jsonb, jsonb
)
from public, anon, authenticated;

grant execute on function public.save_catalog_product(
  uuid, uuid, uuid, uuid, boolean, jsonb, jsonb
)
to service_role;

commit;