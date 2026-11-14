begin;
-- Additive migration for the current uploaded 001-023 schema. No seed/deletion.
alter table public.business_categories add column revision bigint not null default 1;
alter table public.product_categories add column revision bigint not null default 1;
alter table public.brands add column revision bigint not null default 1;
create table public.platform_configuration_actions (
 id uuid primary key default gen_random_uuid(), actor_id uuid not null references public.profiles(id),
 request_key uuid not null, kind text not null, target_id uuid not null,
 payload jsonb not null, before_data jsonb, after_data jsonb not null,
 created_at timestamptz not null default clock_timestamp(), unique(actor_id,request_key)
);
alter table public.platform_configuration_actions enable row level security;
grant select on public.platform_configuration_actions to authenticated;
create policy configuration_admin_read on public.platform_configuration_actions for select to authenticated using(public.is_platform_admin());
revoke insert,update,delete on public.business_categories,public.product_categories,public.brands from authenticated;
create function public.get_platform_taxonomy(p_kind text,p_search text default '',p_state text default 'all',p_page integer default 1)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare t text; result jsonb;
begin
 if not public.is_platform_admin() then raise exception 'Platform administrator access required' using errcode='42501'; end if;
 t:=case p_kind when 'business_categories' then 'business_categories' when 'product_categories' then 'product_categories' when 'brands' then 'brands' end;
 if t is null or p_search is null or length(p_search)>200 or p_state is null or p_state not in ('all','active','inactive') or p_page is null or p_page not between 1 and 100000 then raise exception 'Invalid filters'; end if;
 execute format($q$
 with filtered as (select id,name,slug,is_active,revision from public.%I
 where strpos(lower(name),lower(trim($1)))>0 and ($2='all' or is_active=($2='active'))),
 paged as (select * from filtered order by lower(name),id limit 15 offset ($3-1)*15)
 select jsonb_build_object('items',coalesce((select jsonb_agg(to_jsonb(x) order by lower(x.name),x.id) from paged x),'[]'::jsonb),
 'total',(select count(*) from filtered),'pageSize',15) $q$,t) into result using p_search,p_state,p_page;
 return result;
end $$;
revoke all on function public.get_platform_taxonomy(text,text,text,integer) from public,anon;
grant execute on function public.get_platform_taxonomy(text,text,text,integer) to authenticated;
create function public.save_platform_taxonomy(p_actor_id uuid,p_request_key uuid,p_kind text,p_id uuid,p_revision bigint,p_name text,p_slug text,p_active boolean)
returns jsonb language plpgsql security definer set search_path='' as $$
declare t text; old jsonb; saved jsonb; replay public.platform_configuration_actions; payload jsonb;
begin
 perform 1 from public.platform_admins where user_id=p_actor_id for key share;
 if not found then raise exception 'Platform administrator access required' using errcode='42501';end if;
 t:=case p_kind when 'business_categories' then 'business_categories' when 'product_categories' then 'product_categories' when 'brands' then 'brands' end;
 if t is null or p_id is null or p_request_key is null or p_name is null or length(trim(p_name)) not between 1 and 150 or p_slug is null or length(p_slug) not between 1 and 100 or p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or p_active is null then raise exception 'Invalid taxonomy';end if;
 payload:=jsonb_build_object('id',p_id,'revision',p_revision,'name',trim(p_name),'slug',p_slug,'active',p_active);
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_actor_id::text||p_request_key::text,0));
 select * into replay from public.platform_configuration_actions where actor_id=p_actor_id and request_key=p_request_key;
 if found then
  if replay.kind<>p_kind or replay.payload<>payload then raise exception 'Request key reused';end if;
  return jsonb_build_object('success',true,'id',replay.target_id);
 end if;
 -- Serialize taxonomy writes and duplicate-name validation per kind.
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('taxonomy:'||t,0));
 execute format('select to_jsonb(x) from public.%I x where id=$1 for update',t) into old using p_id;
 if old is null and p_revision is not null then raise exception 'Taxonomy changed; refresh';end if;
 if old is not null and (p_revision is null or (old->>'revision')::bigint<>p_revision) then raise exception 'Taxonomy changed; refresh';end if;
 execute format('select to_jsonb(x) from public.%I x where id<>$1 and (lower(trim(name))=lower(trim($2)) or slug=$3) limit 1',t) into saved using p_id,p_name,p_slug;
 if saved is not null then raise exception 'Name or slug already exists';end if;
 if old is null then
  execute format('insert into public.%I(id,name,slug,is_active) values($1,$2,$3,$4) returning to_jsonb(%I.*)',t,t) into saved using p_id,trim(p_name),p_slug,p_active;
 else
  execute format('update public.%I set name=$2,slug=$3,is_active=$4,revision=revision+1 where id=$1 returning to_jsonb(%I.*)',t,t) into saved using p_id,trim(p_name),p_slug,p_active;
 end if;
 insert into public.platform_configuration_actions(actor_id,request_key,kind,target_id,payload,before_data,after_data) values(p_actor_id,p_request_key,p_kind,p_id,payload,old,saved);
 return jsonb_build_object('success',true,'id',p_id);
end $$;
revoke all on function public.save_platform_taxonomy(uuid,uuid,text,uuid,bigint,text,text,boolean) from public,anon,authenticated;
grant execute on function public.save_platform_taxonomy(uuid,uuid,text,uuid,bigint,text,text,boolean) to service_role;
commit;
