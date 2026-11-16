begin;
-- Service-only finalization, atomic business access + accepted invitation audit.
create or replace function public.finalize_managed_account(
 p_actor_id uuid, p_user_id uuid, p_business_id uuid, p_store_id uuid,
 p_role text, p_full_name text, p_company_name text
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_email text; v_id uuid; v_result jsonb;
begin
 perform 1 from public.businesses where id=p_business_id and status='active' for update;
 if not found then raise exception 'Business unavailable'; end if;
 if not exists(select 1 from public.business_memberships where business_id=p_business_id and user_id=p_actor_id and role='business_admin' and status='active') then raise exception 'Business administrator access required'; end if;
 if p_role not in ('dealer','salesperson') or p_role is null then raise exception 'Invalid role'; end if;
 if nullif(trim(p_full_name),'') is null or length(p_full_name)>200 then raise exception 'Full name required'; end if;
 if p_role='dealer' and (p_store_id is null or nullif(trim(p_company_name),'') is null or length(p_company_name)>200) then raise exception 'Dealer store and company required'; end if;
 if p_role='salesperson' and p_store_id is not null then raise exception 'Invalid salesperson store'; end if;
 if p_role='dealer' and not exists(select 1 from public.stores where id=p_store_id and business_id=p_business_id) then raise exception 'Store unavailable'; end if;
 select lower(email) into v_email from auth.users where id=p_user_id and email_confirmed_at is not null
 and raw_app_meta_data->>'managed_by'=p_actor_id::text and raw_app_meta_data->>'managed_business'=p_business_id::text;
 if v_email is null then raise exception 'Managed account unavailable'; end if;
 insert into public.profiles(id,full_name) values(p_user_id,trim(p_full_name)) on conflict(id) do update set full_name=excluded.full_name;
 -- Only pending requests for this same business/account/role are superseded.
 update public.invitations set status='revoked' where business_id=p_business_id and email=v_email and target_role=p_role and status='pending' and store_id is not distinct from p_store_id;
 insert into public.invitations(business_id,store_id,email,target_role,invited_user_id,invited_by,status,expires_at)
 values(p_business_id,p_store_id,v_email,p_role,p_user_id,p_actor_id,'pending',now()+interval '5 minutes') returning id into v_id;
 v_result:=public.accept_business_invitation(p_user_id,v_id,p_company_name);
 return jsonb_build_object('invitationId',v_id,'userId',p_user_id,'role',p_role);
end; $$;
revoke all on function public.finalize_managed_account(uuid,uuid,uuid,uuid,text,text,text) from public, anon, authenticated;
grant execute on function public.finalize_managed_account(uuid,uuid,uuid,uuid,text,text,text) to service_role;
commit;
