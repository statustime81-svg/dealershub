begin;
create function public.get_workspace_report(p_business_id uuid default null,p_from date default current_date-29,p_to date default current_date+1)
returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if p_business_id is null then
  if not public.is_platform_admin() then raise exception 'Platform administrator access required' using errcode='42501';end if;
 elsif not public.can_manage_business(p_business_id) then raise exception 'Business access required' using errcode='42501';end if;
 if p_from is null or p_to is null or p_to<=p_from or p_to-p_from>366 then raise exception 'Invalid date range';end if;
 return (with scoped as(select * from public.orders where (p_business_id is null or business_id=p_business_id)
 and created_at>=p_from::timestamp at time zone 'UTC' and created_at<p_to::timestamp at time zone 'UTC'),
 daily as(select (created_at at time zone 'UTC')::date day,count(*) orders,sum(grand_total) value from scoped group by 1),
 statuses as(select status,count(*) orders,coalesce(sum(grand_total),0) value from scoped group by status),
 recent as(select o.id,o.order_number,o.status,o.grand_total,o.created_at,coalesce(d.company_name,'Dealer') dealer_name
 from scoped o left join public.dealer_profiles d on d.user_id=o.dealer_id order by o.created_at desc,o.id desc limit 8)
 select jsonb_build_object('orders',(select count(*) from scoped),'submittedValue',(select coalesce(sum(grand_total),0) from scoped),
 'daily',coalesce((select jsonb_agg(to_jsonb(x) order by x.day) from daily x),'[]'::jsonb),
 'statuses',coalesce((select jsonb_agg(to_jsonb(x) order by x.status) from statuses x),'[]'::jsonb),
 'recent',coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at desc,x.id desc) from recent x),'[]'::jsonb)));
end $$;
create function public.get_business_inventory(p_business_id uuid,p_search text default '',p_page integer default 1)
returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not public.can_manage_business(p_business_id) then raise exception 'Business access required' using errcode='42501';end if;
 if p_search is null or length(p_search)>200 or p_page is null or p_page not between 1 and 100000 then raise exception 'Invalid filters';end if;
 return (with filtered as(select v.id,v.store_id,v.product_id,v.name,v.sku,v.stock_quantity,v.availability,v.updated_at,v.is_active,p.name product_name,s.name store_name
 from public.product_variants v join public.products p on p.id=v.product_id and p.store_id=v.store_id join public.stores s on s.id=v.store_id
 where s.business_id=p_business_id and (strpos(lower(p.name||' '||v.name||' '||coalesce(v.sku,'')),lower(trim(p_search)))>0)),
 paged as(select * from filtered order by lower(product_name),id limit 15 offset (p_page-1)*15)
 select jsonb_build_object('items',coalesce((select jsonb_agg(to_jsonb(x) order by lower(x.product_name),x.id) from paged x),'[]'::jsonb),'total',(select count(*) from filtered),'pageSize',15));
end $$;
create function public.update_inventory_availability(p_variant_id uuid,p_expected_updated_at timestamptz,p_quantity integer,p_availability text)
returns void language plpgsql security definer set search_path='' as $$
declare v public.product_variants; store_uuid uuid;
begin
 select store_id into store_uuid from public.product_variants where id=p_variant_id;
 if store_uuid is null or not public.can_manage_store(store_uuid) then raise exception 'Business access required' using errcode='42501';end if;
 -- Match product editor serialization before changing variant inventory.
 perform 1 from public.stores where id=store_uuid for update;
 if not public.can_manage_store(store_uuid) then raise exception 'Business access required' using errcode='42501';end if;
 select * into v from public.product_variants where id=p_variant_id for update;
 if not found or p_expected_updated_at is null or v.updated_at<>p_expected_updated_at then raise exception 'Inventory changed; refresh';end if;
 if p_quantity<0 or p_availability is null or p_availability not in ('in_stock','low_stock','out_of_stock','enquire') then raise exception 'Invalid availability';end if;
 update public.product_variants set stock_quantity=p_quantity,availability=p_availability where id=p_variant_id;
end $$;
create function public.update_business_profile(p_business_id uuid,p_expected_updated_at timestamptz,p_name text,p_email text,p_phone text,p_address text,p_gstin text,p_category_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare b public.businesses;
begin
 if not public.can_manage_business(p_business_id) then raise exception 'Business access required' using errcode='42501';end if;
 select * into b from public.businesses where id=p_business_id for update;
 if not public.can_manage_business(p_business_id) then raise exception 'Business access required' using errcode='42501';end if;
 if p_expected_updated_at is null or b.updated_at<>p_expected_updated_at then raise exception 'Business changed; refresh';end if;
 if p_name is null or length(trim(p_name)) not between 1 and 200 or p_email is null or length(p_email)>254 or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or length(coalesce(p_phone,''))>30 or length(coalesce(p_address,''))>2000 or length(coalesce(p_gstin,''))>30 then raise exception 'Invalid profile';end if;
 if p_category_id is not null and p_category_id is distinct from b.category_id and not exists(select 1 from public.business_categories where id=p_category_id and is_active) then raise exception 'Category unavailable';end if;
 update public.businesses set company_name=trim(p_name),contact_email=trim(p_email),contact_phone=nullif(trim(p_phone),''),address=nullif(trim(p_address),''),gstin=nullif(trim(p_gstin),''),category_id=p_category_id where id=p_business_id;
end $$;
revoke all on function public.get_workspace_report(uuid,date,date),public.get_business_inventory(uuid,text,integer),public.update_inventory_availability(uuid,timestamptz,integer,text),public.update_business_profile(uuid,timestamptz,text,text,text,text,text,uuid) from public,anon;
grant execute on function public.get_workspace_report(uuid,date,date),public.get_business_inventory(uuid,text,integer),public.update_inventory_availability(uuid,timestamptz,integer,text),public.update_business_profile(uuid,timestamptz,text,text,text,text,text,uuid) to authenticated;
commit;
