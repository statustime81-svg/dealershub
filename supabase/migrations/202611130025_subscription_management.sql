begin;
alter table public.subscription_plans add column revision bigint not null default 1;
alter table public.business_subscriptions add column revision bigint not null default 1;
revoke insert,update,delete on public.subscription_plans,public.business_subscriptions from authenticated;
create function public.get_platform_plans(p_search text default '',p_page integer default 1)
returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not public.is_platform_admin() then raise exception 'Platform administrator access required' using errcode='42501';end if;
 if p_search is null or length(p_search)>200 or p_page is null or p_page not between 1 and 100000 then raise exception 'Invalid filters';end if;
 return (with filtered as(select * from public.subscription_plans where strpos(lower(name),lower(trim(p_search)))>0),
 paged as(select * from filtered order by lower(name),id limit 15 offset (p_page-1)*15)
 select jsonb_build_object('items',coalesce((select jsonb_agg(to_jsonb(x) order by lower(x.name),x.id) from paged x),'[]'::jsonb),'total',(select count(*) from filtered),'pageSize',15));
end $$;
create function public.get_platform_subscription(p_business_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not public.is_platform_admin() then raise exception 'Platform administrator access required' using errcode='42501';end if;
 if not exists(select 1 from public.businesses where id=p_business_id) then raise exception 'Business unavailable';end if;
 return (select to_jsonb(s) from public.business_subscriptions s where business_id=p_business_id);
end $$;
create function public.save_platform_subscription_config(p_actor_id uuid,p_request_key uuid,p_kind text,p_id uuid,p_revision bigint,p_values jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare old jsonb; saved jsonb; payload jsonb; replay public.platform_configuration_actions; v public.subscription_plans; s public.business_subscriptions;
begin
 perform 1 from public.platform_admins where user_id=p_actor_id for key share;
 if not found then raise exception 'Platform administrator access required' using errcode='42501';end if;
 if p_kind is null or p_kind not in ('plan','subscription') or p_id is null or p_request_key is null or p_values is null or jsonb_typeof(p_values)<>'object' then raise exception 'Invalid configuration';end if;
 payload:=jsonb_build_object('id',p_id,'revision',p_revision,'values',p_values);
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_actor_id::text||p_request_key::text,0));
 select * into replay from public.platform_configuration_actions where actor_id=p_actor_id and request_key=p_request_key;
 if found then
  if replay.kind<>p_kind or replay.payload<>payload then raise exception 'Request key reused';end if;
  return jsonb_build_object('success',true,'id',replay.target_id);
 end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('platform-config:'||p_kind,0));
 if p_kind='plan' then
  if exists(select 1 from jsonb_object_keys(p_values) k where k not in ('name','slug','description','price_amount','currency','billing_interval','max_products','max_dealers','max_salespeople','max_stores','max_storage_bytes','is_active')) then raise exception 'Invalid plan fields';end if;
  v:=jsonb_populate_record(null::public.subscription_plans,p_values);
  if v.name is null or length(trim(v.name)) not between 1 and 150 or v.slug is null or length(v.slug)>100 or v.slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or v.currency is null or v.currency !~ '^[A-Z]{3}$' or v.is_active is null or length(coalesce(v.description,''))>3000 then raise exception 'Invalid plan';end if;
  select to_jsonb(x) into old from public.subscription_plans x where id=p_id for update;
  if exists(select 1 from public.subscription_plans where id<>p_id and (lower(trim(name))=lower(trim(v.name)) or slug=v.slug)) then raise exception 'Name or slug already exists';end if;
  if old is null and p_revision is not null or old is not null and (p_revision is null or (old->>'revision')::bigint<>p_revision) then raise exception 'Plan changed; refresh';end if;
  if old is null then
   insert into public.subscription_plans(id,name,slug,description,price_amount,currency,billing_interval,max_products,max_dealers,max_salespeople,max_stores,max_storage_bytes,is_active)
   values(p_id,trim(v.name),v.slug,nullif(v.description,''),v.price_amount,v.currency,v.billing_interval,v.max_products,v.max_dealers,v.max_salespeople,v.max_stores,v.max_storage_bytes,v.is_active);
  else
   update public.subscription_plans set name=trim(v.name),slug=v.slug,description=nullif(v.description,''),price_amount=v.price_amount,currency=v.currency,billing_interval=v.billing_interval,max_products=v.max_products,max_dealers=v.max_dealers,max_salespeople=v.max_salespeople,max_stores=v.max_stores,max_storage_bytes=v.max_storage_bytes,is_active=v.is_active,revision=revision+1 where id=p_id;
  end if;
  select to_jsonb(x) into saved from public.subscription_plans x where id=p_id;
 else
  if exists(select 1 from jsonb_object_keys(p_values) k where k not in ('business_id','plan_id','status','starts_at','ends_at')) then raise exception 'Invalid subscription fields';end if;
  s:=jsonb_populate_record(null::public.business_subscriptions,p_values);
  if s.business_id is null or s.plan_id is null or s.starts_at is null or s.status is null then raise exception 'Invalid subscription';end if;
  perform 1 from public.businesses where id=s.business_id for key share;
  if not found then raise exception 'Business unavailable';end if;
  select to_jsonb(x) into old from public.business_subscriptions x where business_id=s.business_id for update;
  if old is null and p_revision is not null or old is not null and (old->>'id'<>p_id::text or p_revision is null or (old->>'revision')::bigint<>p_revision) then raise exception 'Subscription changed; refresh';end if;
  -- Existing inactive plan can be retained, but cannot be newly assigned.
  perform 1 from public.subscription_plans where id=s.plan_id and (is_active or old->>'plan_id'=s.plan_id::text) for key share;
  if not found then raise exception 'Plan unavailable';end if;
  if old is null then
   insert into public.business_subscriptions(id,business_id,plan_id,status,starts_at,ends_at) values(p_id,s.business_id,s.plan_id,s.status,s.starts_at,s.ends_at);
  else
   update public.business_subscriptions set plan_id=s.plan_id,status=s.status,starts_at=s.starts_at,ends_at=s.ends_at,revision=revision+1 where id=p_id;
  end if;
  select to_jsonb(x) into saved from public.business_subscriptions x where id=p_id;
 end if;
 insert into public.platform_configuration_actions(actor_id,request_key,kind,target_id,payload,before_data,after_data) values(p_actor_id,p_request_key,p_kind,p_id,payload,old,saved);
 return jsonb_build_object('success',true,'id',p_id);
end $$;
revoke all on function public.get_platform_plans(text,integer), public.get_platform_subscription(uuid) from public,anon;
grant execute on function public.get_platform_plans(text,integer),public.get_platform_subscription(uuid) to authenticated;
revoke all on function public.save_platform_subscription_config(uuid,uuid,text,uuid,bigint,jsonb) from public,anon,authenticated;
grant execute on function public.save_platform_subscription_config(uuid,uuid,text,uuid,bigint,jsonb) to service_role;
commit;
