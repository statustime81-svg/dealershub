begin;
create table public.business_checkout_policies (
 business_id uuid primary key references public.businesses(id), config jsonb not null,
 revision bigint not null default 1, updated_at timestamptz not null default now()
);
create table public.order_checkout_details (
 order_id uuid primary key references public.orders(id), business_id uuid not null references public.businesses(id),
 plan text not null check(plan in ('advance50','credit30','credit60','credit90')),
 shipping_address jsonb not null, policy jsonb not null, initial_quote jsonb not null,
 due_at timestamptz, paid_total numeric(14,2) not null default 0, earned_discount numeric(14,2) not null default 0,
 stock_done boolean not null default false, deducted_variants uuid[] not null default '{}',
 carrier text, awb text, tracking_url text, shipping_updated_at timestamptz
);
create table public.order_payment_receipts (
 id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id),
 business_id uuid not null references public.businesses(id), actor_id uuid not null references public.profiles(id),
 is_test boolean not null default false, request_key uuid not null, amount numeric(14,2) not null check(amount>0),
 reference text not null, received_at timestamptz not null, created_at timestamptz not null default now(),
 unique(actor_id,request_key), unique(business_id,reference)
);
create index checkout_receipts_order_idx on public.order_payment_receipts(order_id,received_at,id);
alter table public.orders add column price_includes_tax boolean not null default false;
alter table public.orders drop constraint order_totals_valid;
alter table public.orders add constraint order_totals_valid check(grand_total=subtotal-discount_total+case when price_includes_tax then 0 else tax_total end+delivery_total);

alter table public.business_checkout_policies enable row level security;
alter table public.order_checkout_details enable row level security;
alter table public.order_payment_receipts enable row level security;
revoke all on public.business_checkout_policies,public.order_checkout_details,public.order_payment_receipts from public,anon,authenticated;
grant select on public.business_checkout_policies,public.order_checkout_details,public.order_payment_receipts to authenticated;
create policy checkout_policy_manage_read on public.business_checkout_policies for select to authenticated using(public.can_manage_business(business_id));
create policy checkout_details_read on public.order_checkout_details for select to authenticated using(public.can_view_order(order_id));
create policy checkout_receipts_read on public.order_payment_receipts for select to authenticated using(public.can_view_order(order_id));

create function public.save_checkout_policy(p_business_id uuid,p_expected_revision bigint,p_config jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_revision bigint;
begin
 perform 1 from public.businesses where id=p_business_id and status='active' for update;
 if not found or not public.can_manage_business(p_business_id) then raise exception 'Business administrator required' using errcode='42501'; end if;
 if p_expected_revision is null or p_expected_revision<0 then raise exception 'Reload checkout settings before saving';end if;
 if p_config is null or jsonb_typeof(p_config)<>'object' then raise exception 'Complete checkout settings'; end if;
 if (p_config->>'taxMode') is null or p_config->>'taxMode' not in ('extra','included')
 or (p_config->>'paymentMode') is null or p_config->>'paymentMode' not in ('test','manual')
 or (p_config->>'advanceBase') is null or p_config->>'advanceBase' not in ('order','advance')
 or (p_config->>'credit30Timing') is null or p_config->>'credit30Timing' not in ('selection','settlement')
 or (p_config->>'creditStart') is null or p_config->>'creditStart' not in ('order','delivery')
 or (p_config->>'stockPoint') is null or p_config->>'stockPoint' not in ('placement','confirmation','dispatch')
 or (p_config->>'addressSource') is null or p_config->>'addressSource' not in ('manufacturer','dealer')
 or (p_config->>'advanceBalanceDays') is null or (p_config->>'advanceBalanceDays')::integer not between 1 and 365
 or (p_config->>'deliveryFee') is null or (p_config->>'deliveryFee')::numeric not between 0 and 1000000
 or (p_config->>'deliveryFee')::numeric<>round((p_config->>'deliveryFee')::numeric,2)
 or jsonb_typeof(p_config->'taxDelivery') is distinct from 'boolean'
 then raise exception 'Complete all checkout settings'; end if;
 select revision into v_revision from public.business_checkout_policies where business_id=p_business_id for update;
 if coalesce(v_revision,0)<>p_expected_revision then raise exception 'Settings changed; reload before saving'; end if;
 insert into public.business_checkout_policies(business_id,config) values(p_business_id,p_config)
 on conflict(business_id) do update set config=excluded.config,revision=public.business_checkout_policies.revision+1,updated_at=now()
 returning revision into v_revision;
 return jsonb_build_object('revision',v_revision);
end; $$;

create function public.checkout_amounts(p_subtotal numeric,p_discount numeric,p_delivery numeric,p_included boolean,p_tax_delivery boolean)
returns jsonb language plpgsql immutable set search_path='' as $$
declare v_tax numeric; v_total numeric; v_net numeric;
begin
 if p_subtotal is null or p_discount is null or p_delivery is null or p_included is null or p_tax_delivery is null or p_subtotal<0 or p_discount<0 or p_discount>p_subtotal or p_delivery<0 or p_subtotal::text in ('NaN','Infinity','-Infinity') or p_discount::text in ('NaN','Infinity','-Infinity') or p_delivery::text in ('NaN','Infinity','-Infinity') then raise exception 'Invalid amounts'; end if;
 v_net:=round(p_subtotal-p_discount,2);
 v_tax:=round((v_net+case when p_tax_delivery then p_delivery else 0 end)*case when p_included then 18::numeric/118 else 0.18 end,2);
 v_total:=round(v_net+p_delivery+case when p_included then 0 else v_tax end,2);
 return jsonb_build_object('subtotal',p_subtotal,'discountTotal',p_discount,'taxTotal',v_tax,'deliveryTotal',p_delivery,'total',v_total,'taxIncluded',p_included);
end; $$;

create or replace function public.calculate_order_charges(p_business_id uuid,p_dealer_id uuid,p_subtotal numeric)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare c jsonb;
begin
 select config into c from public.business_checkout_policies where business_id=p_business_id;
 if c is null then return jsonb_build_object('ready',false); end if;
 -- Cart is only an undiscounted estimate; selected terms are quoted at checkout.
 return public.checkout_amounts(p_subtotal,0,(c->>'deliveryFee')::numeric,c->>'taxMode'='included',(c->>'taxDelivery')::boolean)||jsonb_build_object('ready',true);
end; $$;

create or replace function public.build_actor_cart_quote(p_actor_id uuid, p_cart_id uuid)
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
    'deliveryTotal', v_delivery, 'total', v_total, 'taxIncluded', coalesce((v_charges->>'taxIncluded')::boolean,false)
  );
  return v_result || jsonb_build_object('fingerprint', md5(v_result::text));
end;
$$;


create function public.build_checkout_quote(p_actor_id uuid,p_cart_id uuid,p_plan text,p_address jsonb)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare q jsonb; c jsonb; rev bigint; b uuid; d uuid; suggestion jsonb; discount numeric:=0; potential numeric:=0; amt jsonb; potential_amt jsonb; result jsonb; valid_address boolean;
begin
 if p_plan is null or p_plan not in ('advance50','credit30','credit60','credit90') then raise exception 'Select payment terms'; end if;
 q:=public.build_actor_cart_quote(p_actor_id,p_cart_id);
 select business_id,dealer_id into b,d from public.carts where id=p_cart_id;
 select config,revision into c,rev from public.business_checkout_policies where business_id=b;
 select case when c->>'addressSource'='manufacturer' then jsonb_build_object('name',bu.company_name,'phone',coalesce(bu.contact_phone,''),'address',coalesce(bu.address,'')) else jsonb_build_object('name',dp.company_name,'phone',coalesce(dp.contact_phone,''),'address',coalesce(dp.address,'')) end
 into suggestion from public.businesses bu join public.dealer_profiles dp on dp.user_id=d where bu.id=b;
 if c is not null then
  if p_plan='advance50' then potential:=round((q->>'subtotal')::numeric*0.05*case when c->>'advanceBase'='advance' then 0.5 else 1 end,2);
  elsif p_plan='credit30' then potential:=round((q->>'subtotal')::numeric*0.10,2);if c->>'credit30Timing'='selection' then discount:=potential;end if;end if;
  amt:=public.checkout_amounts((q->>'subtotal')::numeric,discount,(c->>'deliveryFee')::numeric,c->>'taxMode'='included',(c->>'taxDelivery')::boolean);
  potential_amt:=public.checkout_amounts((q->>'subtotal')::numeric,potential,(c->>'deliveryFee')::numeric,c->>'taxMode'='included',(c->>'taxDelivery')::boolean);
 end if;
 valid_address:=p_address is not null and jsonb_typeof(p_address)='object' and length(trim(coalesce(p_address->>'name',''))) between 1 and 200 and length(trim(coalesce(p_address->>'phone',''))) between 6 and 40 and length(trim(coalesce(p_address->>'address',''))) between 5 and 2000;
 result:=q||coalesce(amt,'{}'::jsonb)||jsonb_build_object('pricingReady',c is not null,'canSubmit',c is not null and valid_address and jsonb_array_length(q->'items')>0 and not exists(select 1 from jsonb_array_elements(q->'items') x where not (x->>'isOrderable')::boolean),'plan',p_plan,'policy',c,'policyRevision',rev,'shippingAddress',p_address,'suggestedAddress',suggestion,'potentialDiscount',potential,'potentialTotal',(potential_amt->>'total')::numeric,'advanceRequired',case when p_plan='advance50' then round((potential_amt->>'total')::numeric/2,2) else 0 end);
 return result||jsonb_build_object('fingerprint',md5(result::text));
end; $$;

create function public.get_checkout_quote(p_store_id uuid,p_plan text,p_address jsonb default null,p_dealer_id uuid default null)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare d uuid:=coalesce(p_dealer_id,auth.uid()); cid uuid;
begin
 if not public.actor_can_order(auth.uid(),p_store_id,d) then raise exception 'Store access unavailable' using errcode='42501';end if;
 select id into cid from public.carts where store_id=p_store_id and dealer_id=d and created_by=auth.uid();
 if cid is null then raise exception 'Cart is empty';end if;
 return public.build_checkout_quote(auth.uid(),cid,p_plan,p_address);
end; $$;

create function public.recalculate_checkout_order(p_order_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare o public.orders%rowtype; x public.order_checkout_details%rowtype; paid numeric; potential numeric; disc numeric:=0; target jsonb; final_amounts jsonb; crossed timestamptz;
begin
 select * into o from public.orders where id=p_order_id for update;
 select * into x from public.order_checkout_details where order_id=p_order_id for update;if not found then return;end if;
 select coalesce(sum(amount),0) into paid from public.order_payment_receipts where order_id=p_order_id;
 potential:=(x.initial_quote->>'potentialDiscount')::numeric;
 target:=public.checkout_amounts(o.subtotal,potential,o.delivery_total,o.price_includes_tax,(x.policy->>'taxDelivery')::boolean);
 if x.plan='advance50' and paid>0 and paid>=round((target->>'total')::numeric/2,2) then disc:=potential;
 elsif x.plan='credit30' then
  if x.policy->>'credit30Timing'='selection' then disc:=potential;
  elsif x.due_at is not null then
   select min(t.received_at) into crossed from (select received_at,sum(amount) over(order by received_at,id rows unbounded preceding) as cumulative from public.order_payment_receipts where order_id=p_order_id) t where cumulative>=(target->>'total')::numeric;
   if crossed is not null and crossed<=x.due_at then disc:=potential;end if;
  end if;
 end if;
 final_amounts:=public.checkout_amounts(o.subtotal,disc,o.delivery_total,o.price_includes_tax,(x.policy->>'taxDelivery')::boolean);
 update public.orders set discount_total=disc,tax_total=(final_amounts->>'taxTotal')::numeric,grand_total=(final_amounts->>'total')::numeric,updated_at=now() where id=p_order_id;
 update public.order_checkout_details set paid_total=paid,earned_discount=disc where order_id=p_order_id;
end; $$;

create function public.apply_checkout_inventory(p_order_id uuid,p_event text)
returns void language plpgsql security definer set search_path='' as $$
declare x public.order_checkout_details%rowtype; it record; ids uuid[]:='{}';
begin
 select * into x from public.order_checkout_details where order_id=p_order_id for update;
 if not found then raise exception 'Legacy order needs an explicit inventory review';end if;
 perform v.id from public.product_variants v join public.order_items i on i.variant_id=v.id where i.order_id=p_order_id order by v.id for update of v;
 if p_event in ('rejected','cancelled') and x.stock_done then
  for it in select * from public.order_items where order_id=p_order_id and variant_id=any(x.deducted_variants) loop
   -- Tracked inventory must not silently become untracked before restoration.
   update public.product_variants set stock_quantity=stock_quantity+it.quantity where id=it.variant_id and stock_quantity is not null;
   if not found then raise exception 'Inventory tracking changed; review stock before rejecting';end if;
  end loop;
  update public.order_checkout_details set stock_done=false,deducted_variants='{}' where order_id=p_order_id;
 elsif not x.stock_done and p_event=(case x.policy->>'stockPoint' when 'placement' then 'placement' when 'confirmation' then 'confirmed' else 'dispatched' end) then
  for it in select i.variant_id,i.quantity from public.order_items i where i.order_id=p_order_id order by i.variant_id loop
   if exists(select 1 from public.product_variants where id=it.variant_id and stock_quantity is not null) then
    update public.product_variants set stock_quantity=stock_quantity-it.quantity where id=it.variant_id and stock_quantity>=it.quantity;
    if not found then raise exception 'Insufficient stock; order status was not changed';end if;
    ids:=array_append(ids,it.variant_id);
   end if;
  end loop;
  update public.order_checkout_details set stock_done=true,deducted_variants=ids where order_id=p_order_id;
 end if;
end; $$;
create or replace function public.apply_confirmed_order_stock_policy(p_order_id uuid)
returns void language plpgsql security definer set search_path='' as $$ begin perform public.apply_checkout_inventory(p_order_id,'placement');end; $$;
create or replace function public.apply_order_status_stock_policy(p_order_id uuid,p_previous_status text,p_next_status text)
returns void language plpgsql security definer set search_path='' as $$
declare c jsonb; days integer;
begin
 perform public.apply_checkout_inventory(p_order_id,p_next_status);
 if p_next_status='delivered' then
  select policy into c from public.order_checkout_details where order_id=p_order_id;
  if c->>'creditStart'='delivery' then
   select case plan when 'advance50' then (c->>'advanceBalanceDays')::integer when 'credit30' then 30 when 'credit60' then 60 else 90 end into days from public.order_checkout_details where order_id=p_order_id;
   update public.order_checkout_details set due_at=coalesce(due_at,now()+make_interval(days=>days)) where order_id=p_order_id;
   perform public.recalculate_checkout_order(p_order_id);
  end if;
 end if;
end; $$;
create or replace function public.order_status_policy_ready(p_business_id uuid)
returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.business_checkout_policies where business_id=p_business_id); $$;
create function public.submit_order_checkout(
  p_actor_id uuid, p_cart_id uuid, p_idempotency_key uuid, p_expected_fingerprint text,p_plan text,p_address jsonb
)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  v_cart public.carts%rowtype;
  v_existing public.orders%rowtype;
  v_order public.orders%rowtype;
  v_business_id uuid; v_quote jsonb; c jsonb; days integer;
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

  perform 1 from public.business_checkout_policies where business_id=v_business_id for update;
  -- Deterministic locking across all variants/products in this cart.
  perform v.id from public.product_variants v join public.cart_items ci on ci.variant_id = v.id
    where ci.cart_id = p_cart_id order by v.id for update of v;
  perform p.id from public.products p
    where p.id in (select v.product_id from public.product_variants v join public.cart_items ci on ci.variant_id = v.id where ci.cart_id = p_cart_id)
    order by p.id for update of p;
  v_quote := public.build_checkout_quote(p_actor_id,p_cart_id,p_plan,p_address);
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
    subtotal, discount_total, tax_total, delivery_total, grand_total,price_includes_tax
  ) values (
    v_cart.business_id, v_cart.store_id, v_cart.dealer_id, p_actor_id,
    case when p_actor_id <> v_cart.dealer_id then p_actor_id else null end,
    p_idempotency_key, p_cart_id, p_expected_fingerprint, 'pending',
    (v_quote ->> 'subtotal')::numeric, (v_quote ->> 'discountTotal')::numeric,
    (v_quote ->> 'taxTotal')::numeric, (v_quote ->> 'deliveryTotal')::numeric,
    (v_quote ->> 'total')::numeric,coalesce((v_quote->>'taxIncluded')::boolean,false)
  ) returning * into v_order;

  insert into public.order_items (
    order_id, store_id, variant_id, product_name, variant_name, sku, unit,
    pack_size, unit_price, quantity, moq_snapshot, quantity_step_snapshot, line_total
  ) select v_order.id, v_cart.store_id, v.id, p.name, v.name, v.sku, p.unit,
    v.pack_size, v.wholesale_price, ci.quantity, v.moq, v.quantity_step,
    v.wholesale_price * ci.quantity
  from public.cart_items ci join public.product_variants v on v.id = ci.variant_id
  join public.products p on p.id = v.product_id where ci.cart_id = p_cart_id;

  c:=v_quote->'policy';
  days:=case p_plan when 'advance50' then (c->>'advanceBalanceDays')::integer when 'credit30' then 30 when 'credit60' then 60 else 90 end;
  insert into public.order_checkout_details(order_id,business_id,plan,shipping_address,policy,initial_quote,due_at,earned_discount)
  values(v_order.id,v_business_id,p_plan,p_address,c,v_quote,case when c->>'creditStart'='order' then v_order.created_at+make_interval(days=>days) else null end,(v_quote->>'discountTotal')::numeric);
  perform public.apply_confirmed_order_stock_policy(v_order.id);
  insert into public.order_status_history (order_id, previous_status, new_status, changed_by)
  values (v_order.id, null, 'pending', p_actor_id);
  delete from public.cart_items where cart_id = p_cart_id;
  update public.carts set updated_at = now() where id = p_cart_id;
  return jsonb_build_object('orderId', v_order.id, 'orderNumber', v_order.order_number, 'alreadySubmitted', false);
end;
$$;


create function public.checkout_payment_due(p_order_id uuid)
returns numeric language plpgsql stable security definer set search_path='' as $$
declare o public.orders%rowtype; x public.order_checkout_details%rowtype; desired numeric; target jsonb;
begin
 select * into o from public.orders where id=p_order_id;
 select * into x from public.order_checkout_details where order_id=p_order_id;if not found then return 0;end if;
 if o.status in ('rejected','cancelled') then return 0;end if;
 desired:=o.grand_total;
 if x.plan='advance50' and x.paid_total<(x.initial_quote->>'advanceRequired')::numeric then desired:=(x.initial_quote->>'advanceRequired')::numeric;
 elsif x.plan='credit30' and x.policy->>'credit30Timing'='settlement' and x.due_at is not null and now()<=x.due_at then
  target:=public.checkout_amounts(o.subtotal,(x.initial_quote->>'potentialDiscount')::numeric,o.delivery_total,o.price_includes_tax,(x.policy->>'taxDelivery')::boolean);desired:=(target->>'total')::numeric;
 end if;
 return greatest(round(desired-x.paid_total,2),0);
end; $$;

create function public.get_checkout_order_details(p_order_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if not public.can_view_order(p_order_id) then raise exception 'Order access unavailable' using errcode='42501';end if;
 select to_jsonb(x)||jsonb_build_object('testMode',x.policy->>'paymentMode'='test','nextPayment',public.checkout_payment_due(o.id),'taxIncluded',o.price_includes_tax,'total',o.grand_total,'remaining',case when o.status in ('rejected','cancelled') then 0 else greatest(o.grand_total-x.paid_total,0) end,'creditBalance',case when o.status in ('rejected','cancelled') then x.paid_total else greatest(x.paid_total-o.grand_total,0) end,'receipts',coalesce((select jsonb_agg(jsonb_build_object('id',r.id,'amount',r.amount,'reference',r.reference,'isTest',r.is_test,'receivedAt',r.received_at) order by r.received_at,r.id) from public.order_payment_receipts r where r.order_id=o.id),'[]'::jsonb))
 into result from public.order_checkout_details x join public.orders o on o.id=x.order_id where x.order_id=p_order_id;
 return result;
end; $$;

create function public.record_order_receipt(p_order_id uuid,p_request_key uuid,p_amount numeric,p_reference text,p_received_at timestamptz)
returns jsonb language plpgsql security definer set search_path='' as $$
declare o public.orders%rowtype; prev public.order_payment_receipts%rowtype;
begin
 select * into o from public.orders where id=p_order_id for update;
 if not found or not public.can_manage_business(o.business_id) then raise exception 'Business administrator required' using errcode='42501';end if;
 if o.status in ('rejected','cancelled') then raise exception 'Do not post a receipt against a rejected/cancelled order';end if;
 if not exists(select 1 from public.order_checkout_details where order_id=p_order_id) then raise exception 'Legacy order has no checkout terms';end if;
 if exists(select 1 from public.order_checkout_details where order_id=p_order_id and policy->>'paymentMode'='test') then raise exception 'Use verified Razorpay test payment for this test-mode order';end if;
 if p_request_key is null or p_amount is null or p_amount<=0 or p_amount>999999999999.99 or p_amount<>round(p_amount,2) or p_amount::text in ('NaN','Infinity','-Infinity') or length(trim(coalesce(p_reference,''))) not between 1 and 200 or p_received_at is null or p_received_at>now() or p_received_at<o.created_at then raise exception 'Check receipt amount, reference and received date';end if;
 select * into prev from public.order_payment_receipts where actor_id=auth.uid() and request_key=p_request_key;
 if found then
  if prev.order_id<>p_order_id or prev.amount<>p_amount or prev.reference<>trim(p_reference) or prev.received_at<>p_received_at then raise exception 'Receipt retry key was reused with different data';end if;
  return public.get_checkout_order_details(p_order_id);
 end if;
 insert into public.order_payment_receipts(order_id,business_id,actor_id,request_key,amount,reference,received_at) values(p_order_id,o.business_id,auth.uid(),p_request_key,p_amount,trim(p_reference),p_received_at);
 perform public.recalculate_checkout_order(p_order_id);
 return public.get_checkout_order_details(p_order_id);
end; $$;

create function public.save_order_shipment(p_order_id uuid,p_expected_updated_at timestamptz,p_carrier text,p_awb text,p_url text)
returns void language plpgsql security definer set search_path='' as $$
declare o public.orders%rowtype; x public.order_checkout_details%rowtype;
begin
 select * into o from public.orders where id=p_order_id for update;
 if not found or not public.can_manage_business(o.business_id) then raise exception 'Business administrator required' using errcode='42501';end if;
 select * into x from public.order_checkout_details where order_id=p_order_id for update;
 if not found then raise exception 'Legacy order has no shipment record';end if;
 if x.shipping_updated_at is distinct from p_expected_updated_at then raise exception 'Shipment changed; reload before saving';end if;
 if length(coalesce(p_carrier,''))>150 or length(coalesce(p_awb,''))>150 or length(coalesce(p_url,''))>2000 or (nullif(trim(p_url),'') is not null and p_url !~ '^https://[^[:space:]]+$') then raise exception 'Use a valid HTTPS tracking URL';end if;
 update public.order_checkout_details set carrier=nullif(trim(p_carrier),''),awb=nullif(trim(p_awb),''),tracking_url=nullif(trim(p_url),''),shipping_updated_at=clock_timestamp() where order_id=p_order_id;
end; $$;
create or replace function public.get_order_workspace(p_order_id uuid)
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
      'taxIncluded',o.price_includes_tax,'subtotal', o.subtotal, 'discountTotal', o.discount_total,
      'taxTotal', o.tax_total, 'deliveryTotal', o.delivery_total,
      'total', o.grand_total, 'createdAt', o.created_at, 'updatedAt', o.updated_at
    ),
    'canManage', public.can_manage_business(o.business_id),
    'statusUpdatesReady', public.can_manage_business(o.business_id)
      and exists(select 1 from public.order_checkout_details where order_id=o.id),
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
create or replace function public.get_actor_order_confirmation(p_order_id uuid)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare v_result jsonb;
begin
  select jsonb_build_object(
    'orderId', o.id, 'orderNumber', o.order_number, 'status', o.status,
    'storeName', s.name, 'businessName', b.company_name,
    'taxIncluded',o.price_includes_tax,'subtotal', o.subtotal, 'discountTotal', o.discount_total,
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

revoke execute on function public.submit_cart_order(uuid,uuid,uuid,text) from service_role;
revoke all on function public.checkout_amounts(numeric,numeric,numeric,boolean,boolean) from public,anon,authenticated;
grant execute on function public.checkout_amounts(numeric,numeric,numeric,boolean,boolean) to service_role;
revoke all on function public.build_checkout_quote(uuid,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.build_checkout_quote(uuid,uuid,text,jsonb) to service_role;
revoke all on function public.recalculate_checkout_order(uuid) from public,anon,authenticated;
grant execute on function public.recalculate_checkout_order(uuid) to service_role;
revoke all on function public.apply_checkout_inventory(uuid,text) from public,anon,authenticated;
grant execute on function public.apply_checkout_inventory(uuid,text) to service_role;
revoke all on function public.submit_order_checkout(uuid,uuid,uuid,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.submit_order_checkout(uuid,uuid,uuid,text,text,jsonb) to service_role;
revoke all on function public.save_checkout_policy(uuid,bigint,jsonb) from public,anon;
grant execute on function public.save_checkout_policy(uuid,bigint,jsonb) to authenticated;
revoke all on function public.get_checkout_quote(uuid,text,jsonb,uuid) from public,anon;
grant execute on function public.get_checkout_quote(uuid,text,jsonb,uuid) to authenticated;
revoke all on function public.get_checkout_order_details(uuid) from public,anon;
grant execute on function public.get_checkout_order_details(uuid) to authenticated;
revoke all on function public.record_order_receipt(uuid,uuid,numeric,text,timestamptz) from public,anon;
grant execute on function public.record_order_receipt(uuid,uuid,numeric,text,timestamptz) to authenticated;
revoke all on function public.save_order_shipment(uuid,timestamptz,text,text,text) from public,anon;
grant execute on function public.save_order_shipment(uuid,timestamptz,text,text,text) to authenticated;

create table public.checkout_test_payment_attempts(
 id uuid primary key default gen_random_uuid(),order_id uuid not null references public.orders(id),actor_id uuid not null references public.profiles(id),
 request_key uuid not null,amount_paise bigint not null check(amount_paise>0),status text not null default 'created' check(status in ('created','authorized','captured','failed')),
 razorpay_order_id text unique,razorpay_payment_id text unique,created_at timestamptz not null default now(),unique(actor_id,request_key)
);
create index checkout_attempts_order_state_idx on public.checkout_test_payment_attempts(order_id,status,created_at);
alter table public.checkout_test_payment_attempts enable row level security;
revoke all on public.checkout_test_payment_attempts from public,anon,authenticated;
grant select on public.checkout_test_payment_attempts to authenticated;
create policy checkout_test_attempt_read on public.checkout_test_payment_attempts for select to authenticated using(actor_id=auth.uid() and public.can_view_order(order_id));

create function public.prepare_checkout_test_payment(p_actor_id uuid,p_order_id uuid,p_request_key uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare o public.orders%rowtype;x public.order_checkout_details%rowtype;a public.checkout_test_payment_attempts%rowtype;amount numeric;
begin
 select * into o from public.orders where id=p_order_id for update;
 if not found or not public.actor_can_order(p_actor_id,o.store_id,o.dealer_id) then raise exception 'Order payment access unavailable' using errcode='42501';end if;
 select * into x from public.order_checkout_details where order_id=p_order_id;
 if not found or x.policy->>'paymentMode'<>'test' or o.status in ('rejected','cancelled') then raise exception 'Test payment is unavailable for this order';end if;
 if p_request_key is null then raise exception 'Request key required';end if;
 select * into a from public.checkout_test_payment_attempts where actor_id=p_actor_id and request_key=p_request_key;
 if found then
  if a.order_id<>p_order_id then raise exception 'Payment request key reused';end if;
  if a.status='failed' then raise exception 'Previous attempt failed; start a fresh request';end if;
  return to_jsonb(a)||jsonb_build_object('isNew',false);
 end if;
 select * into a from public.checkout_test_payment_attempts where order_id=p_order_id and status in ('created','authorized') order by created_at limit 1;
 if found then
  if a.actor_id<>p_actor_id then raise exception 'Another payment is awaiting verification. Ask the account that initiated it to verify it.';end if;
  return to_jsonb(a)||jsonb_build_object('isNew',false);
 end if;
 amount:=public.checkout_payment_due(p_order_id);
 if amount<=0 then raise exception 'No payment is due';end if;
 insert into public.checkout_test_payment_attempts(order_id,actor_id,request_key,amount_paise) values(p_order_id,p_actor_id,p_request_key,round(amount*100)::bigint) returning * into a;
 return to_jsonb(a)||jsonb_build_object('isNew',true);
end; $$;
create function public.settle_checkout_test_payment(p_actor_id uuid,p_attempt_id uuid,p_razorpay_payment_id text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.checkout_test_payment_attempts%rowtype;o public.orders%rowtype;oid uuid;
begin
 select order_id into oid from public.checkout_test_payment_attempts where id=p_attempt_id;
 select * into o from public.orders where id=oid for update;
 select * into a from public.checkout_test_payment_attempts where id=p_attempt_id for update;
 if not found or a.actor_id<>p_actor_id then raise exception 'Payment access unavailable' using errcode='42501';end if;
 if a.status='captured' then
  if a.razorpay_payment_id is distinct from p_razorpay_payment_id then raise exception 'Payment mismatch';end if;
  return jsonb_build_object('success',true,'alreadySettled',true);
 end if;
 if a.status='failed' or a.razorpay_order_id is null or not exists(select 1 from public.order_checkout_details where order_id=o.id and policy->>'paymentMode'='test') then raise exception 'Payment is not settleable';end if;
 if p_razorpay_payment_id !~ '^pay_[a-zA-Z0-9]+$' then raise exception 'Invalid payment ID';end if;
 insert into public.order_payment_receipts(order_id,business_id,actor_id,request_key,amount,reference,received_at,is_test)
 values(o.id,o.business_id,p_actor_id,a.id,a.amount_paise::numeric/100,'rzp_test:'||p_razorpay_payment_id,now(),true);
 update public.checkout_test_payment_attempts set status='captured',razorpay_payment_id=p_razorpay_payment_id where id=a.id;
 perform public.recalculate_checkout_order(o.id);
 return jsonb_build_object('success',true,'alreadySettled',false);
end; $$;
revoke all on function public.checkout_payment_due(uuid),public.prepare_checkout_test_payment(uuid,uuid,uuid),public.settle_checkout_test_payment(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.checkout_payment_due(uuid),public.prepare_checkout_test_payment(uuid,uuid,uuid),public.settle_checkout_test_payment(uuid,uuid,text) to service_role;
commit;

