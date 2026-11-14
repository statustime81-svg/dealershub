begin;

create function public.internal_assigned_storefront(p_store_id uuid)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare v_result jsonb;
begin
  select jsonb_build_object(
    'id', s.id, 'name', s.name, 'description', s.description,
    'businessName', b.company_name, 'logoPath', b.logo_path,
    'businessType', b.business_type, 'verified', b.verification_status = 'verified',
    'banners', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', x.id, 'imagePath', x.image_path,
        'heading', x.heading, 'description', x.description
      ) order by x.sort_order, x.id)
      from public.store_banners x where x.store_id = s.id and x.is_active
    ), '[]'::jsonb),
    'categories', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', c.id, 'name', c.name, 'description', c.description
      ) order by c.name, c.id)
      from public.product_categories c
      where c.is_active and exists (
        select 1 from public.store_categories sc
        where sc.store_id = s.id and sc.category_id = c.id
      )
    ), '[]'::jsonb),
    'brands', coalesce((
      select jsonb_agg(jsonb_build_object('id', br.id, 'name', br.name) order by br.name, br.id)
      from public.brands br where br.is_active and exists (
        select 1 from public.store_brands sb
        where sb.store_id = s.id and sb.brand_id = br.id
      )
    ), '[]'::jsonb)
  ) into v_result
  from public.stores s join public.businesses b on b.id = s.business_id
  where s.id = p_store_id;
  return v_result;
end;
$$;

create function public.internal_assigned_products(
  p_store_id uuid,
  p_page integer default 1,
  p_search text default '',
  p_category_id uuid default null,
  p_brand_id uuid default null,
  p_sort text default 'newest'
)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare v_result jsonb;
begin
  if p_page is null or p_page < 1 or p_page > 100000
    or p_sort is null or p_sort not in ('newest', 'price_low', 'price_high')
    or length(coalesce(p_search, '')) > 200 then
    raise exception 'Invalid catalog filters';
  end if;
  with eligible as (
    select p.*, br.name as brand_name, c.name as category_name,
      (select min(v.wholesale_price) from public.product_variants v
       where v.product_id = p.id and v.is_active) as minimum_price
    from public.products p
    left join public.brands br on br.id = p.brand_id
    left join public.product_categories c on c.id = p.category_id
    where p.store_id = p_store_id and p.is_active
      and (p_category_id is null or p.category_id = p_category_id)
      and (p_brand_id is null or p.brand_id = p_brand_id)
      and (coalesce(trim(p_search), '') = '' or
        strpos(lower(p.name), lower(trim(p_search))) > 0)
      and exists (select 1 from public.product_variants v where v.product_id = p.id and v.is_active)
  ), paged as (
    select * from eligible
    order by
      case when p_sort = 'price_low' then minimum_price end asc,
      case when p_sort = 'price_high' then minimum_price end desc,
      created_at desc, id
    limit 12 offset ((p_page - 1)::bigint * 12)
  )
  select jsonb_build_object(
    'total', (select count(*) from eligible), 'pageSize', 12,
    'items', coalesce((select jsonb_agg(jsonb_build_object(
      'id', p.id, 'storeId', p.store_id, 'name', p.name, 'unit', p.unit,
      'brandName', p.brand_name, 'categoryName', p.category_name,
      'imagePath', (select i.image_path from public.product_images i where i.product_id = p.id order by i.sort_order, i.id limit 1),
      'variantCount', (select count(*) from public.product_variants v where v.product_id = p.id and v.is_active),
      'variant', (select jsonb_build_object(
        'id', v.id, 'name', v.name, 'price', v.wholesale_price,
        'moq', v.moq, 'packSize', v.pack_size, 'availability', v.availability
      ) from public.product_variants v where v.product_id = p.id and v.is_active
        order by v.wholesale_price, v.id limit 1)
    ) order by
      case when p_sort = 'price_low' then p.minimum_price end asc,
      case when p_sort = 'price_high' then p.minimum_price end desc,
      p.created_at desc, p.id) from paged p), '[]'::jsonb)
  ) into v_result;
  return v_result;
end;
$$;

create function public.internal_assigned_product(p_store_id uuid, p_product_id uuid)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare v_result jsonb;
begin
  select jsonb_build_object(
    'id', p.id, 'storeId', p.store_id, 'name', p.name,
    'unit', p.unit, 'description', p.description, 'packagingDetails', p.packaging_details,
    'brandName', br.name, 'categoryName', c.name,
    'images', coalesce((select jsonb_agg(jsonb_build_object(
      'imagePath', i.image_path, 'altText', i.alt_text
    ) order by i.sort_order, i.id) from public.product_images i where i.product_id = p.id), '[]'::jsonb),
    'variants', coalesce((select jsonb_agg(jsonb_build_object(
      'id', v.id, 'name', v.name, 'price', v.wholesale_price,
      'moq', v.moq, 'quantityStep', v.quantity_step, 'packSize', v.pack_size,
      'unitsPerPack', v.units_per_pack, 'stockQuantity', v.stock_quantity,
      'availability', v.availability, 'sku', v.sku
    ) order by v.wholesale_price, v.id) from public.product_variants v
      where v.product_id = p.id and v.is_active), '[]'::jsonb)
  ) into v_result
  from public.products p
  left join public.brands br on br.id = p.brand_id
  left join public.product_categories c on c.id = p.category_id
  where p.id = p_product_id and p.store_id = p_store_id and p.is_active;
  if not found then raise exception 'Product unavailable'; end if;
  return v_result;
end;
$$;


create function public.is_active_salesperson(p_business_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.business_memberships m
    join public.businesses b on b.id = m.business_id
    where m.business_id = p_business_id and m.user_id = auth.uid()
      and m.role = 'salesperson' and m.status = 'active' and b.status = 'active'
  );
$$;

create function public.get_salesperson_dealers(
  p_business_id uuid, p_search text default '', p_page integer default 1
)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare v_result jsonb;
begin
  if not public.is_active_salesperson(p_business_id) then
    raise exception using errcode = '42501', message = 'Salesperson membership unavailable';
  end if;
  if p_page is null or p_page < 1 or p_page > 100000
    or length(coalesce(p_search, '')) > 200 then raise exception 'Invalid dealer filters'; end if;
  with eligible as (
    select d.user_id, d.company_name, d.contact_phone, d.address,
      (select count(*) from public.stores s where s.business_id = p_business_id
        and public.actor_can_order(auth.uid(), s.id, d.user_id)) as store_count
    from public.dealer_profiles d
    where exists (
      select 1 from public.salesperson_dealer_assignments a
      where a.business_id = p_business_id and a.salesperson_id = auth.uid()
        and a.dealer_id = d.user_id and a.is_active
    ) and exists (
      select 1 from public.stores s where s.business_id = p_business_id
        and public.actor_can_order(auth.uid(), s.id, d.user_id)
    ) and (coalesce(trim(p_search), '') = '' or
      strpos(lower(d.company_name), lower(trim(p_search))) > 0 or
      strpos(coalesce(d.contact_phone, ''), trim(p_search)) > 0)
  ), paged as (
    select * from eligible order by company_name, user_id
    limit 15 offset ((p_page - 1)::bigint * 15)
  )
  select jsonb_build_object(
    'total', (select count(*) from eligible), 'pageSize', 15,
    'items', coalesce((select jsonb_agg(jsonb_build_object(
      'dealerId', x.user_id, 'companyName', x.company_name,
      'phone', x.contact_phone, 'address', x.address, 'storeCount', x.store_count
    ) order by x.company_name, x.user_id) from paged x), '[]'::jsonb)
  ) into v_result;
  return v_result;
end;
$$;

create function public.get_salesperson_dealer_workspace(p_business_id uuid, p_dealer_id uuid)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare v_result jsonb;
begin
  if not public.is_active_salesperson(p_business_id)
    or not exists (
      select 1 from public.salesperson_dealer_assignments a
      where a.business_id = p_business_id and a.salesperson_id = auth.uid()
        and a.dealer_id = p_dealer_id and a.is_active
    ) or not exists (
      select 1 from public.stores s where s.business_id = p_business_id
        and public.actor_can_order(auth.uid(), s.id, p_dealer_id)
    ) then raise exception using errcode = '42501', message = 'Assigned dealer unavailable'; end if;
  select jsonb_build_object(
    'dealerId', d.user_id, 'companyName', d.company_name,
    'phone', d.contact_phone, 'address', d.address,
    'stores', coalesce((select jsonb_agg(jsonb_build_object(
      'id', s.id, 'name', s.name
    ) order by s.name, s.id) from public.stores s
      where s.business_id = p_business_id
        and public.actor_can_order(auth.uid(), s.id, p_dealer_id)), '[]'::jsonb)
  ) into v_result from public.dealer_profiles d where d.user_id = p_dealer_id;
  return v_result;
end;
$$;

create function public.require_salesperson_store(
  p_business_id uuid, p_dealer_id uuid, p_store_id uuid
)
returns void language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.is_active_salesperson(p_business_id)
    or not exists (select 1 from public.stores s where s.id = p_store_id and s.business_id = p_business_id)
    or not exists (
      select 1 from public.salesperson_dealer_assignments a
      where a.business_id = p_business_id and a.salesperson_id = auth.uid()
        and a.dealer_id = p_dealer_id and a.is_active
    ) or not public.actor_can_order(auth.uid(), p_store_id, p_dealer_id)
  then raise exception using errcode = '42501', message = 'Assigned store access unavailable'; end if;
end;
$$;

create function public.get_salesperson_storefront(p_business_id uuid, p_dealer_id uuid, p_store_id uuid)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$ begin
  perform public.require_salesperson_store(p_business_id, p_dealer_id, p_store_id);
  return public.internal_assigned_storefront(p_store_id);
end; $$;

create function public.get_salesperson_products(
  p_business_id uuid, p_dealer_id uuid, p_store_id uuid,
  p_page integer default 1, p_search text default '',
  p_category_id uuid default null, p_brand_id uuid default null, p_sort text default 'newest'
)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$ begin
  perform public.require_salesperson_store(p_business_id, p_dealer_id, p_store_id);
  return public.internal_assigned_products(p_store_id,p_page,p_search,p_category_id,p_brand_id,p_sort);
end; $$;

create function public.get_salesperson_product(
  p_business_id uuid, p_dealer_id uuid, p_store_id uuid, p_product_id uuid
)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$ begin
  perform public.require_salesperson_store(p_business_id, p_dealer_id, p_store_id);
  return public.internal_assigned_product(p_store_id, p_product_id);
end; $$;

create function public.get_salesperson_order_workspace(p_business_id uuid, p_order_id uuid)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$ begin
  if not public.is_active_salesperson(p_business_id)
    or not exists (
      select 1 from public.orders o where o.id = p_order_id
        and o.business_id = p_business_id
        and public.actor_can_order(auth.uid(), o.store_id, o.dealer_id)
    ) then raise exception using errcode = '42501', message = 'Assigned order unavailable'; end if;
  return public.get_order_workspace(p_order_id);
end; $$;

do $$
declare signature text;
begin
  foreach signature in array array[
    'internal_assigned_storefront(uuid)',
    'internal_assigned_products(uuid,integer,text,uuid,uuid,text)',
    'internal_assigned_product(uuid,uuid)',
    'is_active_salesperson(uuid)', 'require_salesperson_store(uuid,uuid,uuid)'
  ] loop
    execute 'revoke all on function public.' || signature || ' from public, anon, authenticated';
  end loop;
  foreach signature in array array[
    'get_salesperson_dealers(uuid,text,integer)',
    'get_salesperson_dealer_workspace(uuid,uuid)',
    'get_salesperson_storefront(uuid,uuid,uuid)',
    'get_salesperson_products(uuid,uuid,uuid,integer,text,uuid,uuid,text)',
    'get_salesperson_product(uuid,uuid,uuid,uuid)',
    'get_salesperson_order_workspace(uuid,uuid)'
  ] loop
    execute 'revoke all on function public.' || signature || ' from public, anon';
    execute 'grant execute on function public.' || signature || ' to authenticated';
  end loop;
end;
$$;
commit;
