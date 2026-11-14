begin;

-- Technical image-upload limits, matching the frontend uploader.
update storage.buckets
set
  file_size_limit = 10485760,
  allowed_mime_types = array[
    'image/jpeg', 'image/png', 'image/webp'
  ]
where id in ('business-logos', 'store-banners');

alter table public.stores
add constraint store_name_length_valid
check (length(trim(name)) between 1 and 200);

alter table public.stores
add constraint store_description_length_valid
check (description is null or length(description) <= 3000);

alter table public.store_banners
add constraint banner_order_nonnegative
check (sort_order >= 0);

alter table public.store_banners
add constraint banner_heading_length_valid
check (heading is null or length(heading) <= 200);

alter table public.store_banners
add constraint banner_description_length_valid
check (description is null or length(description) <= 1000);

-- A banner row cannot point to another store's folder.
alter table public.store_banners
add constraint banner_store_folder_valid
check (
  split_part(image_path, '/', 1) = store_id::text
  and length(split_part(image_path, '/', 2)) > 0
);

-- A company logo cannot point to another company's folder.
alter table public.businesses
add constraint business_logo_folder_valid
check (
  logo_path is null
  or (
    split_part(logo_path, '/', 1) = id::text
    and length(split_part(logo_path, '/', 2)) > 0
  )
);

commit;
