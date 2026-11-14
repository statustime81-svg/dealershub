begin;

-- Only the normal progression explicitly described in the PRD is included.
-- Cancellation permissions and transitions still require confirmation.
create function public.known_order_transitions(p_status text)
returns text[] language sql immutable set search_path = ''
as $$
  select case p_status
    when 'pending' then array['confirmed', 'rejected']::text[]
    when 'confirmed' then array['processing']::text[]
    when 'processing' then array['dispatched']::text[]
    when 'dispatched' then array['delivered']::text[]
    else array[]::text[]
  end;
$$;

-- Intentionally remains false until an approved inventory lifecycle is integrated.
create function public.order_status_policy_ready(p_business_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$ select false; $$;

create function public.get_order_list(
  p_scope text,
  p_business_id uuid default null,
  p_status text default 'all',
  p_search text default '',
  p_page integer default 1
)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare v_result jsonb;
begin
  if auth.uid() is null then
    raise exception using errcode = '42501', message = 'Sign in first';
  end if;
  if p_scope is null or p_scope not in ('manufacturer', 'dealer', 'salesperson')
    or p_status is null or p_status not in ('all','pending','confirmed','rejected','processing','dispatched','delivered','cancelled')
    or p_page is null or p_page < 1 or p_page > 100000
    or length(coalesce(p_search, '')) > 200 then
    raise exception 'Invalid order filters';
  end if;
  if p_scope = 'manufacturer' and (
    p_business_id is null or not public.can_manage_business(p_business_id)
  ) then raise exception using errcode = '42501', message = 'Business access unavailable'; end if;

  with eligible as (
    select o.id, o.order_number, o.status, o.grand_total, o.created_at,
      s.name as store_name, b.company_name as business_name,
      d.company_name as dealer_name, sp.full_name as salesperson_name,
      (select count(*) from public.order_items i where i.order_id = o.id) as item_count
    from public.orders o
    join public.stores s on s.id = o.store_id
    join public.businesses b on b.id = o.business_id
    join public.dealer_profiles d on d.user_id = o.dealer_id
    left join public.profiles sp on sp.id = o.salesperson_id
    where (p_business_id is null or o.business_id = p_business_id)
      and (p_status = 'all' or o.status = p_status)
      and (coalesce(trim(p_search), '') = ''
        or strpos(lower('ORD-' || o.order_number::text), lower(trim(p_search))) > 0
        or strpos(lower(d.company_name), lower(trim(p_search))) > 0)
      and (
        (p_scope = 'manufacturer' and o.business_id = p_business_id)
        or (p_scope = 'dealer' and o.dealer_id = auth.uid()
          and public.actor_can_order(auth.uid(), o.store_id, o.dealer_id))
        or (p_scope = 'salesperson' and exists (
          select 1 from public.business_memberships m
          where m.business_id = o.business_id and m.user_id = auth.uid()
            and m.role = 'salesperson' and m.status = 'active'
        ) and public.actor_can_order(auth.uid(), o.store_id, o.dealer_id))
      )
  ), paged as (
    select * from eligible order by created_at desc, id
    limit 15 offset ((p_page - 1)::bigint * 15)
  )
  select jsonb_build_object(
    'total', (select count(*) from eligible), 'pageSize', 15,
    'items', coalesce((select jsonb_agg(jsonb_build_object(
      'id', x.id, 'orderNumber', x.order_number, 'status', x.status,
      'total', x.grand_total, 'createdAt', x.created_at,
      'storeName', x.store_name, 'businessName', x.business_name,
      'dealerName', x.dealer_name, 'salespersonName', x.salesperson_name,
      'itemCount', x.item_count
    ) order by x.created_at desc, x.id) from paged x), '[]'::jsonb)
  ) into v_result;
  return v_result;
end;
$$;

create function public.get_order_workspace(p_order_id uuid)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare v_result jsonb;
begin
  if not public.can_view_order(p_order_id) then
    raise exception using errcode = '42501', message = 'Order access unavailable';
  end if;
  select jsonb_build_object(
    'order', jsonb_build_object(
      'id', o.id, 'orderNumber', o.order_number, 'status', o.status,
      'storeName', s.name, 'businessName', b.company_name,
      'dealerName', d.company_name, 'dealerPhone', d.contact_phone,
      'dealerAddress', d.address, 'salespersonName', sp.full_name,
      'subtotal', o.subtotal, 'discountTotal', o.discount_total,
      'taxTotal', o.tax_total, 'deliveryTotal', o.delivery_total,
      'total', o.grand_total, 'createdAt', o.created_at, 'updatedAt', o.updated_at
    ),
    'canManage', public.can_manage_business(o.business_id),
    'statusUpdatesReady', public.can_manage_business(o.business_id)
      and public.order_status_policy_ready(o.business_id),
    'allowedStatuses', to_jsonb(public.known_order_transitions(o.status)),
    'items', coalesce((select jsonb_agg(jsonb_build_object(
      'id', i.id, 'productName', i.product_name, 'variantName', i.variant_name,
      'sku', i.sku, 'unit', i.unit, 'packSize', i.pack_size,
      'price', i.unit_price, 'quantity', i.quantity, 'total', i.line_total
    ) order by i.id) from public.order_items i where i.order_id = o.id), '[]'::jsonb),
    'history', coalesce((select jsonb_agg(jsonb_build_object(
      'id', h.id, 'previousStatus', h.previous_status, 'status', h.new_status,
      'note', h.note, 'createdAt', h.created_at
    ) order by h.created_at, h.id) from public.order_status_history h where h.order_id = o.id), '[]'::jsonb),
    'documents', coalesce((select jsonb_agg(jsonb_build_object(
      'id', doc.id, 'fileName', doc.file_name, 'filePath', doc.file_path,
      'createdAt', doc.created_at
    ) order by doc.created_at, doc.id) from public.order_documents doc where doc.order_id = o.id), '[]'::jsonb)
  ) into v_result
  from public.orders o
  join public.stores s on s.id = o.store_id
  join public.businesses b on b.id = o.business_id
  join public.dealer_profiles d on d.user_id = o.dealer_id
  left join public.profiles sp on sp.id = o.salesperson_id
  where o.id = p_order_id;
  if not found then raise exception 'Order unavailable'; end if;
  return v_result;
end;
$$;
revoke all on function public.known_order_transitions(text), public.order_status_policy_ready(uuid) from public, anon, authenticated;
revoke all on function public.get_order_list(text,uuid,text,text,integer), public.get_order_workspace(uuid) from public, anon;
grant execute on function public.get_order_list(text,uuid,text,text,integer), public.get_order_workspace(uuid) to authenticated;
grant execute on function public.known_order_transitions(text), public.order_status_policy_ready(uuid) to service_role;
commit;
