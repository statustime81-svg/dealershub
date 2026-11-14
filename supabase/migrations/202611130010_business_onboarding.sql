begin;

alter table public.businesses
add column onboarding_key uuid;

create unique index business_onboarding_request_unique
on public.businesses (
  owner_id,
  onboarding_key
)
where onboarding_key is not null;

-- Prevent duplicate open invitations for the same scope.
create unique index invitation_pending_scope_unique
on public.invitations (
  business_id,
  email,
  target_role,
  (
    coalesce(
      store_id,
      '00000000-0000-0000-0000-000000000000'::uuid
    )
  )
)
where status = 'pending';

create function public.onboard_business(
  p_user_id uuid,
  p_request_key uuid,
  p_business_type text,
  p_company_name text,
  p_contact_email text,
  p_contact_phone text,
  p_address text,
  p_gstin text,
  p_category_id uuid,
  p_store_name text,
  p_store_slug text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_business_id uuid;
  v_store_id uuid;
begin
  if p_user_id is null or p_request_key is null then
    raise exception 'User and request key are required';
  end if;

  if p_business_type not in (
    'manufacturer',
    'distributor'
  ) then
    raise exception 'Invalid business type';
  end if;

  if nullif(trim(p_company_name), '') is null
    or nullif(trim(p_store_name), '') is null
    or nullif(trim(p_contact_email), '') is null
  then
    raise exception 'Required details are missing';
  end if;

  -- Serialize retries of the same onboarding request.
  perform pg_advisory_xact_lock(
    hashtextextended(
      p_user_id::text || ':' || p_request_key::text,
      0
    )
  );

  select b.id
  into v_business_id
  from public.businesses b
  where b.owner_id = p_user_id
    and b.onboarding_key = p_request_key;

  if found then
    select s.id
    into v_store_id
    from public.stores s
    where s.business_id = v_business_id
    order by s.created_at, s.id
    limit 1;

    return jsonb_build_object(
      'businessId', v_business_id,
      'storeId', v_store_id,
      'alreadyCreated', true
    );
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.id = p_user_id
  ) then
    raise exception 'User profile not found';
  end if;

  if p_category_id is not null
    and not exists (
      select 1
      from public.business_categories c
      where c.id = p_category_id
        and c.is_active
    )
  then
    raise exception 'Invalid business category';
  end if;

  insert into public.businesses (
    owner_id,
    onboarding_key,
    business_type,
    category_id,
    company_name,
    contact_email,
    contact_phone,
    address,
    gstin
  )
  values (
    p_user_id,
    p_request_key,
    p_business_type,
    p_category_id,
    trim(p_company_name),
    lower(trim(p_contact_email)),
    p_contact_phone,
    p_address,
    p_gstin
  )
  returning id into v_business_id;

  insert into public.business_memberships (
    business_id,
    user_id,
    role,
    status
  )
  values (
    v_business_id,
    p_user_id,
    'business_admin',
    'active'
  );

  insert into public.stores (
    business_id,
    name,
    slug,
    is_published
  )
  values (
    v_business_id,
    trim(p_store_name),
    p_store_slug,
    false
  )
  returning id into v_store_id;

  return jsonb_build_object(
    'businessId', v_business_id,
    'storeId', v_store_id,
    'alreadyCreated', false
  );
end;
$$;

revoke all on function public.onboard_business(
  uuid, uuid, text, text, text, text,
  text, text, uuid, text, text
)
from public, anon, authenticated;

grant execute on function public.onboard_business(
  uuid, uuid, text, text, text, text,
  text, text, uuid, text, text
)
to service_role;

-- Server-only lookup. Never expose this as a public API.
create function public.find_invitation_user(
  p_email text
)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select u.id
  from auth.users u
  where lower(u.email) = lower(trim(p_email))
  limit 1;
$$;

revoke all on function
  public.find_invitation_user(text)
from public, anon, authenticated;

grant execute on function
  public.find_invitation_user(text)
to service_role;

commit;