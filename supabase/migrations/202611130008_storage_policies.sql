begin;

insert into storage.buckets (
  id,
  name,
  public
)
values
  ('business-logos', 'business-logos', false),
  ('product-images', 'product-images', false),
  ('store-banners', 'store-banners', false),
  ('order-documents', 'order-documents', false);

create function public.can_read_media(
  target_bucket text,
  target_name text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when target_bucket in (
      'product-images',
      'store-banners'
    )
    then exists (
      select 1
      from public.stores s
      where s.id::text = split_part(target_name, '/', 1)
        and public.can_access_store(s.id)
    )

    when target_bucket = 'business-logos'
    then exists (
      select 1
      from public.businesses b
      where b.id::text = split_part(target_name, '/', 1)
        and public.can_view_business(b.id)
    )

    when target_bucket = 'order-documents'
    then exists (
      select 1
      from public.order_documents d
      where d.file_path = target_name
        and d.order_id::text =
          split_part(target_name, '/', 1)
        and public.can_view_order(d.order_id)
    )

    else false
  end;
$$;

create function public.can_manage_media(
  target_bucket text,
  target_name text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when target_bucket in (
      'product-images',
      'store-banners'
    )
    then exists (
      select 1
      from public.stores s
      where s.id::text = split_part(target_name, '/', 1)
        and public.can_manage_store(s.id)
    )

    when target_bucket = 'business-logos'
    then exists (
      select 1
      from public.businesses b
      where b.id::text = split_part(target_name, '/', 1)
        and public.can_manage_business(b.id)
    )

    -- Invoice uploads use a trusted backend operation.
    else false
  end;
$$;

revoke all on function
  public.can_read_media(text, text)
from public, anon;

revoke all on function
  public.can_manage_media(text, text)
from public, anon;

grant execute on function
  public.can_read_media(text, text)
to authenticated, service_role;

grant execute on function
  public.can_manage_media(text, text)
to authenticated, service_role;

create policy dealershub_media_read
on storage.objects for select to authenticated
using (
  public.can_read_media(bucket_id, name)
  or public.can_manage_media(bucket_id, name)
);

create policy dealershub_media_insert
on storage.objects for insert to authenticated
with check (
  public.can_manage_media(bucket_id, name)
);

create policy dealershub_media_update
on storage.objects for update to authenticated
using (
  public.can_manage_media(bucket_id, name)
)
with check (
  public.can_manage_media(bucket_id, name)
);

create policy dealershub_media_delete
on storage.objects for delete to authenticated
using (
  public.can_manage_media(bucket_id, name)
);

commit;