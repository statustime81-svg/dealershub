begin;

create function public.get_platform_overview()
returns jsonb language plpgsql stable security definer set search_path = ''
as $$ begin
  if not public.is_platform_admin() then raise exception using errcode='42501',message='Platform administrator access required'; end if;
  return jsonb_build_object(
    'businesses', (select count(*) from public.businesses),
    'activeBusinesses', (select count(*) from public.businesses where status='active'),
    'suspendedBusinesses', (select count(*) from public.businesses where status='suspended'),
    'verifiedBusinesses', (select count(*) from public.businesses where verification_status='verified'),
    'users', (select count(*) from auth.users),
    'dealers', (select count(*) from public.dealer_profiles),
    'activeSalespeople', (select count(distinct m.user_id) from public.business_memberships m join public.businesses b on b.id=m.business_id where m.role='salesperson' and m.status='active' and b.status='active'),
    'orders', (select count(*) from public.orders),
    'submittedOrderValue', (select coalesce(sum(grand_total),0) from public.orders),
    'orderStatuses', (select jsonb_agg(jsonb_build_object('status',v.status,'count',(select count(*) from public.orders o where o.status=v.status)) order by v.position)
      from (values ('pending',1),('confirmed',2),('rejected',3),('processing',4),('dispatched',5),('delivered',6),('cancelled',7)) v(status,position))
  );
end; $$;

create function public.get_platform_businesses(
  p_search text default '', p_status text default 'all',
  p_verification text default 'all', p_type text default 'all', p_page integer default 1
)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare v_result jsonb;
begin
  if not public.is_platform_admin() then raise exception using errcode='42501',message='Platform administrator access required'; end if;
  if p_status is null or p_status not in ('all','active','suspended')
    or p_verification is null or p_verification not in ('all','verified','unverified')
    or p_type is null or p_type not in ('all','manufacturer','distributor')
    or p_page is null or p_page<1 or p_page>100000
    or length(coalesce(p_search,''))>200 then raise exception 'Invalid business filters'; end if;
  with eligible as (
    select b.*, p.full_name as owner_name from public.businesses b
    left join public.profiles p on p.id=b.owner_id
    where (p_status='all' or b.status=p_status)
      and (p_verification='all' or b.verification_status=p_verification)
      and (p_type='all' or b.business_type=p_type)
      and (coalesce(trim(p_search),'')='' or strpos(lower(b.company_name),lower(trim(p_search)))>0
        or strpos(lower(b.contact_email),lower(trim(p_search)))>0)
  ), paged as (select * from eligible order by created_at desc,id limit 15 offset ((p_page-1)::bigint*15))
  select jsonb_build_object('total',(select count(*) from eligible),'pageSize',15,
    'items',coalesce((select jsonb_agg(jsonb_build_object(
      'id',x.id,'companyName',x.company_name,'businessType',x.business_type,
      'contactEmail',x.contact_email,'ownerName',x.owner_name,
      'status',x.status,'verificationStatus',x.verification_status,'createdAt',x.created_at
    ) order by x.created_at desc,x.id) from paged x),'[]'::jsonb)) into v_result;
  return v_result;
end; $$;

create function public.get_platform_business(p_business_id uuid)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare v_result jsonb;
begin
  if not public.is_platform_admin() then raise exception using errcode='42501',message='Platform administrator access required'; end if;
  select jsonb_build_object(
    'business',jsonb_build_object(
      'id',b.id,'companyName',b.company_name,'businessType',b.business_type,
      'contactEmail',b.contact_email,'phone',b.contact_phone,'address',b.address,'gstin',b.gstin,
      'status',b.status,'verificationStatus',b.verification_status,'createdAt',b.created_at,'updatedAt',b.updated_at,
      'categoryName',c.name,'ownerName',p.full_name,'ownerEmail',u.email
    ),
    'metrics',jsonb_build_object(
      'stores',(select count(*) from public.stores s where s.business_id=b.id),
      'activeProducts',(select count(*) from public.products x join public.stores s on s.id=x.store_id where s.business_id=b.id and x.is_active),
      'activeDealers',(select count(distinct a.dealer_id) from public.dealer_store_access a where a.business_id=b.id and a.status='active'),
      'activeSalespeople',(select count(*) from public.business_memberships m where m.business_id=b.id and m.role='salesperson' and m.status='active'),
      'orders',(select count(*) from public.orders o where o.business_id=b.id),
      'submittedOrderValue',(select coalesce(sum(o.grand_total),0) from public.orders o where o.business_id=b.id)
    ),
    'subscription',(select jsonb_build_object('planName',pl.name,'status',bs.status,'startsAt',bs.starts_at,'endsAt',bs.ends_at)
      from public.business_subscriptions bs join public.subscription_plans pl on pl.id=bs.plan_id where bs.business_id=b.id)
  ) into v_result from public.businesses b
  left join public.business_categories c on c.id=b.category_id
  left join public.profiles p on p.id=b.owner_id
  left join auth.users u on u.id=b.owner_id
  where b.id=p_business_id;
  if not found then raise exception 'Business unavailable'; end if;
  return v_result;
end; $$;

create function public.get_platform_users(
  p_search text default '', p_role text default 'all', p_page integer default 1
)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare v_result jsonb;
begin
  if not public.is_platform_admin() then raise exception using errcode='42501',message='Platform administrator access required'; end if;
  if p_role is null or p_role not in ('all','super_admin','business_admin','dealer','salesperson')
    or p_page is null or p_page<1 or p_page>100000 or length(coalesce(p_search,''))>200
  then raise exception 'Invalid user filters'; end if;
  with people as (
    select u.id,u.email,u.email_confirmed_at,u.created_at,p.full_name,p.phone,
      array_remove(array[
        case when exists(select 1 from public.platform_admins a where a.user_id=u.id) then 'super_admin' end,
        case when exists(select 1 from public.business_memberships m where m.user_id=u.id and m.role='business_admin') then 'business_admin' end,
        case when exists(select 1 from public.dealer_profiles d where d.user_id=u.id) then 'dealer' end,
        case when exists(select 1 from public.business_memberships m where m.user_id=u.id and m.role='salesperson') then 'salesperson' end
      ]::text[],null) as roles,
      (select count(distinct m.business_id) from public.business_memberships m where m.user_id=u.id) as business_count
    from auth.users u left join public.profiles p on p.id=u.id
    where coalesce(trim(p_search),'')='' or strpos(lower(coalesce(u.email,'')),lower(trim(p_search)))>0
      or strpos(lower(coalesce(p.full_name,'')),lower(trim(p_search)))>0
  ), eligible as (select * from people where p_role='all' or p_role=any(roles)),
  paged as (select * from eligible order by created_at desc,id limit 15 offset ((p_page-1)::bigint*15))
  select jsonb_build_object('total',(select count(*) from eligible),'pageSize',15,
    'items',coalesce((select jsonb_agg(jsonb_build_object(
      'id',x.id,'email',x.email,'name',x.full_name,'phone',x.phone,
      'emailVerified',x.email_confirmed_at is not null,'createdAt',x.created_at,
      'roles',to_jsonb(x.roles),'businessCount',x.business_count
    ) order by x.created_at desc,x.id) from paged x),'[]'::jsonb)) into v_result;
  return v_result;
end; $$;

do $$ declare signature text; begin
  foreach signature in array array[
    'get_platform_overview()',
    'get_platform_businesses(text,text,text,text,integer)',
    'get_platform_business(uuid)',
    'get_platform_users(text,text,integer)'
  ] loop
    execute 'revoke all on function public.'||signature||' from public, anon';
    execute 'grant execute on function public.'||signature||' to authenticated';
  end loop;
end; $$;
commit;
