begin;

create function public.get_assignment_options(
  p_business_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_people jsonb;
  v_dealers jsonb;
begin
  if not public.can_manage_business(p_business_id) then
    raise exception 'Business administrator access required';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'userId', m.user_id,
        'name', p.full_name
      )
      order by p.full_name, m.user_id
    ),
    '[]'::jsonb
  )
  into v_people
  from public.business_memberships m
  join public.profiles p on p.id = m.user_id
  where m.business_id = p_business_id
    and m.role = 'salesperson'
    and m.status = 'active';

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'userId', d.user_id,
        'companyName', d.company_name
      )
      order by d.company_name, d.user_id
    ),
    '[]'::jsonb
  )
  into v_dealers
  from public.dealer_profiles d
  where exists (
    select 1
    from public.dealer_store_access a
    where a.business_id = p_business_id
      and a.dealer_id = d.user_id
      and a.status = 'active'
  );

  return jsonb_build_object(
    'salespeople', v_people,
    'dealers', v_dealers
  );
end;
$$;

create function public.get_salesperson_workspace(
  p_business_id uuid,
  p_salesperson_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_person jsonb;
  v_assignments jsonb;
  v_order_count bigint;
begin
  if not public.can_manage_business(p_business_id) then
    raise exception 'Business administrator access required';
  end if;

  select jsonb_build_object(
    'userId', m.user_id,
    'name', p.full_name,
    'phone', p.phone,
    'status', m.status,
    'createdAt', m.created_at
  )
  into v_person
  from public.business_memberships m
  join public.profiles p on p.id = m.user_id
  where m.business_id = p_business_id
    and m.user_id = p_salesperson_id
    and m.role = 'salesperson';

  if not found then
    raise exception 'Salesperson unavailable';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', a.id,
        'dealerId', a.dealer_id,
        'companyName', d.company_name,
        'isActive', a.is_active,
        'hasStoreAccess', exists (
          select 1
          from public.dealer_store_access x
          where x.business_id = p_business_id
            and x.dealer_id = a.dealer_id
            and x.status = 'active'
        )
      )
      order by d.company_name, a.id
    ),
    '[]'::jsonb
  )
  into v_assignments
  from public.salesperson_dealer_assignments a
  join public.dealer_profiles d
    on d.user_id = a.dealer_id
  where a.business_id = p_business_id
    and a.salesperson_id = p_salesperson_id;

  select count(*)
  into v_order_count
  from public.orders
  where business_id = p_business_id
    and salesperson_id = p_salesperson_id;

  return jsonb_build_object(
    'person', v_person,
    'assignments', v_assignments,
    'orderCount', v_order_count
  );
end;
$$;

create function public.revoke_business_invitation(
  p_actor_id uuid,
  p_business_id uuid,
  p_invitation_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inv public.invitations%rowtype;
begin
  perform 1
  from public.businesses
  where id = p_business_id
    and status = 'active'
  for update;

  if not found then
    raise exception 'Business unavailable';
  end if;

  if not exists (
    select 1
    from public.business_memberships
    where business_id = p_business_id
      and user_id = p_actor_id
      and role = 'business_admin'
      and status = 'active'
  ) then
    raise exception 'Business administrator access required';
  end if;

  select *
  into v_inv
  from public.invitations
  where id = p_invitation_id
    and business_id = p_business_id
  for update;

  if not found then
    raise exception 'Invitation unavailable';
  end if;

  if v_inv.status = 'revoked' then
    return;
  end if;

  if v_inv.status <> 'pending' then
    raise exception 'Only pending invitations can be revoked';
  end if;

  update public.invitations
  set status = case
    when expires_at <= now() then 'expired'
    else 'revoked'
  end
  where id = v_inv.id;
end;
$$;

revoke all on function
  public.get_assignment_options(uuid)
from public, anon;

revoke all on function
  public.get_salesperson_workspace(uuid, uuid)
from public, anon;

grant execute on function
  public.get_assignment_options(uuid)
to authenticated;

grant execute on function
  public.get_salesperson_workspace(uuid, uuid)
to authenticated;

revoke all on function
  public.revoke_business_invitation(uuid, uuid, uuid)
from public, anon, authenticated;

grant execute on function
  public.revoke_business_invitation(uuid, uuid, uuid)
to service_role;

commit;