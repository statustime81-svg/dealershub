begin;

alter table public.products
add constraint products_category_id_fkey
foreign key (category_id)
references public.product_categories(id);

alter table public.products
add constraint products_brand_id_fkey
foreign key (brand_id)
references public.brands(id);

update storage.buckets
set
  file_size_limit = 10485760,
  allowed_mime_types = array[
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
where id = 'product-images';

create function public.save_product_images(
  p_actor_id uuid,
  p_product_id uuid,
  p_expected_images jsonb,
  p_images jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_store_id uuid;
  v_business_id uuid;
  v_current jsonb;
  v_image jsonb;
  v_position bigint;
begin
  select p.store_id, s.business_id
  into v_store_id, v_business_id
  from public.products p
  join public.stores s on s.id = p.store_id
  where p.id = p_product_id;

  if not found then
    raise exception 'Product unavailable';
  end if;

  perform 1
  from public.businesses
  where id = v_business_id
    and status = 'active'
  for update;

  if not found then
    raise exception 'Business unavailable';
  end if;

  if not exists (
    select 1
    from public.business_memberships
    where business_id = v_business_id
      and user_id = p_actor_id
      and role = 'business_admin'
      and status = 'active'
  ) then
    raise exception 'Business administrator access required';
  end if;

  perform 1
  from public.products
  where id = p_product_id
    and store_id = v_store_id
  for update;

  if not found then
    raise exception 'Product changed. Refresh and try again';
  end if;

  if jsonb_typeof(p_images) is distinct from 'array'
    or jsonb_typeof(p_expected_images) is distinct from 'array'
  then
    raise exception 'Invalid image payload';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', i.id,
        'imagePath', i.image_path,
        'altText', coalesce(i.alt_text, '')
      )
      order by i.sort_order, i.id
    ),
    '[]'::jsonb
  )
  into v_current
  from public.product_images i
  where i.product_id = p_product_id;

  if v_current <> p_expected_images then
    raise exception 'Images changed. Refresh before saving';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_images) item
    group by item ->> 'id'
    having count(*) > 1
  ) then
    raise exception 'Duplicate image IDs';
  end if;

  for v_image in
    select value
    from jsonb_array_elements(p_images)
  loop
    if split_part(v_image ->> 'imagePath', '/', 1)
         <> v_store_id::text
      or split_part(v_image ->> 'imagePath', '/', 2)
         <> p_product_id::text
    then
      raise exception 'Invalid image location';
    end if;

    if not exists (
      select 1
      from storage.objects o
      where o.bucket_id = 'product-images'
        and o.name = v_image ->> 'imagePath'
    ) then
      raise exception 'Uploaded image not found';
    end if;

    if exists (
      select 1
      from public.product_images i
      where i.id = (v_image ->> 'id')::uuid
        and i.product_id <> p_product_id
    ) then
      raise exception 'Image belongs to another product';
    end if;
  end loop;

  delete from public.product_images
  where product_id = p_product_id;

  for v_image, v_position in
    select value, ordinality
    from jsonb_array_elements(p_images)
      with ordinality
  loop
    insert into public.product_images (
      id,
      product_id,
      image_path,
      alt_text,
      sort_order
    )
    values (
      (v_image ->> 'id')::uuid,
      p_product_id,
      v_image ->> 'imagePath',
      nullif(v_image ->> 'altText', ''),
      (v_position - 1)::integer
    );
  end loop;
end;
$$;

revoke all on function
  public.save_product_images(uuid, uuid, jsonb, jsonb)
from public, anon, authenticated;

grant execute on function
  public.save_product_images(uuid, uuid, jsonb, jsonb)
to service_role;

-- Image metadata now changes only through the checked RPC.
drop policy product_images_manage
on public.product_images;

revoke insert, update, delete
on public.product_images
from authenticated;

commit;