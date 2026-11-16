begin;
-- Atomic team-account access. No invitation is created or emailed.
create or replace function public.finalize_managed_account(p_actor_id uuid,p_user_id uuid,p_business_id uuid,p_store_id uuid,p_role text,p_full_name text,p_company_name text)
returns jsonb language plpgsql security definer set search_path='' as $$
begin
 perform 1 from public.businesses where id=p_business_id and status='active' for update;
 if not found then raise exception 'Business unavailable'; end if;
 if not exists(select 1 from public.business_memberships where business_id=p_business_id and user_id=p_actor_id and role='business_admin' and status='active') then raise exception 'Business administrator required'; end if;
 if p_role is null or p_role not in ('dealer','salesperson') then raise exception 'Invalid role'; end if;
 if nullif(trim(p_full_name),'') is null or length(p_full_name)>200 then raise exception 'Full name required'; end if;
 if not exists(select 1 from auth.users where id=p_user_id and email_confirmed_at is not null and raw_app_meta_data->>'managed_by'=p_actor_id::text and raw_app_meta_data->>'managed_business'=p_business_id::text) then raise exception 'Managed account unavailable'; end if;
 insert into public.profiles(id,full_name) values(p_user_id,trim(p_full_name)) on conflict(id) do update set full_name=excluded.full_name;
 if p_role='dealer' then
  if nullif(trim(p_company_name),'') is null or length(p_company_name)>200 or p_store_id is null then raise exception 'Dealer store/company required'; end if;
  if not exists(select 1 from public.stores where id=p_store_id and business_id=p_business_id) then raise exception 'Store unavailable'; end if;
  insert into public.dealer_profiles(user_id,company_name) values(p_user_id,trim(p_company_name));
  insert into public.dealer_store_access(business_id,store_id,dealer_id,status) values(p_business_id,p_store_id,p_user_id,'active');
 else
  if p_store_id is not null then raise exception 'Invalid salesperson store'; end if;
  insert into public.business_memberships(business_id,user_id,role,status) values(p_business_id,p_user_id,'salesperson','active');
 end if;
 return jsonb_build_object('userId',p_user_id,'role',p_role,'businessId',p_business_id);
end; $$;
revoke all on function public.finalize_managed_account(uuid,uuid,uuid,uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.finalize_managed_account(uuid,uuid,uuid,uuid,text,text,text) to service_role;

create or replace function public.finalize_manufacturer_account(p_actor_id uuid,p_user_id uuid,p_request_key uuid,p_full_name text,p_company_name text,p_email text,p_store_name text,p_store_slug text)
returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.platform_admins where user_id=p_actor_id) then raise exception 'Super Admin required'; end if;
 if not exists(select 1 from auth.users where id=p_user_id and email_confirmed_at is not null and lower(email)=lower(p_email) and raw_app_meta_data->>'managed_by'=p_actor_id::text) then raise exception 'Managed owner unavailable'; end if;
 if nullif(trim(p_full_name),'') is null or length(p_full_name)>150 then raise exception 'Owner name required'; end if;
 if nullif(trim(p_company_name),'') is null or length(p_company_name)>200 or nullif(trim(p_store_name),'') is null or length(p_store_name)>200 then raise exception 'Company/store name required'; end if;
 if p_store_slug is null or length(p_store_slug)>100 or p_store_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then raise exception 'Invalid store slug'; end if;
 insert into public.profiles(id,full_name) values(p_user_id,trim(p_full_name)) on conflict(id) do update set full_name=excluded.full_name;
 return public.onboard_business(p_user_id,p_request_key,'manufacturer',p_company_name,p_email,null,null,null,null,p_store_name,p_store_slug);
end; $$;
revoke all on function public.finalize_manufacturer_account(uuid,uuid,uuid,text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.finalize_manufacturer_account(uuid,uuid,uuid,text,text,text,text,text) to service_role;

-- Password changes affect an entire Auth account, not just one business.
-- Business admins may reset exclusive dealer/salesperson accounts only.
create or replace function public.can_admin_reset_account(p_actor_id uuid,p_user_id uuid,p_business_id uuid default null)
returns boolean language plpgsql stable security definer set search_path='' as $$
begin
 if p_actor_id=p_user_id then return false; end if;
 if not exists(select 1 from auth.users where id=p_user_id) then return false; end if;
 if exists(select 1 from public.platform_admins where user_id=p_user_id) then return false; end if;
 if exists(select 1 from public.platform_admins where user_id=p_actor_id) then return true; end if;
 if p_business_id is null or not exists(select 1 from public.businesses where id=p_business_id and status='active') then return false; end if;
 if not exists(select 1 from public.business_memberships where business_id=p_business_id and user_id=p_actor_id and role='business_admin' and status='active') then return false; end if;
 if exists(select 1 from public.businesses where owner_id=p_user_id) then return false; end if;
 if exists(select 1 from public.business_memberships where user_id=p_user_id and (role='business_admin' or business_id<>p_business_id)) then return false; end if;
 if exists(select 1 from public.dealer_store_access where dealer_id=p_user_id and business_id<>p_business_id) then return false; end if;
 return exists(select 1 from public.business_memberships where user_id=p_user_id and business_id=p_business_id and role='salesperson') or exists(select 1 from public.dealer_store_access where dealer_id=p_user_id and business_id=p_business_id);
end; $$;
revoke all on function public.can_admin_reset_account(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.can_admin_reset_account(uuid,uuid,uuid) to service_role;
-- Retired public onboarding/acceptance handlers cannot call these helpers.
-- finalize_manufacturer_account still calls onboard_business as its definer.
revoke execute on function public.onboard_business(uuid,uuid,text,text,text,text,text,text,uuid,text,text) from service_role;
revoke execute on function public.accept_business_invitation(uuid,uuid,text) from service_role;
commit;
