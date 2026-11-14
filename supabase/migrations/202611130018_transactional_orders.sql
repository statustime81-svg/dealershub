begin;
alter table public.orders add column source_cart_id uuid references public.carts(id);
alter table public.orders add column quote_fingerprint text;

-- Stock reservation/deduction timing is not specified in the supplied PRD.
-- A confirmed policy must replace this hook before production order placement.
create function public.apply_confirmed_order_stock_policy(p_order_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  raise exception 'DH_STOCK_POLICY_NOT_CONFIGURED';
end;
$$;

create function public.submit_cart_order(
  p_actor_id uuid, p_cart_id uuid, p_idempotency_key uuid, p_expected_fingerprint text
)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  v_cart public.carts%rowtype;
  v_existing public.orders%rowtype;
  v_order public.orders%rowtype;
  v_business_id uuid; v_quote jsonb;
begin
  if p_actor_id is null or p_idempotency_key is null or p_expected_fingerprint is null then
    raise exception 'Required order information missing';
  end if;
  select business_id into v_business_id from public.carts where id = p_cart_id;
  perform 1 from public.businesses where id = v_business_id for update;
  perform 1 from public.stores where id = (select store_id from public.carts where id = p_cart_id) for update;
  select * into v_cart from public.carts where id = p_cart_id for update;
  if not found or v_cart.created_by is distinct from p_actor_id
    or not public.actor_can_order(p_actor_id, v_cart.store_id, v_cart.dealer_id)
  then raise exception using errcode = '42501', message = 'Cart access unavailable'; end if;

  perform pg_advisory_xact_lock(hashtextextended(p_actor_id::text || ':' || p_idempotency_key::text, 0));
  select * into v_existing from public.orders
  where created_by = p_actor_id and idempotency_key = p_idempotency_key;
  if found then
    if v_existing.source_cart_id is distinct from p_cart_id
      or v_existing.quote_fingerprint is distinct from p_expected_fingerprint
    then raise exception 'Order request key was already used for another quote'; end if;
    return jsonb_build_object('orderId', v_existing.id, 'orderNumber', v_existing.order_number, 'alreadySubmitted', true);
  end if;

  -- Deterministic locking across all variants/products in this cart.
  perform v.id from public.product_variants v join public.cart_items ci on ci.variant_id = v.id
    where ci.cart_id = p_cart_id order by v.id for update of v;
  perform p.id from public.products p
    where p.id in (select v.product_id from public.product_variants v join public.cart_items ci on ci.variant_id = v.id where ci.cart_id = p_cart_id)
    order by p.id for update of p;
  v_quote := public.build_actor_cart_quote(p_actor_id, p_cart_id);
  if (v_quote ->> 'fingerprint') is distinct from p_expected_fingerprint then
    raise exception 'Cart or pricing changed. Review checkout again';
  end if;
  if not (v_quote ->> 'pricingReady')::boolean then
    raise exception 'DH_PRICING_NOT_CONFIGURED';
  end if;
  if not (v_quote ->> 'canSubmit')::boolean then
    raise exception 'Check cart quantities and product availability';
  end if;

  insert into public.orders (
    business_id, store_id, dealer_id, created_by, salesperson_id,
    idempotency_key, source_cart_id, quote_fingerprint, status,
    subtotal, discount_total, tax_total, delivery_total, grand_total
  ) values (
    v_cart.business_id, v_cart.store_id, v_cart.dealer_id, p_actor_id,
    case when p_actor_id <> v_cart.dealer_id then p_actor_id else null end,
    p_idempotency_key, p_cart_id, p_expected_fingerprint, 'pending',
    (v_quote ->> 'subtotal')::numeric, (v_quote ->> 'discountTotal')::numeric,
    (v_quote ->> 'taxTotal')::numeric, (v_quote ->> 'deliveryTotal')::numeric,
    (v_quote ->> 'total')::numeric
  ) returning * into v_order;

  insert into public.order_items (
    order_id, store_id, variant_id, product_name, variant_name, sku, unit,
    pack_size, unit_price, quantity, moq_snapshot, quantity_step_snapshot, line_total
  ) select v_order.id, v_cart.store_id, v.id, p.name, v.name, v.sku, p.unit,
    v.pack_size, v.wholesale_price, ci.quantity, v.moq, v.quantity_step,
    v.wholesale_price * ci.quantity
  from public.cart_items ci join public.product_variants v on v.id = ci.variant_id
  join public.products p on p.id = v.product_id where ci.cart_id = p_cart_id;

  perform public.apply_confirmed_order_stock_policy(v_order.id);
  insert into public.order_status_history (order_id, previous_status, new_status, changed_by)
  values (v_order.id, null, 'pending', p_actor_id);
  delete from public.cart_items where cart_id = p_cart_id;
  update public.carts set updated_at = now() where id = p_cart_id;
  return jsonb_build_object('orderId', v_order.id, 'orderNumber', v_order.order_number, 'alreadySubmitted', false);
end;
$$;

create function public.get_actor_order_confirmation(p_order_id uuid)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare v_result jsonb;
begin
  select jsonb_build_object(
    'orderId', o.id, 'orderNumber', o.order_number, 'status', o.status,
    'storeName', s.name, 'businessName', b.company_name,
    'subtotal', o.subtotal, 'discountTotal', o.discount_total,
    'taxTotal', o.tax_total, 'deliveryTotal', o.delivery_total,
    'total', o.grand_total, 'createdAt', o.created_at
  ) into v_result from public.orders o
  join public.stores s on s.id = o.store_id
  join public.businesses b on b.id = o.business_id
  where o.id = p_order_id and o.created_by = auth.uid()
    and public.actor_can_order(auth.uid(), o.store_id, o.dealer_id);
  if not found then raise exception using errcode = '42501', message = 'Order unavailable'; end if;
  return v_result;
end;
$$;
revoke all on function public.apply_confirmed_order_stock_policy(uuid) from public, anon, authenticated;
revoke all on function public.submit_cart_order(uuid,uuid,uuid,text) from public, anon, authenticated;
grant execute on function public.apply_confirmed_order_stock_policy(uuid), public.submit_cart_order(uuid,uuid,uuid,text) to service_role;
revoke all on function public.get_actor_order_confirmation(uuid) from public, anon;
grant execute on function public.get_actor_order_confirmation(uuid) to authenticated;
commit;
