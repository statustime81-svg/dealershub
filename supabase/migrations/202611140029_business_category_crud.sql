begin;
alter table public.product_categories add column if not exists owner_business_id uuid references public.businesses(id);
create index if not exists category_owner_business_idx on public.product_categories(owner_business_id);
create unique index if not exists company_category_name_unique on public.product_categories(owner_business_id,lower(trim(name))) where owner_business_id is not null;

-- Global names remain shared. Private names are visible only to managers or authorized stores.
drop policy taxonomy_read on public.product_categories;
create policy taxonomy_read on public.product_categories for select to authenticated using (
  (owner_business_id is null and is_active) or public.is_platform_admin()
  or (owner_business_id is not null and (
    public.can_manage_business(owner_business_id)
    or (is_active and exists(select 1 from public.store_categories sc
      where sc.category_id=product_categories.id and public.can_access_store(sc.store_id)))
  ))
);

-- Guard every writer, including trusted product-save functions, against cross-company links.
create function public.guard_category_company() returns trigger language plpgsql security definer set search_path='' as $$
declare owner_id uuid; store_business uuid;
begin
  select owner_business_id into owner_id from public.product_categories where id=new.category_id;
  select business_id into store_business from public.stores where id=new.store_id;
  if owner_id is not null and owner_id is distinct from store_business then
    raise exception using errcode='42501',message='Category belongs to another company';
  end if;
  return new;
end $$;
revoke all on function public.guard_category_company() from public,anon,authenticated;
create trigger store_category_company_guard before insert or update on public.store_categories for each row execute function public.guard_category_company();
create trigger product_category_company_guard before insert or update on public.products for each row execute function public.guard_category_company();

create function public.get_business_categories_owned(p_business_id uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if not public.can_manage_business(p_business_id) then raise exception 'Business management access required' using errcode='42501'; end if;
 return coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name,'revision',revision) order by lower(name),id)
 from public.product_categories where owner_business_id=p_business_id),'[]'::jsonb);
end $$;
create function public.manage_business_category(p_business_id uuid,p_store_id uuid,p_id uuid,p_revision bigint,p_name text,p_delete boolean)
returns void language plpgsql security definer set search_path='' as $$
declare current_row public.product_categories;
begin
 if not public.can_manage_business(p_business_id) then raise exception 'Business management access required' using errcode='42501'; end if;
 perform 1 from public.businesses where id=p_business_id and status='active' for update;
 if not found or not public.can_manage_business(p_business_id) then raise exception 'Business access unavailable' using errcode='42501'; end if;
 perform 1 from public.stores where id=p_store_id and business_id=p_business_id;
 if not found or p_id is null or p_delete is null then raise exception 'Invalid category request'; end if;
 select * into current_row from public.product_categories where id=p_id for update;
 if found then
   if current_row.owner_business_id is distinct from p_business_id then raise exception 'Shared or other company category cannot be changed' using errcode='42501'; end if;
   -- Retry after a successful creation returns the same row without duplicating it.
   if p_revision is null and not p_delete and current_row.name=trim(p_name) then return; end if;
   if p_revision is null or current_row.revision<>p_revision then raise exception 'Category changed; refresh before retrying' using errcode='40001'; end if;
   if p_delete then
     if exists(select 1 from public.products where category_id=p_id)
       or exists(select 1 from public.product_categories where parent_id=p_id) then
       raise exception 'Category is in use; move products or child categories first';
     end if;
     delete from public.store_categories where category_id=p_id;
     delete from public.product_categories where id=p_id;
     return;
   end if;
 else
   if p_delete then return; end if;
   if p_revision is not null then raise exception 'Category no longer exists'; end if;
 end if;
 if p_name is null or length(trim(p_name)) not between 1 and 150 then raise exception 'Category name must be 1 to 150 characters'; end if;
 if current_row.id is null then
   insert into public.product_categories(id,name,slug,owner_business_id)
     values(p_id,trim(p_name),'company-'||p_id::text,p_business_id);
   insert into public.store_categories(store_id,category_id) values(p_store_id,p_id);
 else
   update public.product_categories set name=trim(p_name),revision=revision+1 where id=p_id;
 end if;
end $$;
revoke all on function public.get_business_categories_owned(uuid) from public,anon;
revoke all on function public.manage_business_category(uuid,uuid,uuid,bigint,text,boolean) from public,anon;
grant execute on function public.get_business_categories_owned(uuid) to authenticated;
grant execute on function public.manage_business_category(uuid,uuid,uuid,bigint,text,boolean) to authenticated;
notify pgrst,'reload schema';
commit;
