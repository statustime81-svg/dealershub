begin;

-- Cart mutations must use the locking RPC below.
revoke insert, update, delete on public.carts, public.cart_items from authenticated;

create function public.actor_can_order(
  p_actor_id uuid, p_store_id uuid, p_dealer_id uuid
)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.dealer_store_access a
    join public.stores s on s.id = a.store_id and s.business_id = a.business_id
    join public.businesses b on b.id = a.business_id
    where a.store_id = p_store_id and a.dealer_id = p_dealer_id
      and a.status = 'active' and s.is_published and b.status = 'active'
      and (p_actor_id = p_dealer_id or exists (
        select 1 from public.salesperson_dealer_assignments d
        join public.business_memberships m
          on m.business_id = d.business_id and m.user_id = d.salesperson_id
        where d.business_id = a.business_id and d.dealer_id = p_dealer_id
          and d.salesperson_id = p_actor_id and d.is_active
          and m.role = 'salesperson' and m.status = 'active'
      ))
  );
$$;

-- Integration point: no unapproved GST, delivery or discount rule is assumed.
-- Replace in a NEW migration only after the business rules are confirmed.
create function public.calculate_order_charges(
  p_business_id uuid, p_dealer_id uuid, p_subtotal numeric
)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
begin
  return jsonb_build_object('ready', false);
end;
$$;

create function public.build_actor_cart_quote(p_actor_id uuid, p_cart_id uuid)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare
  v_cart public.carts%rowtype;
  v_items jsonb;
  v_subtotal numeric;
  v_charges jsonb;
  v_pricing_ready boolean;
  v_discount numeric;
  v_tax numeric;
  v_delivery numeric;
  v_total numeric;
  v_can_submit boolean;
  v_result jsonb;
begin
  select * into v_cart from public.carts where id = p_cart_id;
  if not found or v_cart.created_by is distinct from p_actor_id
    or not public.actor_can_order(p_actor_id, v_cart.store_id, v_cart.dealer_id)
  then raise exception using errcode = '42501', message = 'Cart access unavailable'; end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', ci.id, 'variantId', v.id, 'productId', p.id,
    'name', p.name, 'variantName', v.name, 'unit', p.unit,
    'packSize', v.pack_size, 'price', v.wholesale_price,
    'quantity', ci.quantity, 'moq', v.moq, 'quantityStep', v.quantity_step,
    'stockQuantity', v.stock_quantity, 'availability', v.availability,
    'imagePath', (select i.image_path from public.product_images i where i.product_id = p.id order by i.sort_order, i.id limit 1),
    'lineTotal', v.wholesale_price * ci.quantity,
    'isOrderable', p.is_active and v.is_active
      and v.availability in ('in_stock', 'low_stock')
      and ci.quantity >= v.moq and (ci.quantity - v.moq) % v.quantity_step = 0
      and (v.stock_quantity is null or v.stock_quantity >= ci.quantity)
  ) order by ci.id), '[]'::jsonb),
    coalesce(sum(v.wholesale_price * ci.quantity), 0)
  into v_items, v_subtotal
  from public.cart_items ci
  join public.product_variants v on v.id = ci.variant_id and v.store_id = ci.store_id
  join public.products p on p.id = v.product_id and p.store_id = ci.store_id
  where ci.cart_id = p_cart_id;

  v_charges := public.calculate_order_charges(v_cart.business_id, v_cart.dealer_id, v_subtotal);
  v_pricing_ready := coalesce((v_charges ->> 'ready')::boolean, false);
  if v_pricing_ready then
    v_discount := (v_charges ->> 'discountTotal')::numeric;
    v_tax := (v_charges ->> 'taxTotal')::numeric;
    v_delivery := (v_charges ->> 'deliveryTotal')::numeric;
    if v_discount is null or v_tax is null or v_delivery is null
      or v_discount < 0 or v_discount > v_subtotal or v_tax < 0 or v_delivery < 0
      or v_discount <> round(v_discount, 2) or v_tax <> round(v_tax, 2)
      or v_delivery <> round(v_delivery, 2)
      or v_discount::text in ('NaN', 'Infinity', '-Infinity')
      or v_tax::text in ('NaN', 'Infinity', '-Infinity')
      or v_delivery::text in ('NaN', 'Infinity', '-Infinity')
    then raise exception 'Invalid confirmed order charges'; end if;
    v_total := v_subtotal - v_discount + v_tax + v_delivery;
  end if;
  v_can_submit := v_pricing_ready and jsonb_array_length(v_items) > 0
    and not exists (select 1 from jsonb_array_elements(v_items) x where not (x ->> 'isOrderable')::boolean);
  v_result := jsonb_build_object(
    'cartId', v_cart.id, 'storeId', v_cart.store_id,
    'items', v_items, 'subtotal', v_subtotal,
    'pricingReady', v_pricing_ready, 'canSubmit', v_can_submit,
    'discountTotal', v_discount, 'taxTotal', v_tax,
    'deliveryTotal', v_delivery, 'total', v_total
  );
  return v_result || jsonb_build_object('fingerprint', md5(v_result::text));
end;
$$;

create function public.get_order_cart(p_store_id uuid, p_dealer_id uuid default null)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare v_actor uuid := auth.uid(); v_dealer uuid; v_cart_id uuid;
begin
  v_dealer := coalesce(p_dealer_id, v_actor);
  if not public.actor_can_order(v_actor, p_store_id, v_dealer) then
    raise exception using errcode = '42501', message = 'Store access unavailable';
  end if;
  select id into v_cart_id from public.carts
  where store_id = p_store_id and dealer_id = v_dealer and created_by = v_actor;
  if not found then
    return jsonb_build_object(
      'cartId', null, 'storeId', p_store_id, 'items', '[]'::jsonb,
      'subtotal', 0, 'pricingReady', false, 'canSubmit', false,
      'discountTotal', null, 'taxTotal', null, 'deliveryTotal', null,
      'total', null, 'fingerprint', null
    );
  end if;
  return public.build_actor_cart_quote(v_actor, v_cart_id);
end;
$$;

create function public.mutate_order_cart(
  p_store_id uuid, p_variant_id uuid, p_quantity integer,
  p_mode text, p_expected_quantity integer default null, p_dealer_id uuid default null
)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  v_actor uuid := auth.uid(); v_dealer uuid; v_business_id uuid;
  v_cart_id uuid; v_current integer; v_new bigint;
  v_variant public.product_variants%rowtype; v_product_active boolean;
begin
  v_dealer := coalesce(p_dealer_id, v_actor);
  select business_id into v_business_id from public.stores where id = p_store_id;
  perform 1 from public.businesses where id = v_business_id for update;
  perform 1 from public.stores where id = p_store_id for update;
  if not public.actor_can_order(v_actor, p_store_id, v_dealer) then
    raise exception using errcode = '42501', message = 'Store access unavailable';
  end if;
  if p_mode is null or p_mode not in ('add', 'set', 'remove') then raise exception 'Invalid cart operation'; end if;
  select id into v_cart_id from public.carts
  where store_id = p_store_id and dealer_id = v_dealer and created_by = v_actor for update;
  if not found then
    if p_mode <> 'add' then raise exception 'Cart changed. Refresh'; end if;
    insert into public.carts (business_id, store_id, dealer_id, created_by)
    values (v_business_id, p_store_id, v_dealer, v_actor) returning id into v_cart_id;
  end if;
  select quantity into v_current from public.cart_items
  where cart_id = v_cart_id and variant_id = p_variant_id for update;
  if p_mode <> 'add' and (v_current is null or p_expected_quantity is distinct from v_current) then
    raise exception 'Cart changed. Refresh before updating';
  end if;
  if p_mode = 'remove' then
    delete from public.cart_items where cart_id = v_cart_id and variant_id = p_variant_id;
  else
    if p_quantity is null or p_quantity <= 0 then raise exception 'Quantity must be positive'; end if;
    select * into v_variant from public.product_variants
    where id = p_variant_id and store_id = p_store_id for update;
    if not found then raise exception 'Variant unavailable'; end if;
    select is_active into v_product_active from public.products
    where id = v_variant.product_id and store_id = p_store_id for update;
    v_new := case when p_mode = 'add' then coalesce(v_current, 0)::bigint + p_quantity else p_quantity end;
    if not v_variant.is_active or not coalesce(v_product_active, false)
      or v_variant.availability not in ('in_stock', 'low_stock')
      or v_new > 2147483647 or v_new < v_variant.moq
      or (v_new - v_variant.moq) % v_variant.quantity_step <> 0
      or (v_variant.stock_quantity is not null and v_new > v_variant.stock_quantity)
    then raise exception 'Check product availability, stock, MOQ and quantity increment'; end if;
    insert into public.cart_items (cart_id, store_id, variant_id, quantity)
    values (v_cart_id, p_store_id, p_variant_id, v_new::integer)
    on conflict (cart_id, variant_id) do update set quantity = excluded.quantity;
  end if;
  update public.carts set updated_at = now() where id = v_cart_id;
  return public.build_actor_cart_quote(v_actor, v_cart_id);
end;
$$;

revoke all on function public.actor_can_order(uuid,uuid,uuid) from public, anon, authenticated;
revoke all on function public.calculate_order_charges(uuid,uuid,numeric) from public, anon, authenticated;
revoke all on function public.build_actor_cart_quote(uuid,uuid) from public, anon, authenticated;
revoke all on function public.get_order_cart(uuid,uuid) from public, anon;
revoke all on function public.mutate_order_cart(uuid,uuid,integer,text,integer,uuid) from public, anon;
grant execute on function public.get_order_cart(uuid,uuid) to authenticated;
grant execute on function public.mutate_order_cart(uuid,uuid,integer,text,integer,uuid) to authenticated;
grant execute on function public.actor_can_order(uuid,uuid,uuid), public.build_actor_cart_quote(uuid,uuid), public.calculate_order_charges(uuid,uuid,numeric) to service_role;
commit;
