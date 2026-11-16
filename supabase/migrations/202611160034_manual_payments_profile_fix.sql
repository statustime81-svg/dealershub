begin;
create or replace function public.update_business_profile(p_business_id uuid,p_expected_updated_at timestamptz,p_name text,p_email text,p_phone text,p_address text,p_gstin text,p_category_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare b public.businesses;
begin
 if not public.can_manage_business(p_business_id) then raise exception 'Business access required' using errcode='42501';end if;
 select * into b from public.businesses where id=p_business_id for update;
 if not public.can_manage_business(p_business_id) then raise exception 'Business access required' using errcode='42501';end if;
 if p_expected_updated_at is null or b.updated_at<>p_expected_updated_at then raise exception 'Business changed; refresh';end if;
 if p_name is null or length(trim(p_name)) not between 1 and 200 or p_email is null or length(p_email)>254 or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or length(coalesce(p_phone,''))>30 or length(coalesce(p_address,''))>2000 or length(coalesce(p_gstin,''))>30 then raise exception 'Invalid profile';end if;
 if p_category_id is not null and p_category_id is distinct from b.category_id and not exists(select 1 from public.business_categories where id=p_category_id and is_active) then raise exception 'Category unavailable';end if;
 update public.businesses set company_name=trim(p_name),contact_email=trim(p_email),contact_phone=nullif(trim(p_phone),''),address=nullif(trim(p_address),''),gstin=nullif(trim(p_gstin),''),category_id=p_category_id where id=p_business_id;
end $$;

revoke all on function public.update_business_profile(uuid,timestamptz,text,text,text,text,text,uuid) from public,anon;
grant execute on function public.update_business_profile(uuid,timestamptz,text,text,text,text,text,uuid) to authenticated;
create or replace function public.save_checkout_policy(p_business_id uuid,p_expected_revision bigint,p_config jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_revision bigint;
begin
 perform 1 from public.businesses where id=p_business_id and status='active' for update;
 if not found or not public.can_manage_business(p_business_id) then raise exception 'Business administrator required' using errcode='42501'; end if;
 if p_expected_revision is null or p_expected_revision<0 then raise exception 'Reload checkout settings before saving';end if;
 if p_config is null or jsonb_typeof(p_config)<>'object' then raise exception 'Complete checkout settings'; end if;
 if (p_config->>'taxMode') is null or p_config->>'taxMode' not in ('extra','included')
 or (p_config->>'paymentMode') is null or p_config->>'paymentMode'<>'manual'
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


-- Preserve simulated order snapshots and receipts. Only NEW orders become manual.
update public.business_checkout_policies set config=jsonb_set(config,'{paymentMode}','"manual"'::jsonb),revision=revision+1,updated_at=now() where config->>'paymentMode' is distinct from 'manual';
-- Disable every gateway RPC, including service-role access. Historical rows remain read-only evidence.
do $$ declare f record; begin
 for f in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and (p.proname in ('prepare_checkout_test_payment','settle_checkout_test_payment') or p.proname like '%razorpay%' or p.proname like '%test_payment%' or p.proname like '%test_order%') loop
 execute format('revoke all on function %s from public, anon, authenticated, service_role',f.signature);
 end loop;
end $$;
notify pgrst,'reload schema';
commit;
