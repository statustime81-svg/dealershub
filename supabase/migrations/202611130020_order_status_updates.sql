begin;
alter table public.order_status_history add column request_key uuid;
alter table public.order_status_history add column request_expected_updated_at timestamptz;
create unique index order_status_request_unique
on public.order_status_history(order_id, request_key)
where request_key is not null;

-- Implement stock reservation, dispatch deduction and rejection restoration
-- only after the business approves the lifecycle. No default no-op is supplied.
create function public.apply_order_status_stock_policy(
  p_order_id uuid, p_previous_status text, p_next_status text
)
returns void language plpgsql security definer set search_path = ''
as $$ begin raise exception 'DH_STATUS_STOCK_POLICY_NOT_CONFIGURED'; end; $$;

create function public.change_manufacturer_order_status(
  p_actor_id uuid, p_order_id uuid, p_expected_status text,
  p_expected_updated_at timestamptz, p_new_status text,
  p_request_key uuid, p_note text default null
)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  v_business_id uuid; v_order public.orders%rowtype;
  v_previous public.order_status_history%rowtype;
  v_note text := nullif(trim(p_note), '');
begin
  if p_actor_id is null or p_request_key is null or p_expected_updated_at is null
    or p_expected_status is null or p_new_status is null
    or length(coalesce(p_note, '')) > 2000 then raise exception 'Invalid status request'; end if;
  select business_id into v_business_id from public.orders where id = p_order_id;
  perform 1 from public.businesses where id = v_business_id and status = 'active' for update;
  if not found then raise exception using errcode = '42501', message = 'Business unavailable'; end if;
  if not exists (
    select 1 from public.business_memberships
    where business_id = v_business_id and user_id = p_actor_id
      and role = 'business_admin' and status = 'active'
  ) then raise exception using errcode = '42501', message = 'Business administrator access required'; end if;
  perform 1 from public.stores where id = (select store_id from public.orders where id = p_order_id) for update;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Order unavailable'; end if;

  select * into v_previous from public.order_status_history
  where order_id = p_order_id and request_key = p_request_key;
  if found then
    if v_previous.changed_by is distinct from p_actor_id
      or v_previous.previous_status is distinct from p_expected_status
      or v_previous.new_status is distinct from p_new_status
      or v_previous.note is distinct from v_note
      or v_previous.request_expected_updated_at is distinct from p_expected_updated_at
    then raise exception 'Status request key was reused with different information'; end if;
    return jsonb_build_object('orderId', v_order.id, 'status', v_order.status, 'alreadyUpdated', true);
  end if;

  if v_order.status <> p_expected_status or v_order.updated_at <> p_expected_updated_at then
    raise exception 'Order changed. Refresh before updating';
  end if;
  if not (p_new_status = any(public.known_order_transitions(v_order.status))) then
    raise exception 'This status transition is not permitted';
  end if;
  if not public.order_status_policy_ready(v_business_id) then
    raise exception 'DH_STATUS_STOCK_POLICY_NOT_CONFIGURED';
  end if;
  perform public.apply_order_status_stock_policy(p_order_id, v_order.status, p_new_status);
  update public.orders set status = p_new_status, updated_at = now() where id = p_order_id;
  insert into public.order_status_history (
    order_id, previous_status, new_status, changed_by, note,
    request_key, request_expected_updated_at
  ) values (
    p_order_id, v_order.status, p_new_status, p_actor_id, v_note,
    p_request_key, p_expected_updated_at
  );
  return jsonb_build_object('orderId', p_order_id, 'status', p_new_status, 'alreadyUpdated', false);
end;
$$;
revoke all on function public.apply_order_status_stock_policy(uuid,text,text),
  public.change_manufacturer_order_status(uuid,uuid,text,timestamptz,text,uuid,text)
from public, anon, authenticated;
grant execute on function public.apply_order_status_stock_policy(uuid,text,text),
  public.change_manufacturer_order_status(uuid,uuid,text,timestamptz,text,uuid,text)
to service_role;
commit;
