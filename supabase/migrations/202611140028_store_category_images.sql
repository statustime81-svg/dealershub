begin;
alter table public.store_categories add column if not exists image_path text;

create or replace function public.get_store_category_image(p_store_id uuid, p_category_id uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_result jsonb;
begin
  if not public.can_manage_store(p_store_id) then
    raise exception using errcode = '42501', message = 'Store management access required';
  end if;
  select jsonb_build_object('imagePath', image_path) into v_result
    from public.store_categories where store_id = p_store_id and category_id = p_category_id;
  if not found then raise exception 'Select this category for the store first'; end if;
  return v_result;
end;
$$;

create or replace function public.set_store_category_image(
  p_store_id uuid, p_category_id uuid, p_expected_image_path text, p_image_path text
) returns void language plpgsql security definer set search_path = '' as $$
declare v_current text; v_business_id uuid;
begin
  if not public.can_manage_store(p_store_id) then
    raise exception using errcode = '42501', message = 'Store management access required';
  end if;
  select business_id into v_business_id from public.stores where id = p_store_id;
  perform 1 from public.businesses where id = v_business_id and status = 'active' for update;
  if not found or not public.can_manage_store(p_store_id) then
    raise exception using errcode = '42501', message = 'Business access unavailable';
  end if;
  select image_path into v_current from public.store_categories
    where store_id = p_store_id and category_id = p_category_id for update;
  if not found then raise exception 'Select this category for the store first'; end if;
  if v_current is distinct from p_expected_image_path then
    raise exception using errcode = '40001', message = 'Category image changed; refresh before retrying';
  end if;
  if p_image_path is not null and (
    split_part(p_image_path, '/', 1) <> p_store_id::text
    or not exists (select 1 from storage.objects where bucket_id = 'store-banners' and name = p_image_path)
  ) then raise exception 'Invalid category image'; end if;
  update public.store_categories set image_path = p_image_path
    where store_id = p_store_id and category_id = p_category_id;
end;
$$;
revoke all on function public.get_store_category_image(uuid,uuid) from public, anon;
revoke all on function public.set_store_category_image(uuid,uuid,text,text) from public, anon;
grant execute on function public.get_store_category_image(uuid,uuid) to authenticated;
grant execute on function public.set_store_category_image(uuid,uuid,text,text) to authenticated;

create or replace function public.get_dealer_storefront(p_store_id uuid)
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
        'id', c.id, 'name', c.name, 'description', c.description, 'imagePath', sc.image_path
      ) order by c.name, c.id)
      from public.product_categories c
      join public.store_categories sc on sc.category_id = c.id and sc.store_id = s.id
      where c.is_active
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


notify pgrst, 'reload schema';
commit;
