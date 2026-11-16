begin;
-- Read-only blocker check; called only by trusted server code and deletion trigger.
create or replace function public.user_deletion_blocker(p_user_id uuid)
returns text language plpgsql stable security definer set search_path='' as $$
begin
 if exists(select 1 from public.platform_admins where user_id=p_user_id) then return 'Super Admin accounts cannot be deleted here.'; end if;
 if exists(select 1 from public.businesses where owner_id=p_user_id) then return 'This user owns a business. Business ownership must be resolved before account deletion.'; end if;
 if exists(select 1 from public.orders where dealer_id=p_user_id or salesperson_id=p_user_id or created_by=p_user_id) then return 'This account has order history and cannot be permanently deleted.'; end if;
 if exists(select 1 from public.order_status_history where changed_by=p_user_id) or exists(select 1 from public.order_documents where uploaded_by=p_user_id) then return 'This account is linked to order history or documents and cannot be permanently deleted.'; end if;
 if exists(select 1 from public.orders where source_cart_id in(select id from public.carts where dealer_id=p_user_id or created_by=p_user_id)) then return 'A cart linked to this account has order history.'; end if;
 if exists(select 1 from public.platform_business_actions where actor_id=p_user_id) or exists(select 1 from public.platform_configuration_actions where actor_id=p_user_id) then return 'This account has administrator audit history and cannot be permanently deleted.'; end if;
 if exists(select 1 from storage.objects o where to_jsonb(o)->>'owner_id'=p_user_id::text or to_jsonb(o)->>'owner'=p_user_id::text) then return 'This account owns uploaded files. Resolve file ownership through Storage before deleting the account.'; end if;
 return null;
end; $$;
revoke all on function public.user_deletion_blocker(uuid) from public,anon,authenticated;
grant execute on function public.user_deletion_blocker(uuid) to service_role;

-- All cleanup runs INSIDE the Auth deletion database transaction.
-- If a protected/unknown FK blocks deletion, none of these deletes commit.
create or replace function public.cleanup_unused_account_profile()
returns trigger language plpgsql security definer set search_path='' as $$
declare v_reason text;
begin
 v_reason:=public.user_deletion_blocker(old.id);
 if v_reason is not null then raise exception '%',v_reason using errcode='23503'; end if;
 delete from public.carts where dealer_id=old.id or created_by=old.id;
 delete from public.salesperson_dealer_assignments where dealer_id=old.id or salesperson_id=old.id;
 delete from public.dealer_store_access where dealer_id=old.id;
 -- Old invitation rows are obsolete after the admin-only-account migration.
 delete from public.invitations where invited_user_id=old.id or invited_by=old.id;
 -- Profile -> dealer_profiles / business_memberships use existing FK cascades.
 return old;
end; $$;
revoke all on function public.cleanup_unused_account_profile() from public,anon,authenticated,service_role;
drop trigger if exists cleanup_unused_account_before_delete on public.profiles;
create trigger cleanup_unused_account_before_delete before delete on public.profiles for each row execute function public.cleanup_unused_account_profile();
commit;
