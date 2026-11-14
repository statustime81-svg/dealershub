begin;

create function public.accept_business_invitation(
  p_user_id uuid,
  p_invitation_id uuid,
  p_company_name text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text;
  v_confirmed_at timestamptz;
  v_inv public.invitations%rowtype;
  v_business_status text;
  v_existing_role text;
begin
  select lower(email), email_confirmed_at
  into v_email, v_confirmed_at
  from auth.users
  where id = p_user_id;

  if v_email is null or v_confirmed_at is null then
    raise exception 'A verified account is required';
  end if;

  -- Lock business first for consistent access-operation ordering.
  select b.status
  into v_business_status
  from public.businesses b
  join public.invitations i
    on i.business_id = b.id
  where i.id = p_invitation_id
  for update of b;

  if not found or v_business_status <> 'active' then
    raise exception 'Invitation is unavailable';
  end if;

  select *
  into v_inv
  from public.invitations
  where id = p_invitation_id
  for update;

  if v_inv.email <> v_email then
    raise exception 'Invitation belongs to another account';
  end if;

  if v_inv.invited_user_id is not null
    and v_inv.invited_user_id <> p_user_id
  then
    raise exception 'Invitation belongs to another account';
  end if;

  if v_inv.status = 'accepted' then
    return jsonb_build_object(
      'invitationId', v_inv.id,
      'role', v_inv.target_role,
      'alreadyAccepted', true
    );
  end if;

  if v_inv.status <> 'pending'
    or v_inv.expires_at <= now()
  then
    raise exception 'Invitation is expired or unavailable';
  end if;

  if v_inv.target_role = 'dealer' then
    if not exists (
      select 1
      from public.stores s
      where s.id = v_inv.store_id
        and s.business_id = v_inv.business_id
    ) then
      raise exception 'Invitation store is unavailable';
    end if;

    if not exists (
      select 1
      from public.dealer_profiles
      where user_id = p_user_id
    ) then
      if nullif(trim(p_company_name), '') is null
        or length(trim(p_company_name)) > 200
      then
        raise exception 'Enter a valid dealer company name';
      end if;

      insert into public.dealer_profiles (
        user_id,
        company_name
      )
      values (
        p_user_id,
        trim(p_company_name)
      )
      on conflict (user_id) do nothing;
    end if;

    insert into public.dealer_store_access (
      business_id,
      store_id,
      dealer_id,
      status
    )
    values (
      v_inv.business_id,
      v_inv.store_id,
      p_user_id,
      'active'
    )
    on conflict (store_id, dealer_id)
    do update set status = 'active';

  elsif v_inv.target_role = 'salesperson' then
    select role
    into v_existing_role
    from public.business_memberships
    where business_id = v_inv.business_id
      and user_id = p_user_id
    for update;

    if found and v_existing_role <> 'salesperson' then
      raise exception 'An existing business role cannot be replaced';
    end if;

    insert into public.business_memberships (
      business_id,
      user_id,
      role,
      status
    )
    values (
      v_inv.business_id,
      p_user_id,
      'salesperson',
      'active'
    )
    on conflict (business_id, user_id)
    do update set status = 'active';
  else
    raise exception 'Invalid invitation role';
  end if;

  update public.invitations
  set
    status = 'accepted',
    invited_user_id = p_user_id
  where id = v_inv.id;

  return jsonb_build_object(
    'invitationId', v_inv.id,
    'role', v_inv.target_role,
    'alreadyAccepted', false
  );
end;
$$;

create function public.manage_dealer_store_access(
  p_actor_id uuid,
  p_business_id uuid,
  p_store_id uuid,
  p_dealer_id uuid,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform 1
  from public.businesses
  where id = p_business_id
    and status = 'active'
  for update;

  if not found then
    raise exception 'Business is unavailable';
  end if;

  if not exists (
    select 1
    from public.business_memberships
    where business_id = p_business_id
      and user_id = p_actor_id
      and role = 'business_admin'
      and status = 'active'
  ) then
    raise exception 'Business administrator access is required';
  end if;

  if p_status not in ('active', 'rejected', 'inactive') then
    raise exception 'Invalid access status';
  end if;

  update public.dealer_store_access
  set status = p_status
  where business_id = p_business_id
    and store_id = p_store_id
    and dealer_id = p_dealer_id;

  if not found then
    raise exception 'Dealer access record not found';
  end if;

  -- Prevent a pending invitation from restoring revoked access.
  if p_status in ('inactive', 'rejected') then
    update public.invitations i
    set status = 'revoked'
    where i.business_id = p_business_id
      and i.store_id = p_store_id
      and i.target_role = 'dealer'
      and i.status = 'pending'
      and (
        i.invited_user_id = p_dealer_id
        or i.email = (
          select lower(u.email)
          from auth.users u
          where u.id = p_dealer_id
        )
      );
  end if;
end;
$$;

create function public.set_salesperson_assignment(
  p_actor_id uuid,
  p_business_id uuid,
  p_salesperson_id uuid,
  p_dealer_id uuid,
  p_active boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform 1
  from public.businesses
  where id = p_business_id
    and status = 'active'
  for update;

  if not found then
    raise exception 'Business is unavailable';
  end if;

  if not exists (
    select 1
    from public.business_memberships
    where business_id = p_business_id
      and user_id = p_actor_id
      and role = 'business_admin'
      and status = 'active'
  ) then
    raise exception 'Business administrator access is required';
  end if;

  -- Deactivation remains possible after access/membership changes.
  if not p_active then
    update public.salesperson_dealer_assignments
    set is_active = false
    where business_id = p_business_id
      and salesperson_id = p_salesperson_id
      and dealer_id = p_dealer_id;

    return;
  end if;

  if not exists (
    select 1
    from public.business_memberships
    where business_id = p_business_id
      and user_id = p_salesperson_id
      and role = 'salesperson'
      and status = 'active'
  ) then
    raise exception 'Active salesperson membership is required';
  end if;

  if not exists (
    select 1
    from public.dealer_store_access
    where business_id = p_business_id
      and dealer_id = p_dealer_id
      and status = 'active'
  ) then
    raise exception 'Dealer has no active access to this business';
  end if;

  insert into public.salesperson_dealer_assignments (
    business_id,
    salesperson_id,
    dealer_id,
    is_active
  )
  values (
    p_business_id,
    p_salesperson_id,
    p_dealer_id,
    true
  )
  on conflict (
    business_id,
    salesperson_id,
    dealer_id
  )
  do update set is_active = true;
end;
$$;

revoke all on function
  public.accept_business_invitation(uuid, uuid, text)
from public, anon, authenticated;

revoke all on function
  public.manage_dealer_store_access(uuid, uuid, uuid, uuid, text)
from public, anon, authenticated;

revoke all on function
  public.set_salesperson_assignment(uuid, uuid, uuid, uuid, boolean)
from public, anon, authenticated;

grant execute on function
  public.accept_business_invitation(uuid, uuid, text)
to service_role;

grant execute on function
  public.manage_dealer_store_access(uuid, uuid, uuid, uuid, text)
to service_role;

grant execute on function
  public.set_salesperson_assignment(uuid, uuid, uuid, uuid, boolean)
to service_role;

commit;