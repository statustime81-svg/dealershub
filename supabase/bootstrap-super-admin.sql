-- OPERATOR TEMPLATE ONLY. NOT A MIGRATION. INSTALLER DOES NOT EXECUTE THIS.
-- 1. Create the intended account through normal Supabase Auth signup.
-- 2. Verify its email and identify its exact Auth UUID and email.
-- 3. Replace BOTH values below and review the target before running manually.
-- Never use a service-role key in the frontend and never promote from user metadata.
begin;
do $$
declare
  v_user_id uuid := 'REPLACE_WITH_VERIFIED_AUTH_USER_UUID'::uuid;
  v_email text := lower('REPLACE_WITH_EXACT_VERIFIED_EMAIL');
begin
  if not exists(select 1 from auth.users where id=v_user_id and lower(email)=v_email and email_confirmed_at is not null)
    then raise exception 'UUID/email do not match a verified account'; end if;
  if not exists(select 1 from public.profiles where id=v_user_id)
    then raise exception 'User profile missing. Verify earlier migrations'; end if;
  insert into public.platform_admins(user_id) values(v_user_id) on conflict(user_id) do nothing;
end;
$$;
commit;
