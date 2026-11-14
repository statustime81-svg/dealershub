begin;
create table public.platform_business_actions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id),
  actor_id uuid not null references public.profiles(id),
  request_key uuid not null,
  expected_updated_at timestamptz not null,
  before_data jsonb not null, after_data jsonb not null,
  note text, created_at timestamptz not null default now(),
  unique(actor_id,request_key)
);
create index platform_business_actions_business_idx
on public.platform_business_actions(business_id,created_at desc);
alter table public.platform_business_actions enable row level security;
revoke all on public.platform_business_actions from public,anon,authenticated;
grant select on public.platform_business_actions to authenticated;
create policy platform_actions_read on public.platform_business_actions
for select to authenticated using(public.is_platform_admin());

create function public.update_platform_business(
  p_actor_id uuid,p_business_id uuid,p_expected_updated_at timestamptz,
  p_status text,p_verification text,p_request_key uuid,p_note text default null
)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_business public.businesses%rowtype; v_existing public.platform_business_actions%rowtype;
  v_before jsonb; v_after jsonb; v_note text:=nullif(trim(p_note),'');
begin
  perform 1 from public.platform_admins where user_id=p_actor_id for key share;
  if not found then raise exception using errcode='42501',message='Platform administrator access required'; end if;
  if p_request_key is null or p_expected_updated_at is null
    or p_status is null or p_status not in ('active','suspended')
    or p_verification is null or p_verification not in ('verified','unverified')
    or length(coalesce(p_note,''))>2000 then raise exception 'Invalid business action'; end if;
  select * into v_business from public.businesses where id=p_business_id for update;
  if not found then raise exception 'Business unavailable'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_actor_id::text||':'||p_request_key::text,0));
  v_after:=jsonb_build_object('status',p_status,'verificationStatus',p_verification);
  select * into v_existing from public.platform_business_actions where actor_id=p_actor_id and request_key=p_request_key;
  if found then
    if v_existing.business_id is distinct from p_business_id
      or v_existing.expected_updated_at is distinct from p_expected_updated_at
      or v_existing.after_data is distinct from v_after or v_existing.note is distinct from v_note
    then raise exception 'Action request key reused with different data'; end if;
    return jsonb_build_object('businessId',p_business_id,'alreadyUpdated',true);
  end if;
  if v_business.updated_at<>p_expected_updated_at then raise exception 'Business changed. Refresh before updating'; end if;
  v_before:=jsonb_build_object('status',v_business.status,'verificationStatus',v_business.verification_status);
  update public.businesses set status=p_status,verification_status=p_verification,updated_at=now() where id=p_business_id;
  insert into public.platform_business_actions(business_id,actor_id,request_key,expected_updated_at,before_data,after_data,note)
  values(p_business_id,p_actor_id,p_request_key,p_expected_updated_at,v_before,v_after,v_note);
  return jsonb_build_object('businessId',p_business_id,'alreadyUpdated',false);
end; $$;

create function public.get_platform_business_actions(p_business_id uuid)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$ declare v_result jsonb; begin
  if not public.is_platform_admin() then raise exception using errcode='42501',message='Platform administrator access required'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',x.id,'actorName',x.full_name,'before',x.before_data,'after',x.after_data,
    'note',x.note,'createdAt',x.created_at
  ) order by x.created_at desc,x.id),'[]'::jsonb) into v_result
  from (select a.*,p.full_name from public.platform_business_actions a
    left join public.profiles p on p.id=a.actor_id where a.business_id=p_business_id
    order by a.created_at desc,a.id limit 20) x;
  return v_result;
end; $$;
revoke all on function public.update_platform_business(uuid,uuid,timestamptz,text,text,uuid,text) from public,anon,authenticated;
grant execute on function public.update_platform_business(uuid,uuid,timestamptz,text,text,uuid,text) to service_role;
revoke all on function public.get_platform_business_actions(uuid) from public,anon;
grant execute on function public.get_platform_business_actions(uuid) to authenticated;
commit;
