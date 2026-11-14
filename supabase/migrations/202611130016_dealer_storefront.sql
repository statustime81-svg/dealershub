begin;

create function public.dealer_has_store_access(p_store_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.dealer_store_access a
    join public.stores s on s.id = a.store_id and s.business_id = a.business_id
    join public.businesses b on b.id = s.business_id
    where a.store_id = p_store_id and a.dealer_id = auth.uid()
      and a.status = 'active' and s.is_published and b.status = 'active'
  );
$$;

create function public.get_dealer_stores()
returns jsonb language sql stable security definer set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', s.id, 'name', s.name, 'description', s.description,
    'businessName', b.company_name, 'logoPath', b.logo_path,
    'businessType', b.business_type, 'verified', b.verification_status = 'verified'
  ) order by s.name, s.id), '[]'::jsonb)
  from public.dealer_store_access a
  join public.stores s on s.id = a.store_id and s.business_id = a.business_id
  join public.businesses b on b.id = s.business_id
  where a.dealer_id = auth.uid() and a.status = 'active'
    and s.is_published and b.status = 'active';
$$;

create function public.get_dealer_storefront(p_store_id uuid)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare v_result jsonb;
begin
  if not public.dealer_has_store_access(p_store_id) then
    raise exception using errcode = '42501', message = 'Store access unavailable';
  end if;
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

create function public.get_dealer_products(
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
  if not public.dealer_has_store_access(p_store_id) then
    raise exception using errcode = '42501', message = 'Store access unavailable';
  end if;
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

create function public.get_dealer_product(p_store_id uuid, p_product_id uuid)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare v_result jsonb;
begin
  if not public.dealer_has_store_access(p_store_id) then
    raise exception using errcode = '42501', message = 'Store access unavailable';
  end if;
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

do $$
declare signature text;
begin
  foreach signature in array array[
    'dealer_has_store_access(uuid)', 'get_dealer_stores()',
    'get_dealer_storefront(uuid)', 'get_dealer_products(uuid,integer,text,uuid,uuid,text)',
    'get_dealer_product(uuid,uuid)'
  ] loop
    execute 'revoke all on function public.' || signature || ' from public, anon';
    execute 'grant execute on function public.' || signature || ' to authenticated';
  end loop;
end;
$$;
commit;
